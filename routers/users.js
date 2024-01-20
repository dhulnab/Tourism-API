const { registration, login, profile } = require("../models/User");
const express = require("express");
const router = express.Router();

//users table
router.post("/user/signup", registration);
router.post("/user/login", login);
router.get("/user/profile/:id", profile);

module.exports = router;
