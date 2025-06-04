import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")//keep this file in the given folder
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)//and give the original path with poriginal name
    }
  })
  
export const upload = multer({ 
    storage, 
})