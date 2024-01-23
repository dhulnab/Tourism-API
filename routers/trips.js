const {
  trips,
  addTrip,
  editTrip,
  getTrip,
  deleteTrip,
} = require("../models/trip");
const express = require("express");
const router = express.Router();

//Trips table
router.get("/trip/view", trips);
router.get("/trip/get/:id", getTrip);
router.post("/trip/add/:id", addTrip);
router.put("/trip/edit/:id", editTrip);
router.delete("/trip/delete/:id", deleteTrip);

module.exports = router;
