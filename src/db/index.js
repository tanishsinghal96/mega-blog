import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"
//node sj give the access of the process no need of import
const connectdb=async()=>{
 try{
    const connectioninstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`/n mongodb connected !! db host:${connectioninstance.connection.host}`)
}
catch(err){
    console.log("mongodb error:",err)
    process.exit(1)
}
}

export default  connectdb;