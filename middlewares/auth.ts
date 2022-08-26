import express from "express";
import crypto from "crypto";
import client from "../models/cassandra";

const router = express.Router();

/*
    Auth Strategy:
    1. From Aadhaar service
    {
        "bodySig": "bodySig" // 
    }
    2. From User: mock auth (aadhaar OTP)
    3. From SP: 
*/

const verifySig = async (body: any, hash: any) => {
  const hmac = crypto.createHmac("sha256", process.env.SECRET_KEY || "secret");
  hmac.update(JSON.stringify(body));
  const digest = hmac.digest("hex");
  return digest === hash;
};

const verifySPAuthCode = async (code: string) => {
  const result = await client.execute(
    "SELECT * FROM sih.sp_auth_codes WHERE code = ?",
    [code]
  );
  if (result.rows.length === 0) {
    return false;
  }
  return true;
};

router.post("/address-change", async (req, res, next) => {
  if (await verifySig(req.body, req.headers["Body-Sig"])) {
    next();
  }
  res.sendStatus(401);
});

router.post("/store-pref", async (req, res, next) => {
  if (await verifySig(req.body, req.headers["Body-Sig"])) {
    next();
  }
  res.sendStatus(401);
});

router.patch("/sp", async (req, res, next) => {
  if (await verifySig(req.body, req.headers["Body-Sig"])) {
    next();
  }
  res.sendStatus(401);
});

router.post("/address-updated", async (req, res, next) => {
  const { code } = req.body;
  if (await verifySPAuthCode(code)) {
    next();
  }
  res.sendStatus(401);
});

export default router;
