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

  if (aadhaarID?.length !== 12 || !address) {
    res.sendStatus(400);
    return;
  }

  next();
});

router.get("/address-change/status", async (req, res, next) => {
  const { aadhaarID } = req.query;

  if (aadhaarID?.length !== 12) {
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

  if (aadhaarID?.length !== 12 || !serviceProviderID || !pref) {
    res.sendStatus(400);
    return;
  }

  next();
});

router.patch("/sp", async (req, res, next) => {
  const { id, name, authEmail, pushNotificationDetails } = req.body;
  if (!id || !name || !authEmail || !pushNotificationDetails) {
    res.sendStatus(400);
    return;
  }

  next();
});

router.post("/address-updated", async (req, res, next) => {
  const { aadhaarID, address, serviceProviderID } = req.body;

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
