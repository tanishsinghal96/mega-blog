import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
//if we don't need the response then we can use the underscore(_) in place of res
export const  authMiddleware=asyncHandler(async (req,_,next)=>{  
    //take the access token from the cookie or headers(for phone users)
    try {
        const accessToken=req.cookies?.accessToken || req.headers["authentication"]?.replace("Bearer ","");
        if(!accessToken){
            throw new ApiError(400,"unauthorized user")
        }
    
        //decode the access the token 
        const decodeToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
        //decode token not have id it measn not good and if id not have in database then also not good token
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
        
            if (!user) {
                
                throw new ApiError(401, "Invalid Access Token")
            }
        
            req.user = user;  
            next()
    } catch (error) {
        throw new ApiError(401,error?.message || "something went wrong")
    }

})