//require('dotenv').config({path:'./env'})//but this make the inconsistent
import dotenv from "dotenv"
dotenv.config({
    path:'./env'
})


import connectdb from "./db/index.js"//sometimes need to give the name of index file also
import express from "express"
const app=express()
  
connectdb();










// import mongoose from "mongoose"
// import {DB_NAME} from "./constants"

// const connectdb=()=>{
//     mongoose.connect(`${process.env.MONGODB_URI}`)
// }

// connectdb();
//using the iife
//usage the semicolon for the better pratice

// ;(async()=>{
// try{
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error",(error)=>{
//         console.log(error);
//         throw error
//     })
//     app.listen(process.env.PORT,()=>{
//         console.log("app is listenning on the 8000 port ")
//     })
// }
// catch(err){
//     console.log("error:",err)
//     throw err
// }
// })()