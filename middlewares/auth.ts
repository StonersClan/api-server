import express from "express";

const router = express.Router();

/*
    Auth Strategy:
    1. From Aadhaar service: decrypt timestamp with secret key
    2. From User: mock auth (aadhaar OTP)
    3. From SP: 
*/