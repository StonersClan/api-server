import express from "express";

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