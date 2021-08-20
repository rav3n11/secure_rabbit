import { NextFunction, Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { cleanseObject, getDay } from "../utils";
import { generateToken, tokenExp } from "../utils/auth";
import { R } from "../R";
import { PrismaClient, Role } from "@prisma/client";

export const testRouter = Router();
export const signinRouter = Router();
export const signupRouter = Router();
export const router = Router();
export const db = new PrismaClient();

testRouter.get("/", async function (req: Request, res: Response) {
  res.send(req.body);
});

testRouter.get("/lala", (req: Request, res: Response) => {
  res.send({ lala: "lala" });
});

signupRouter.post("/", async function (req: Request, res: Response) {
  const row = { ...req.body };
  const { password } = req.body;
  delete row.password;
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await db.mans.create({
    data: {
      passwordHash,
      ...row,
      sessions: {
        create: [
          {
            active: true,
            exp: new Date(Date.now() + getDay(tokenExp) * 8.64e7),
          },
        ],
      },
    },
    include: {
      sessions: true,
    },
  });

  const token = generateToken(user.sessions[0].id);
  res.status(201).send({
    data: {
      token: `Bearer ${token}`,
      profile: cleanseObject(user, {
        exclude: [
          "sessions",
          "passwordHash",
          "verified",
          "updatedAt",
          "createdAt",
        ],
      }),
    },
  });
});

signinRouter.post("/", async function (req: Request, res: Response) {
  const { username, password } = req.body;

  const man = await db.mans.findFirst({
    where: {
      username: username,
    },
  });
  if (!man) throw R.errors.USER_NOT_FOUND;

  const same: boolean = bcrypt.compareSync(password, man.passwordHash);
  if (!same) throw R.errors.CREDENTIAL_INCORRECT;

  const session = await db.sessions.create({
    data: {
      active: true,
      exp: new Date(Date.now() + getDay(tokenExp) * 8.64e7),
      manId: man.id,
    },
  });

  const token: string = generateToken(session.id);
  res.status(201).send({
    data: {
      token: `Bearer ${token}`,
      profile: cleanseObject(man, {
        exclude: ["passwordHash", "verified", "updatedAt", "createdAt"],
      }),
    },
  });
});

router.delete("/signout", async function (req: Request, res: Response) {
  const {
    // @ts-ignore
    session: { id },
  } = req;

  await db.sessions.delete({ where: { id } });

  res.status(204).end();
});

router.post("/event", async function (req: Request, res: Response) {
  const { title, startDate, endDate, public: pubic } = req.body;

  const {
    // @ts-ignore
    session: {
      man: { id, role },
    },
  } = req;
  if (pubic && role !== Role.ADMIN) throw R.errors.UNAUTHORIZED_RESOURCE_ACCESS;

  const event = await db.events.create({
    select: {
      id: true,
    },
    data: {
      manId: id,
      title,
      startDate,
      endDate,
      public: !!pubic,
    },
  });
  res.status(201).send({
    event,
  });
});
router.get("/event", async function (req: Request, res: Response) {
  const {
    // @ts-ignore
    session: {
      man: { id },
    },
  } = req;

  const eventsList = await db.events.findMany({
    where: {
      OR: [
        {
          manId: id,
        },
        {
          public: true,
        },
      ],
    },
  });
  res.status(200).send({
    eventsList,
  });
});
router.delete("/event", async function (req: Request, res: Response) {
  const { eventId } = req.query;

  const {
    man: { id },
    //@ts-ignore
  } = req.session;

  const deleteResult = await db.events.deleteMany({
    where: {
      id: eventId as string,
      manId: id,
    },
  });
  if (!deleteResult.count) throw R.errors.EVENT_NOT_FOUND;

  res.status(204).end();
});
