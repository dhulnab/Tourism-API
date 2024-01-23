const {
  registration,
  login,
  profile,
  changePassword,
  updateUser,
} = require("../models/User");
const express = require("express");
const router = express.Router();

//Users table
router.post("/user/signup", registration);
router.post("/user/login", login);
router.get("/user/profile/:id", profile);
router.put("/user/changepassword/:id", changePassword);
router.put("/user/update/:id", updateUser);

module.exports = router;
