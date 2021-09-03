import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
// @ts-ignore
import zip from "express-easy-zip";
import cors from "cors";
import { json } from "express";
import morgan from "morgan";
import { authMiddleWare } from "./utils/auth";
import { tagRequest } from "./utils";
import { lastErrorHandler } from "./utils/error";
import { morganFormat, write } from "./utils/logger";
import { router, signupRouter, signinRouter, testRouter } from "./api";

const app = express();

app.use(cors());
app.use(json());
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send({ root: "root" });
})

app.use(
  morgan(morganFormat, {
    stream: {
      write,
    },
  })
);

app.use("/test", testRouter);
app.use("/signup", signupRouter);
app.use("/signin", signinRouter);
app.use("/api", authMiddleWare, router);
//
// app.use(lastErrorHandler);

export async function start() {
  app.listen(process.env.PORT, function () {
    console.log(`Server listening on http://localhost:${process.env.PORT}/`);
  });
}

export const ExpressApp = app;