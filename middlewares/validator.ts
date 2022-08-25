import Long from "long";
import client from "../models/cassandra";
import express from "express";
const router = express.Router();

const aadhaarExists = async (aadhaarIDLong: Long.Long) => {
  const result = await client.execute(
    "SELECT * FROM sih.users WHERE aadhaar = ?",
    [aadhaarIDLong]
  );
  return result.rows.length > 0;
};

router.post("/address-change", async (req, res, next) => {
  const { aadhaarID, address } = req.body;

  if (
    typeof aadhaarID !== "number" ||
    (aadhaarID as number)?.toString().length !== 12 ||
    !address 
  ) {
    res.sendStatus(400);
    return;
  }

  next();
});

router.get("/address-change/status", async (req, res, next) => {
  const { aadhaarID } = req.query;

  if (
    typeof aadhaarID !== "number" ||
    (aadhaarID as number)?.toString().length !== 12
  ) {
    res.sendStatus(400);
    return;
  }

  const aadhaarIDLong = Long.fromNumber(parseInt(aadhaarID as string));
  if (!(await aadhaarExists(aadhaarIDLong))) {
    res.sendStatus(404);
    return;
  }

  next();
});

router.post("/store-pref", async (req, res, next) => {
  const { aadhaarID, serviceProviderID, pref } = req.body;

  // TODO: Check if service provider exists

  if (
    typeof aadhaarID !== "number" ||
    (aadhaarID as number)?.toString().length !== 12 ||
    !serviceProviderID ||
    typeof pref !== "boolean"
  ) {
    res.sendStatus(400);
    return;
  }

  next();
});

router.patch("/sp", async (req, res, next) => {
  const { id, name, pushNotificationDetails } = req.body;
  if (!id || !name || !pushNotificationDetails) {
    res.sendStatus(400);
    return;
  }

  next();
});

router.post("/address-updated", async (req, res, next) => {
  const { aadhaarID, address, serviceProviderID, status } = req.body;

  if(status !== "SUCCESS" && status !== "DENIED") {
    res.sendStatus(400);
    return;
  }

  const aadhaarIDLong = Long.fromNumber(parseInt(aadhaarID as string));

  if (!(await aadhaarExists(aadhaarIDLong))) {
    res.sendStatus(404);
    return;
  }

  //TODO: Check if service provider exists

  next();
});

router.get("/address-change-requests", async (req, res, next) => {
  const { serviceProviderID } = req.query;

  // TODO: Check if service provider exists
  next();
});

export default router;
