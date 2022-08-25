import client from "../models/cassandra";
import { types } from "cassandra-driver";
import status from "../utils/status";
import express from "express";
import { pushMsgToQueue } from "../models/kafka";
import { baseDelay } from "../utils/constants";

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

    await pushMsgToQueue(pushNotificationMsg);

    const currTime = new Date();

    for (const serviceProvider of serviceProviders) {
      await client.execute(
        "INSERT INTO sih.addr_mapping (aadhaar, new_addr, sp_id, ts, last_delay, status) VALUES (?, ?, ?, ?, ?, ?)",
        [
          Long.fromNumber(aadhaarID),
          address,
          serviceProvider,
          currTime,
          Long.fromNumber(baseDelay),
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

    // TODO: add user to sih.users

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
    const {
      aadhaarID,
      address,
      serviceProviderID,
      status: updateStatus,
    } = req.body;

    const aadhaarIDLong = Long.fromNumber(parseInt(aadhaarID as string));

    await client.execute(
      "UPDATE sih.addr_mapping SET status = ? WHERE aadhaar = ? AND sp_id = ? IF new_addr = ?",
      [updateStatus, aadhaarIDLong, serviceProviderID, address]
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.get("/address-change-requests", async (req, res, next) => {
  try {
    const { serviceProviderID, aadhaarID } = req.query;

    if (!aadhaarID) {
      const addrMappings = await client.execute(
        "SELECT * FROM sih.addr_mapping WHERE sp_id = ? AND status = ? ALLOW FILTERING",
        [serviceProviderID, status.PENDING]
      );
      let reqs = [];
      for (const mapping of addrMappings.rows) {
        reqs.push({
          aadhaarID: mapping.aadhaar,
          newAddress: mapping.new_addr,
        });
      }

      res.status(200).send(reqs);
    } else {
      const aadhaarIDLong = Long.fromNumber(parseInt(aadhaarID as string));
      const addrMappings = await client.execute(
        "SELECT * FROM sih.addr_mapping WHERE aadhar = ? AND sp_id = ?",
        [aadhaarIDLong, serviceProviderID]
      );
      if (addrMappings.rows.length === 0) {
        res.status(400);
        return;
      }
      res.status(200).send([
        {
          aadhaarID: aadhaarIDLong,
          newAddress: addrMappings.rows[0].new_addr,
        },
      ]);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.post("/verify-auth-code", async (req, res, next) => {
  try {
    const { code } = req.body;
    const result = await client.execute(
      "SELECT * FROM sih.sp_auth_codes WHERE code = ?",
      [code]
    );
    if (result.rows.length === 0) {
      return res.status(200).send({
        valid: false,
      });
    } else {
      return res.status(200).send({
        valid: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

export default router;
