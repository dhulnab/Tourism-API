const {
  Companies,
  companyLogin,
  companySignup,
  deleteCompany,
  editCompany,
  getCompany,
  changePassword,
} = require("../models/company");
const express = require("express");
const router = express.Router();

//Companies table
router.post("/company/signup", companySignup);
router.post("/company/login", companyLogin);
router.get("/company/getcompany/:id", getCompany);
router.get("/company/view", Companies);
router.delete("/company/delete/:id", deleteCompany);
router.put("/company/update/:id", editCompany);
router.put("/company/changepassword/:id", changePassword);

module.exports = router;
