import { PrismaClient } from "@prisma/client";
import e from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import users from "./routes/users.js";
import posts from "./routes/posts.js";

const app = e();
export const prisma = new PrismaClient();

app.use(e.json());
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use("/users", users);
app.use("/posts", posts);

export default app;
