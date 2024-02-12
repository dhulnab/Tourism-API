const pool = require("../db");

const addReview = async (req, res) => {
  const company_id = Number(req.params.id);
  const comment = req.body.comment;
  const stars = Number(req.body.stars);
  try {
    const result = await pool.query(
      `INSERT INTO Review (Comment, Stars, CompanyID)
            VALUES('${comment}',${stars},${company_id}) 
            RETURNING *`
    );

    const review = result.rows[0];

    res.send({
      success: true,
      review: [review],
    });
  } catch (error) {
    console.error("Error during adding review, ", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getCompanyRating = async (req, res) => {
  const company_id = Number(req.params.id);
  try {
    const result = await pool.query(
      `SELECT * FROM Review WHERE CompanyID ='${company_id}'`
    );

    const review = result.rows;
    let sum = 0;
    review.map((e) => {
      sum = sum + e.stars;
    });
    let rating = sum / review.length;
    res.send([{ rating: rating }]);
  } catch (error) {
    console.error("Error during operation, ", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { getCompanyRating, addReview };
