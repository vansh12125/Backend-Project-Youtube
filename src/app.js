import express from "express";
import { limit } from "./constants.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: limit,
  })
);
app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: true,
    limit: limit,
  })
);
app.use(cookieParser());

//Routes
import userRouter from "./routes/user.routes.js";
app.use("/users", userRouter);

export { app };
