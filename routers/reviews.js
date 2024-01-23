const { addReview, getCompanyRating } = require("../models/review");
const express = require("express");
const router = express.Router();

//Reviews table
router.post("/review/add/:id", addReview);
router.get("/review/getcompanyrating/:id", getCompanyRating);

module.exports = router;
