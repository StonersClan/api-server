import client from "../models/cassandra";
import { types } from "cassandra-driver";
import status from "../utils/status";
import express from "express";

const router = express.Router();
const Long = types.Long;

router.get("/", (req, res, next) => {
  res.send("Express + TypeScript Server");
});

router.post("/address-change", async (req, res, next) => {
  try {
    const { aadhaarID, address } = req.body;

    await client.execute("UPDATE sih.users SET addr = ? WHERE aadhaar = ?", [
      address,
      Long.fromNumber(aadhaarID),
    ]);

    const associatedServiceProviders = await client.execute(
      "SELECT * FROM sih.pref WHERE aadhaar = ? AND pref = true ALLOW FILTERING",
      [Long.fromNumber(aadhaarID)]
    );

    const serviceProviders: string[] = [];
    for (const row of associatedServiceProviders.rows) {
      serviceProviders.push(row.sp_id);
    }

    const pushNotificationMsg = {
      serviceProviders,
      aadhaarID,
    };

    // TODO: send pushNotificationMsg to kafka topic

    const currTime = new Date();

    for (const serviceProvider of serviceProviders) {
      await client.execute(
        "INSERT INTO sih.addr_mapping (aadhaar, new_addr, sp_id, ts, status) VALUES (?, ?, ?, ?, ?)",
        [
          Long.fromNumber(aadhaarID),
          address,
          serviceProvider,
          currTime,
          status.PENDING,
        ]
      );
    }

    res.status(200).send("Address changed successfully");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.get("/address-change/status", async (req, res, next) => {
  try {
    const { aadhaarID } = req.query;

    const aadhaarIDLong = Long.fromNumber(parseInt(aadhaarID as string));

    const address = (
      await client.execute("SELECT addr from sih.users WHERE aadhaar = ?", [
        aadhaarIDLong,
      ])
    ).rows[0].addr;

    const addrMappings = await client.execute(
      "SELECT * FROM sih.addr_mapping WHERE aadhaar = ? AND new_addr = ? ALLOW FILTERING",
      [aadhaarIDLong, address]
    );

    const serviceProviderIDs: any[] = [];
    for (const row of addrMappings.rows) {
      serviceProviderIDs.push(row.sp_id);
    }

    const result = await client.execute("SELECT * FROM sih.sp WHERE id in ?", [
      serviceProviderIDs,
    ]);

    const serviceProviders = [];
    for (const addrMapping of addrMappings.rows) {
      const row = result.rows.find((row) => row.id === addrMapping.sp_id);
      serviceProviders.push({
        name: row?.name,
        status: addrMapping.status,
      });
    }

    res.send({ serviceProviders, address });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.post("/store-pref", async (req, res, next) => {
  try {
    const { aadhaarID, serviceProviderID, pref } = req.body;

    const aadhaarIDLong = Long.fromNumber(parseInt(aadhaarID as string));

    await client.execute(
      "UPDATE sih.pref SET pref = ? WHERE aadhaar = ? AND sp_id = ?",
      [pref, aadhaarIDLong, serviceProviderID]
    );

    res.status(200).send("Preferences updated successfully");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.patch("/sp", async (req, res, next) => {
  try {
    const { id, name, authEmail, pushNotificationDetails } = req.body;

    await client.execute(
      "UPDATE sih.sp SET name = ?, auth_email = ?, push_notification_details = ? WHERE id = ?",
      [name, authEmail, pushNotificationDetails, id]
    );

    res.status(200).send("Service Provider updated successfully");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.post("/address-updated", async (req, res, next) => {
  try {
    const { aadhaarID, address, serviceProviderID } = req.body;

    const aadhaarIDLong = Long.fromNumber(parseInt(aadhaarID as string));

    await client.execute(
      "UPDATE sih.addr_mapping SET status = ? WHERE aadhaar = ? AND sp_id = ? IF new_addr = ?",
      [status.SUCCESS, aadhaarIDLong, serviceProviderID, address]
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.get("/address-change-requests", async (req, res, next) => {
  try {
    const { serviceProviderID } = req.query;

    const addrMappings = await client.execute(
      "SELECT * FROM sih.addr_mapping WHERE sp_id = ? AND status = ? ALLOW FILTERING",
      [serviceProviderID, status.PENDING]
    );

    let reqs = [];
    for (const mapping of addrMappings.rows) {
      reqs.push({
        aadhaarID: mapping.aadhaar,
        newAddress: mapping.new_addr,
        timestamp: mapping.ts,
      });
    }

    res.status(200).send(reqs);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

export default router;
