const {
  Companies,
  companyLogin,
  companySignup,
  deleteCompany,
  editCompany,
  getCompany,
} = require("../models/company");
const express = require("express");
const router = express.Router();

//users table
router.post("/company/signup", companySignup);
router.post("/company/login", companyLogin);
router.get("/company/getcompany/:id", getCompany);
router.get("/company/view", Companies);
router.delete("/company/delete/:id", deleteCompany);
router.put("/company/update/:id", editCompany);

module.exports = router;
