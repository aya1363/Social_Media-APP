import mongoose from "mongoose";
import {UserModel,PostModel} from "./models";


const DB_URI:string = process.env.DB_URI || "mongodb://localhost:27017/Social_Media_APP";

export const connectDB = async (): Promise<void> => {
    try {
        const result = await mongoose.connect(DB_URI, {
            serverSelectionTimeoutMS:30000
        });
        UserModel.syncIndexes()
        PostModel.syncIndexes()
        console.log(result.models);

    console.log(" MongoDB connected successfully ✅");
    } catch (error) {
    console.error(" MongoDB connection failed ❌:", error);
    process.exit(1); 
}
};
