import { mongoose, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const Userschema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index:true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    password: {
      //good discussion on the password
      type: String,
      required: [true, "password is required"],
    },
    avatar: {
      type: String, //cloudnairy Url
      required: true,
    },
    coverImage: {
      type: String, //cloudnairy Url
    },
    refreshToken: {
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "video",
      },
    ],
  },
  { timestamps: true }
);


//data save before this we add the field the last updated  in below not use the arrow function due to we want the this pointer
// Inside a pre("save") middleware, this refers to the document that is about to be saved.
Userschema.pre("save", async function (next) {
  if (!this.isModified("password")) next(); //this is provided to chekck that password is changing or not
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//this refers here to the saved documents
Userschema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//generate the acesss token  with high data and less expiry data and no need of async already so fast it is
Userschema.methods.generateAccessToken = async function () {
 return  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

//geenrate the refresh token with few data and high expiry date
Userschema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", Userschema);
