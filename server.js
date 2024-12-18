import { PrismaClient } from "@prisma/client";
import e from "express";
import helmet from "helmet";
import { body, validationResult } from "express-validator";
import encryptPassword from "./utils/encrptPassword.js";

const app = e();
const prisma = new PrismaClient();

app.use(e.json());
app.use(helmet());

const userRegisterValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email")
    .bail()
    .normalizeEmail()
    .custom((value) => {
      return prisma.user
        .findUnique({ where: { email: value } })
        .then((user) => {
          if (user) {
            return Promise.reject("An account with this email already exists");
          }
        });
    }),
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .bail()
    .escape()
    .custom((value) => {
      return prisma.user
        .findUnique({ where: { username: value } })
        .then((user) => {
          if (user) {
            return Promise.reject("Username already in use");
          }
        });
    }),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("name").notEmpty().withMessage("Name is required").escape(),
];

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.post("/user/register", userRegisterValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((error) => ({ [error.path]: error.msg })),
    });
  }

  try {
    const hashedPassword = await encryptPassword(req.body.password);
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        username: req.body.username,
        name: req.body.name,
        password: hashedPassword,
      },
    });

    return res.json({
      email: user.email,
      username: user.username,
      name: user.name,
      profileImage: user.profileImage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
