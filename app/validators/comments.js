import { body, param } from "express-validator";
import { prisma } from "../index.js";

export const createCommentValidator = [
  param("postId")
    .notEmpty()
    .withMessage("Post ID is required")
    .custom((value) => {
      return prisma.post
        .findUnique({ where: { id: parseInt(value) } })
        .then((post) => {
          if (!post) {
            return Promise.reject("No post with this id exists");
          }
        });
    }),
  body("content").notEmpty().withMessage("Content is required"),
];

export const commentReplyValidator = [
  param("postId")
    .notEmpty()
    .withMessage("Post ID is required")
    .bail()
    .isNumeric()
    .withMessage("Invalid Post ID")
    .bail()
    .custom((value) => {
      return prisma.post
        .findUnique({ where: { id: parseInt(value) } })
        .then((post) => {
          if (!post) {
            return Promise.reject("No post with this id exists");
          }
        });
    }),
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
  body("content").notEmpty().withMessage("Content is required"),
];
