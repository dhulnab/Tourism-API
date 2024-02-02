const {
  registration,
  login,
  profile,
  changePassword,
  updateUser,
  verified,
  resendOtp,
} = require("../models/userm");
const { checkAuthUser } = require("../middleware");
const express = require("express");
const router = express.Router();

//Users table
router.post("/user/signup", registration);
router.post("/user/login", login);
router.get("/user/profile/:id", profile);
router.put("/user/changepassword/:id", checkAuthUser, changePassword);
router.put("/user/update/:id", checkAuthUser, updateUser);
router.post("/user/verify/:id", verified);
router.post("/user/verify/resend/:id", resendOtp);

module.exports = router;
