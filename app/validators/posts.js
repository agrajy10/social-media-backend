import { body, param } from "express-validator";
import { postIdValidator } from "./common.js";

export const createPostValidator = [
  body("title").notEmpty().withMessage("Title is required").escape(),
  body("content").notEmpty().withMessage("Content is required"),
];

export const updatePostValidator = [
  param("id")
    .notEmpty()
    .withMessage("Post ID is required")
    .bail()
    .isNumeric()
    .withMessage("Invalid Post ID"),
  body("title").notEmpty().withMessage("Title is required").escape(),
  body("content").notEmpty().withMessage("Content is required"),
];

export const deletePostValidator = [
  param("id")
    .notEmpty()
    .withMessage("Post ID is required")
    .bail()
    .isNumeric()
    .withMessage("Invalid Post ID"),
];

export const likePostValidator = [...postIdValidator];
