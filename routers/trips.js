const {
  trips,
  addTrip,
  editTrip,
  getTrip,
  deleteTrip,
} = require("../models/trip");
const { checkAuthCompany } = require("../middleware");
const express = require("express");
const router = express.Router();

//Trips table
router.get("/trip/view", trips);
router.get("/trip/get/:id", getTrip);
router.post("/trip/add/:id", checkAuthCompany, addTrip);
router.put("/trip/edit/:id", checkAuthCompany, editTrip);
router.delete("/trip/delete/:id", checkAuthCompany, deleteTrip);

module.exports = router;
