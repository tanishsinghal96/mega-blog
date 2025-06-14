import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

async function generateTokens(userId) {
  try {
    //const user=User.findOne({_id:userId});
    const user = await User.findById(userId);
    //generte the tokens
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false }); //hooks are still running but not the password hashing because we are not changing the password

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
}

const registerUser = asyncHandler(async (req, res) => {
  //need of async function
  //get the data from the body or form
  //now check if our email or usename is already present then return with some good error and not empty
  //check if file (image,avatar) is present then upload them on the cloudainary and check
  //now if everyone is good then register the user or add the details in the our database and then generate the token for the respective user
  //now send this token and whatever i want to send

  //    **now process design by the hitesh chaudhary**

  //get user-deatails from the user/postman
  //check if any required field is empty means apply the validation
  //check user is already exits or not
  //check image and avatar came or not
  //upload them to cloudanry,check is it uploaded or not
  //create user object and remove the password and refresh token from the response
  //check user is created or not
  //if created then send the response
  //console.log("\n request is :",req);
  const { fullName, email, password, userName } = req.body; //because we use the middleware express.json
  //for the hanlding the files(avatar,image we have to introduce the middleware in the route file)

  if (
    [fullName, email, password, userName].some((field) => field?.trim === "")
  ) {
    //keep in mind we initialize the form in frontend with empty string
    throw new ApiError(400, "all fields are required");
  }

  //using the User from the model file created to talk with the database user collection
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "already user exist with given username or email");
  }
  //console.log("\n req.files:",req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  //it will give the error if we don't send any one of them becuse it is trying to access the array property

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //there is multiple way to do it we can omit this field
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // const createdUser = await User.findById(user._id).select(
  //     "-password -refreshToken"
  // )

  const createdUser = await user?.toObject();
  //    console.log("\n after conveting to the plane: ",createdUser);
  delete createdUser.password; // ✅ remove sensitive data
  delete createdUser.refreshToken;

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //TODOS:
  //user data take
  //check if refresh token is send to you(doubt) no check if it is saying to you do login then not laready login
  //validate these fields
  //check if given field is sign up or not
  //if yes then chekc the password given
  //if correct then generate the token of both types
  //send the generated token to user by cookies
  //send the response
  // console.log("\n req is :",req);
  // console.log("\n files are :",req.files);
  // console.log("\n request is :", req.body);
  //  console.log("\n cookies are :",req.cookies);
  // console.log("\n headers are :",req.headers);
  const { userName, email, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "userName or email one is must");
  }

  const already = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!already) {
    throw new ApiError(400, "no user is found with given field");
  }
  //   console.log("bhai m already hunn",already);
  const isPasswordValid = await already.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "password is incorrect");
  }

  const { refreshToken, accessToken } = await generateTokens(already._id);
  // console.log("access",accessToken);
  //now two methods find the new updated user and work with them and another is updte the current fethced user
  const loggedInUser = await User.findById(already._id).select(
    "-password -refreshToken"
  );

  //now we have to set the cookie ,already used the cookieParser so req.cookie and res.cookie is accessible
  //for the security reason we do this
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "successfully user created"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  //TODOS:
  //first clear the refresh token from the user
  //also remove the cookie from the user browser
  //but we don't have the id so for getting the id we haver to write the middleware of auth that can give the id of current user

  await User.findByIdAndUpdate(
    req.user._id, //automatic converted in the objectId by the mongoose
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true, //to return the new updated user
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "sucessfully logout"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //TODOS:
  //get the refresh token //use the try catch b/z using the verify the token
  //validate and crosss check with the database //we don't have the user so we have to verify with the jwt(decode of token)
  //now generate the new token and set the cookie and also update the our user
  const refreshToken =
    req.cookies.refreshToken ||
    req.headers["refresh-token"]?.replace("Bearer ", "") ||
    req.body.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, "refresh token is required");
  }
  //verify the token
  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    //now we have the id of user so we can find the user
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    //now generate the new token
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user._id
    );
    //user is already updated with the new refresh token in the generateTokens function
    const option = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          { user, accessToken, refreshToken: newRefreshToken },
          "Tokens refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //applying the auth middlware must be looged in user
  //get the user and verify the old passwoed //for checking the password using the method
  //if old correct then update and return
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "old password and new password are required");
  }
  //check if the old password is correct or not
  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "old password is incorrect");
  }
  //now update the password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //simple we have the auth middleware
  const user = res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

//these are the patch not the post if it is post then update the whole document
const updateAccountDetails = asyncHandler(async (req, res) => {
  //simple we like the above password change just no need to verify the password
  const { fullName, email } = req.body;
  if (!fullName || !userName || !email) {
    throw new ApiError(400, "all fields are required");
  }
  //now update the user
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { fullName, email },
    { new: true, runValidators: true } //to return the new updated user and also validate the fields who are only given in the query (patch not post so not all fields are required to update, only those who are given in the query will be updated)
  ).select("-password -refreshToken");
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  //using the multer so we use the single not the fields in the routing  and here use the file not the files
  const avatarLocalPath = req.file?.path; //single file so use the file not files and file.avatar.path not use
  //check if the file is present or not
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar image is required");
  }
  //upload the image to the cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  //now update the user with the new avatar
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url, //we can also use the avatar:avatar.url
      },
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");
  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong while updating the avatar");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  //check if the file is present or not
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image is required");
  }
  //upload the image to the cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //now update the user with the new cover image
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url, //we can also use the coverImage:coverImage.url
      },
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");
  if (!updatedUser) {
    throw new ApiError(
      500,
      "Something went wrong while updating the cover image"
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  //TODOS:
  //user clicks then url have the username find the username
  //validate the username and find the user
  //when finding the user use the aggregrate pipelines so we aware
  const { username } = req.params;
  //find the user by username that is different from the actual logged in user and then match the userid  with the  channel to find out the number of subscribers and in the case where we select the someone else username then match with the username id
  if (!username.trim()) {
    throw new ApiError(400, "username is required");
  }
  const user = await User.aggregate([
    {
      $match: {
        userName: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", //name of the channel collection
        localField: "_id", //field in the user collection
        foreignField: "channel", //field in the channel collection
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions", //name of the channel collection
        localField: "_id", //field in the user collection
        foreignField: "subsriber", //field in the channel collection
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!user?.lenght) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user[0], "User channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
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
};
