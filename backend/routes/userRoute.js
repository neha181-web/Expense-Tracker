import express from 'express';

import authMiddleware from "../middleware/auth.js";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateProfile,
  updatePassword,
} from "../controllers/userController.js";


const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

//protected Routes
userRouter.get("/me", authMiddleware, getCurrentUser);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.put("/password", authMiddleware, updatePassword);

export default userRouter;