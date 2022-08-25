import express from "express";
import crypto from "crypto";

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

/*
    TODO:
    - Function for hashing body with secret key
    
*/

const verifySig = async (body: any, hash: any) => {
  const hmac = crypto.createHmac("sha256", process.env.SECRET_KEY || "secret");
  hmac.update(JSON.stringify(body));
  const digest = hmac.digest("hex");
  return digest === hash;
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

export default router;
