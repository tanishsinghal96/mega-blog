import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  registerUser,
  loginUser,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
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

router.route("/refresh-access-token").get(refreshAccessToken);
//secure routes
router.route("/logout").post(authMiddleware, logout);
router.route("/change-password").patch(authMiddleware, changeCurrentPassword);
router.route("/current-user").get(authMiddleware, getCurrentUser);
router
  .route("/update-account-details")
  .patch(authMiddleware, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(authMiddleware, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-cover-image")
  .patch(authMiddleware, upload.single("coverImage"), updateUserCoverImage);
router
  .route("/channel-profile/:username")
  .get(authMiddleware, getUserChannelProfile);
router.route("/watch-history").get(authMiddleware, getWatchHistory);
//export the router

export default router;
