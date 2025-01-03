import { Router } from "express";
import handleAuthentication from "../middleware/handleAuthentication.js";
import { createPost, getPosts, updatePost } from "../controllers/posts.js";
import {
  createPostValidator,
  updatePostValidator,
} from "../validators/posts.js";
import handleValidation from "../middleware/handleValidation.js";

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

export default router;
