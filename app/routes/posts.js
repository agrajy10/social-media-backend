import { Router } from "express";
import handleAuthentication from "../middleware/handleAuthentication.js";
import { createPost, getPosts } from "../controllers/posts.js";
import { createPostValidator } from "../validators/posts.js";
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

export default router;
