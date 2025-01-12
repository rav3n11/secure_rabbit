import { TokenIndexer } from "morgan";
import { Request, Response } from "express";
import fs from "fs";
import { R } from "../R";
import { db } from "../api";

const chalk = require("chalk");

export class Log {
  static e(message: string, tag: string) {
    console.log(chalk.red(`[${tag ?? "ERROR"}]:`), message);
  }

  static i(message: string, tag: string) {
    console.log(chalk.gray(`[${tag ?? "INFO"}]:`), message);
  }

  static w(message: string, tag: string) {
    console.log(chalk.yellow(`[${tag ?? "WARN"}]:`), message);
  }

  static gg(message: string, tag: string) {
    console.log(chalk.green(`[${tag ?? "GREEN"}]:`), message);
  }

  static http(message: string, tag: string = "HTTP") {
    console.log(chalk.rgb(160, 90, 143)(`[${tag ?? "HTTP"}]:`), message);
  }
}

export function morganFormat(
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response
) {
  //@ts-ignore
  const { session } = req;
  tokens["remote-user"] = (req: Request, res: Response) =>
    session?.user?.id || "UNAUTHORIZED";
  tokens.date = (req: Request, res: Response) => new Date().toISOString();

  return [
    tokens["remote-addr"](req, res),
    tokens["remote-user"](req, res),
    tokens.date(req, res),
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens["user-agent"](req, res),
    tokens["response-time"](req, res),
    "ms",
  ].join(" ");
}

export async function write(message: string) {
  Log.http(message);

  fs.appendFile(
    `${R.values.logs.logsBaseDirectory}req/req_logs.log`,
    message,
    () => {
      if (!fs.existsSync(`${R.values.logs.logsBaseDirectory}req/`))
        fs.mkdirSync(`${R.values.logs.logsBaseDirectory}req/`, {
          recursive: true,
        });
    }
  );
}
