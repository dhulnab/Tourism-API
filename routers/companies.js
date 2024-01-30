const {
  Companies,
  companyLogin,
  companySignup,
  deleteCompany,
  editCompany,
  getCompany,
  changePassword,
} = require("../models/company");
const { checkAuthCompany } = require("../middleware");
const express = require("express");
const router = express.Router();

//Companies table
router.post("/company/signup", companySignup);
router.post("/company/login", companyLogin);
router.get("/company/getcompany/:id", getCompany);
router.get("/company/view", Companies);
router.delete("/company/delete/:id", checkAuthCompany, deleteCompany);
router.put("/company/update/:id", checkAuthCompany, editCompany);
router.put("/company/changepassword/:id", checkAuthCompany, changePassword);

module.exports = router;
