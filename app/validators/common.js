import { param } from "express-validator";
import { prisma } from "../index.js";

export const postIdValidator = [
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
];
