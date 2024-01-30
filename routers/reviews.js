const { addReview, getCompanyRating } = require("../models/review");
const { checkAuthUser } = require("../middleware");
const express = require("express");
const router = express.Router();

//Reviews table
router.post("/review/add/:id", checkAuthUser, addReview);
router.get("/review/getcompanyrating/:id", getCompanyRating);

module.exports = router;
