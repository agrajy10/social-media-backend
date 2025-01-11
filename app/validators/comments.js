import { body, param } from "express-validator";
import { prisma } from "../index.js";

export const createCommentValidator = [
  param("id")
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
