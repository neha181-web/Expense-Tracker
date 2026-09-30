import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://neham3913_db_user:YPjLGkpMGmyIBMRW@cluster0.mxhuzml.mongodb.net/?appName=Expense").then(()=> console.log("DB CONNECTED"));
}