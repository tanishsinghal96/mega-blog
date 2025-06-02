import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
const registerUser=asyncHandler(async(req,res)=>{
    throw new ApiError(400,"checking checking")
})

export {registerUser}