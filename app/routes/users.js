import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  uploadProfileImage,
} from "../controllers/users.js";
import handleAuthentication from "../middleware/handleAuthentication.js";
import {
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  uploadProfileImageValidator,
  userLoginValidator,
  userRegisterValidator,
} from "../validators/users.js";
import handleValidation from "../middleware/handleValidation.js";

const router = Router();

router.post("/register", userRegisterValidator, handleValidation, registerUser);
router.post("/login", userLoginValidator, handleValidation, loginUser);
router.get("/profile", handleAuthentication, getUserProfile);
router.put(
  "/upload-profile-image",
  handleAuthentication,
  uploadProfileImageValidator,
  handleValidation,
  uploadProfileImage
);
router.put(
  "/change-password",
  handleAuthentication,
  changePasswordValidator,
  handleValidation,
  changePassword
);
router.post(
  "/forgot-password",
  handleAuthentication,
  forgotPasswordValidator,
  handleValidation,
  forgotPassword
);
router.post(
  "/reset-password",
  handleAuthentication,
  resetPasswordValidator,
  handleValidation,
  resetPassword
);

export default router;
