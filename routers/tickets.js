const {
  addTicket,
  deleteTicket,
  getTicket,
  tickets,
  updateTicket,
} = require("../models/ticket");
const express = require("express");
const router = express.Router();

//Tickets table
router.get("/ticket/view", tickets);
router.get("/ticket/get/:id", getTicket);
router.post("/ticket/add", addTicket);
router.put("/ticket/edit/:id", updateTicket);
router.delete("/ticket/delete/:id", deleteTicket);

module.exports = router;
