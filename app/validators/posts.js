import { body } from "express-validator";

export const createPostValidator = [
  body("title").notEmpty().withMessage("Title is required").escape(),
  body("content").notEmpty().withMessage("Content is required"),
];
