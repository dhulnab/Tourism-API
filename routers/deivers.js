const {
  driverLogin,
  driverSignup,
  getDriver,
  changePassword,
  updateDriver,
  changeStatus,
  drivers,
} = require("../models/driver");
const express = require("express");
const router = express.Router();

//Drivers table
router.post("/driver/signup", driverSignup);
router.post("/driver/login", driverLogin);
router.get("/driver/get/:id", getDriver);
router.get("/driver/drivers", drivers);
router.put("/driver/changepassword/:id", changePassword);
router.put("/driver/changestatus/:id", changeStatus);
router.put("/driver/update/:id", updateDriver);

module.exports = router;
