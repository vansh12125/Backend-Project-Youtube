import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { emailRegex } from "../constants.js";
import { User } from "../models/user.models.js";
import { uploadFile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  });
  // console.log(creatingUser);

  const createdUser = await User.findById(creatingUser._id).select(
    "-password -refreshToken"
  );
  // console.log(createdUser);
  if (!createdUser)
    throw new ApiError(500, "Something Went Wrong! while registering user");

  res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get user detail
  //valid -not empty
  //check user registered or not
  //check password
  //access and refresh token
  //send cookie
  //login

  console.log(req.body);

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

  res
    .status(200)
    .json(new ApiResponse(200, registerUser, "Login Successfully"));
});

export { registerUser, loginUser };
