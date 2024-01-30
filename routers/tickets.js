const {
  addTicket,
  deleteTicket,
  getTicket,
  tickets,
  updateTicket,
} = require("../models/ticket");
const { checkAuthAll } = require("../middleware");
const express = require("express");
const router = express.Router();

//Tickets table
router.get("/ticket/view", checkAuthAll, tickets);
router.get("/ticket/get/:id", checkAuthAll, getTicket);
router.post("/ticket/add", checkAuthAll, addTicket);
router.put("/ticket/edit/:id", checkAuthAll, updateTicket);
router.delete("/ticket/delete/:id", checkAuthAll, deleteTicket);

module.exports = router;
