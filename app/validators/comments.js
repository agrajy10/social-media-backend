import { body, param } from "express-validator";
import { prisma } from "../index.js";
import { postIdValidator } from "./common.js";

const commentIdValidator = [
  param("commentId")
    .notEmpty()
    .withMessage("Comment ID is required")
    .bail()
    .isNumeric()
    .withMessage("Invalid Comment ID")
    .bail()
    .custom((value) => {
      return prisma.comment
        .findUnique({ where: { id: parseInt(value) } })
        .then((comment) => {
          if (!comment) {
            return Promise.reject("No comment with this id exists");
          }
        });
    }),
];

const commentContentValidator = [
  body("content").notEmpty().withMessage("Content is required"),
];

export const createCommentValidator = [
  ...postIdValidator,
  ...commentContentValidator,
];

export const commentReplyValidator = [
  ...postIdValidator,
  ...commentIdValidator,
  ...commentContentValidator,
];

export const getPostCommentsValidator = [...postIdValidator];
