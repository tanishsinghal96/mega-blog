import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
//It parses that raw string into a proper object like:And stores it in req.body so you can use it easily in your route handler.Otherwise, req.body will be undefined — you won’t be able to access the sent data.
app.use(express.json({
    limit:"16kb"
}))

//url se jo bhi aata hai something like encrypted so we use this for the decrypted
app.use(express.urlencoded({
    limit:"16kb",
    extended:true
}));
//for serving the static file directly If you go to: http://localhost:3000/index.html The server will automatically respond with the public/index.html file.
app.use(express.static("public"))
//for sending the cookies and getting
app.use(cookieParser())


//import  routes first
import userRouter from "./routes/user.routes.js"


//use the middlewared to use the routing 
app.use("/api/v1/users",userRouter)   //using as a middleware








app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    data: null,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
}); 
export {app}