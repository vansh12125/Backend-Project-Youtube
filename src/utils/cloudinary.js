import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadFile = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully: ", result.url);
    fs.unlinkSync(localFilePath);
    return result.url;
  } catch (error) {
    console.log("Upload failed");
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadFile };
