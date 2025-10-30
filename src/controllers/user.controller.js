import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { emailRegex, cookiesOptions } from "../constants.js";
import { User } from "../models/user.models.js";
import { uploadFile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  //get user detail
  //valid -not empty
  //check if user is already exist
  //check images
  //upload images
  //create user
  //remove password
  //check user created
  //return data

  //get user detail
  let { fullName, email, userName, password } = req.body;
  fullName = fullName?.trim();
  email = email?.trim().toLowerCase();
  userName = userName?.trim();
  password = password?.trim();

  //valid -not empty
  if (!fullName) throw new ApiError(400, "Full Name is required!");
  if (!email) throw new ApiError(400, "Email is required!");
  if (!userName) throw new ApiError(400, "Username is required!");
  if (!password) throw new ApiError(400, "Password is required!");
  if (!emailRegex.test(email)) throw new ApiError(401, "Not a valid email!");
  if (password.length < 5)
    throw new ApiError(401, "Password length should be minimum 5!");

  //check if user is already exist
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    let message = "User already exists with these credentials!";
    if (existedUser.email === email) message += " Email is already registered!";
    else if (existedUser.userName === userName)
      message += " Username is already taken!";
    throw new ApiError(409, message);
  }

  // console.log(req.body);

  //check files and upload
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar is required!");

  const avatarUrl = await uploadFile(avatarLocalPath);
  const coverImageUrl = coverImageLocalPath
    ? await uploadFile(coverImageLocalPath)
    : "";

  const creatingUser = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    password,
    email,
    avatar: avatarUrl,
    coverImage: coverImageUrl ? coverImageUrl : "",
    personalPassword: password,
  });
  // console.log(creatingUser);

  const createdUser = await User.findById(creatingUser._id).select(
    "-password -refreshToken -personalPassword"
  );
  // console.log(createdUser);
  if (!createdUser)
    throw new ApiError(500, "Something Went Wrong! while registering user");

  res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong , while generating access and refresh token ${error}`
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //get user detail
  //valid -not empty
  //check user registered or not
  //check password
  //access and refresh token
  //send cookie
  //login

  let { userName, password } = req.body;
  userName = userName?.trim();
  password = password?.trim();

  //valid -not empty
  if (!userName) throw new ApiError(400, "Username is required!");
  if (!password) throw new ApiError(400, "Password is required!");
  if (password.length < 5)
    throw new ApiError(401, "Password length should be minimum 5!");

  //check user is registered
  const registeredUser = await User.findOne({ userName });
  if (!registeredUser)
    throw new ApiError(400, "New user detected! First Register");

  //check password
  const checkPassword = await registeredUser.isPasswordCorrect(password);
  if (!checkPassword) throw new ApiError(401, "Incorrect Password!");

  //access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    registeredUser._id
  );

  //send cookies
  const loggedInUser = await User.findById(registeredUser._id).select(
    "-password -refreshToken -personalPassword"
  );

  //return
  res
    .status(200)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .cookie("accessToken", accessToken, cookiesOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Login Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .clearCookie("refreshToken", cookiesOptions)
    .clearCookie("accessToken", cookiesOptions)
    .json(new ApiResponse(200, {}, "User Logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request!");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      decodedToken._id
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, cookiesOptions)
      .cookie("refreshToken", refreshToken, cookiesOptions)

      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
          "Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "invalid token");
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (newPassword.length < 5) {
    throw new ApiError(400, "Password must be at least 5 characters long");
  }

  const user = await User.findById(req.user?._id);
  const isCorrect = user.isPasswordCorrect(oldPassword);

  if (!isCorrect) throw new ApiError(400, "Incorrect old password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken -personalPassword"
  );

  if (!user) throw new ApiError(401, "User Not logged in");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Returned current user"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { fullName, userName, email, newPassword } = req.body;
  if (newPassword.length < 5) {
    throw new ApiError(400, "Password must be at least 5 characters long");
  }

  if (!fullName || !email || !userName || !newPassword) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $and: [{ fullName }, { email }, { userName }],
  });
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  forgotPassword,
};
