import { Router } from "express";
import handleAuthentication from "../middleware/handleAuthentication.js";
import {
  createPost,
  getPosts,
  updatePost,
  deletePost,
} from "../controllers/posts.js";
import {
  createPostValidator,
  updatePostValidator,
  deletePostValidator,
} from "../validators/posts.js";
import handleValidation from "../middleware/handleValidation.js";
import { createComment } from "../controllers/comments.js";
import { createCommentValidator } from "../validators/comments.js";

const router = Router();

router.get("/", handleAuthentication, getPosts);

router.post(
  "/create-post",
  handleAuthentication,
  createPostValidator,
  handleValidation,
  createPost
);

router.put(
  "/update-post/:id",
  handleAuthentication,
  updatePostValidator,
  handleValidation,
  updatePost
);

router.delete(
  "/delete-post/:id",
  handleAuthentication,
  deletePostValidator,
  handleValidation,
  deletePost
);

router.post(
  "/:postId/comments",
  handleAuthentication,
  createCommentValidator,
  handleValidation,
  createComment
);

export default router;
