import { body, param } from "express-validator";

export const createPostValidator = [
  body("title").notEmpty().withMessage("Title is required").escape(),
  body("content").notEmpty().withMessage("Content is required"),
];

export const updatePostValidator = [
  param("id").notEmpty().withMessage("Post ID is required"),
  body("title").notEmpty().withMessage("Title is required").escape(),
  body("content").notEmpty().withMessage("Content is required"),
];
