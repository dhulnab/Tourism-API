const {
  driverLogin,
  driverSignup,
  getDriver,
  changePassword,
  updateDriver,
  changeStatus,
  drivers,
  verified,
  resendOtp,
} = require("../models/driver");
const { checkAuthDriver } = require("../middleware");
const express = require("express");
const router = express.Router();

//Drivers table
router.post("/driver/signup", driverSignup);
router.post("/driver/verify/:id", verified);
router.post("/driver/verify/resend/:id", resendOtp);
router.post("/driver/login", driverLogin);
router.get("/driver/get/:id", getDriver);
router.get("/driver/drivers", drivers);
router.put("/driver/changepassword/:id", checkAuthDriver, changePassword);
router.put("/driver/changestatus/:id", checkAuthDriver, changeStatus);
router.put("/driver/update/:id", checkAuthDriver, updateDriver);

module.exports = router;
