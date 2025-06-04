import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

async function generateTokens(userId) {
  try {
    //const user=User.findOne({_id:userId});
    const user = await User.findById(userId);
    //generte the tokens
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

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
  const { userName, email, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "userName or email one is must");
  }

  const already =await  User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!already) {
    throw new ApiError(400, "no user is found with given field");
  }
//   console.log("bhai m already hunn",already);
  const  isPasswordValid = await already.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "password is incorrect");
  }

  const { refreshToken, accessToken } = await generateTokens(already._id);
  console.log("access",accessToken);
  //now two methods find the new updated user and work with them and another is updte the current fethced user
  const loggedInUser = await User.findById(already._id).select("-password -refreshToken");

  //now we have to set the cookie ,already used the cookieParser so req.cookie and res.cookie is accessible
  //for the security reason we do this 
  const option={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,option)
  .cookie("refreshToken",refreshToken,option)
  .json(
    new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"successfully user created")
  )

});


const logout = asyncHandler(async (req, res) => {
  //TODOS:
  //first clear the access token
  //also remove the cookie from the user browser
  //but we don't have the id so for getting the id we haver to write the middleware of auth that can give the id of current user
 
  User.findByIdAndUpdate(
    req.user._id,
    {
        $set:undefined,
    },
    {
        new:true
    }

  )

  const option={
    httpOnly:true,
    secure:true
  }

  res.status(200)
  .clearCookie("accessToken",option)
  .clearCookie("refreshToken",option)
  .json(
    new ApiResponse(200,{},"sucessfully logout")
  )


});

export 
{ registerUser,
  loginUser,
  logout
};
