import { Router } from "express";
import {authMiddleware} from "../middlewares/auth.middleware.js";
import {
  registerUser,
  loginUser,
  logout,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(authMiddleware, logout);

export default router;
