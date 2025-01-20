import { body, param } from "express-validator";
import { prisma } from "../index.js";

export const userRegisterValidator = [
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

export const userLoginValidator = [
  body("username").notEmpty().withMessage("Username is required").escape(),
  body("password").notEmpty().withMessage("Password is required").escape(),
];

export const forgotPasswordValidator = [
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

export const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Token is required").escape(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .escape(),
];

export const changePasswordValidator = [
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

const isBase64WithMimeType = (value) => {
  const regex =
    /^data:[a-zA-Z0-9/+]*;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return regex.test(value);
};

export const uploadProfileImageValidator = [
  body("profile_image").custom((value) => {
    if (!isBase64WithMimeType(value)) {
      return Promise.reject(
        "Profile image must be a base64 string with mime type"
      );
    }
    return Promise.resolve();
  }),
];

export const followValidator = [
  param("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .bail()
    .isNumeric()
    .withMessage("Invalid User ID")
    .bail()
    .custom((value) => {
      return prisma.user
        .findUnique({ where: { id: parseInt(value) } })
        .then((user) => {
          if (!user) {
            return Promise.reject("No account with this ID exists");
          }
        });
    }),
];
