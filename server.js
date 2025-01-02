import { PrismaClient } from "@prisma/client";
import e from "express";
import helmet from "helmet";
import { body, oneOf } from "express-validator";
import encryptPassword from "./utils/encrptPassword.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import handleValidation from "./middleware/handleValidation.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import generateResetToken from "./utils/generateResetToken.js";
import crypto from "crypto";
import handleAuthentication from "./middleware/handleAuthentication.js";

const app = e();
const prisma = new PrismaClient();

app.use(e.json());
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

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
            return Promise.reject(
              "An account with this username already exists"
            );
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

const forgotPasswordValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email")
    .bail()
    .normalizeEmail()
    .custom((value) => {
      return prisma.user
        .findUnique({ where: { email: value } })
        .then((user) => {
          if (!user) {
            return Promise.reject("No account with this email exists");
          }
        });
    }),
];

const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Token is required").escape(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .escape(),
];

const changePasswordValidator = [
  body("current_password")
    .notEmpty()
    .withMessage("Current password is required")
    .bail()
    .escape(),
  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .escape(),
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
        status: "success",
        message: "User registered successfully",
        data: {
          email: user.email,
          username: user.username,
          name: user.name,
          profileImage: user.profileImage,
        },
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
        return res
          .status(401)
          .json({ status: "error", message: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        status: "success",
        message: "User logged in successfully",
        data: {
          email: user.email,
          username: user.username,
          name: user.name,
          profileImage: user.profileImage,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

app.post(
  "/user/forgot-password",
  forgotPasswordValidator,
  handleValidation,
  async (req, res) => {
    try {
      const { email } = req.body;
      const { token, hashedToken } = generateResetToken();

      await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          resetToken: hashedToken,
          resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await axios.post(`${process.env.SM_AWS_API_URL}/send-reset-password`, {
        email,
        token,
      });

      return res.json({
        status: "success",
        message: "Reset password link sent to your email",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
);

app.post(
  "/user/reset-password",
  resetPasswordValidator,
  handleValidation,
  async (req, res) => {
    try {
      const { token, password } = req.body;
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const hashedPassword = await encryptPassword(password);
      const user = await prisma.user.findFirst({
        where: {
          AND: [
            { resetToken: hashedToken },
            {
              resetTokenExpiresAt: {
                gt: new Date(),
              },
            },
          ],
        },
      });
      if (!user) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired token",
        });
      }
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiresAt: null,
          updatedAt: new Date(),
        },
      });
      return res.json({
        status: "success",
        message: "Password reset successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
);

app.put(
  "/user/change-password",
  handleAuthentication,
  changePasswordValidator,
  handleValidation,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not found",
        });
      }
      const isPasswordValid = await bcrypt.compare(
        current_password,
        user.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          status: "error",
          message: "Current password is incorrect",
        });
      }
      const hashedPassword = await encryptPassword(new_password);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
      return res.json({
        status: "success",
        message: "Password changed successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
);

app.get("/user/profile", handleAuthentication, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }
    return res.json({
      status: "success",
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});
