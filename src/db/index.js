import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDB() {
  try {
    const databaseInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log("MongoDB connected!");
    console.log(databaseInstance.connection.host);
  } catch (error) {
    console.log("MonogoDB Connection failed! " + error);
    process.exit(1);
  }
}

export default connectDB;
