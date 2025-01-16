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
import {
  createComment,
  createCommentReply,
  getCommentReplies,
  getPostComments,
} from "../controllers/comments.js";
import {
  commentReplyValidator,
  createCommentValidator,
  getPostCommentsValidator,
  repliesValidator,
} from "../validators/comments.js";

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

router.post(
  "/:postId/comments/:commentId/replies",
  handleAuthentication,
  commentReplyValidator,
  handleValidation,
  createCommentReply
);

router.get(
  "/:postId/comments",
  handleAuthentication,
  getPostCommentsValidator,
  handleValidation,
  getPostComments
);

export default router;
