import { PrismaClient } from "@prisma/client";
import e from "express";
import helmet from "helmet";
import { body, oneOf } from "express-validator";
import encryptPassword from "./utils/encrptPassword.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import handleValidation from "./middleware/handleValidation.js";

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
    .isLength({ min: 6 })
    .withMessage("Username must be at least 6 characters long")
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
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .escape(),
  body("name").notEmpty().withMessage("Name is required").escape(),
];

const userLoginValidator = [
  body("username").notEmpty().withMessage("Username is required").escape(),
  body("password").notEmpty().withMessage("Password is required").escape(),
];

const userNameEmailValidator = [
  oneOf([
    body("username").notEmpty().withMessage("Username is required").escape(),
    body("username").isEmail().normalizeEmail().withMessage("Invalid email"),
  ]),
];

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.post(
  "/user/register",
  userRegisterValidator,
  handleValidation,
  async (req, res) => {
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
  }
);

app.post(
  "/user/login",
  userLoginValidator,
  handleValidation,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            {
              email: username,
            },
            {
              username: username,
            },
          ],
        },
      });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
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
  }
);

app.post(
  "/user/check-username-email",
  userNameEmailValidator,
  handleValidation,
  async (req, res) => {
    try {
      const { username } = req.body;
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { contains: username, mode: "insensitive" } },
            { username: { contains: username, mode: "insensitive" } },
          ],
        },
      });
      if (user) {
        return res.json({
          exists: true,
          message: "Username or email already in use",
        });
      }
      return res.json({
        exists: false,
        message: "Username or email is available",
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);
