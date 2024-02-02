const client = require("../db");
require("dotenv").config();
const { uploadImage } = require("./image_uploader");

const trips = async (req, res) => {
  let company_id = parseInt(req.query.company_id) || null;
  let search = req.query.search || "";
  const skip = parseInt(req.query.skip) || 1;
  const limit = parseInt(req.query.limit) || 10;
  if (skip < 1 || limit < 1) {
    return res.status(400).send({
      success: false,
      message:
        "Invalid pagination parameters. Skip and limit must be positive integers.",
    });
  }

  const offset = parseInt((skip - 1) * limit);

  try {
    if (company_id !== null) {
      const result = await client.query(
        `SELECT * FROM Trip 
            WHERE CompanyID = ${company_id}
            ORDER BY Country ASC;`
      );
      res.send({ success: true, trips: result.rows });
    } else {
      const result = await client.query(
        `SELECT * FROM Trip 
            WHERE Country ILIKE '%${search}%' AND active = true 
            ORDER BY Price ASC
            LIMIT ${limit} OFFSET ${offset};`
      );
      res.send({ success: true, trips: result.rows });
    }
  } catch (error) {
    console.error("Error fetching Companies:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const addTrip = async (req, res) => {
  const company_id = Number(req.params.id);

  const image1 = (await uploadImage(req.files.img1)).cdnUrl;
  const image2 = (await uploadImage(req.files.img2)).cdnUrl;
  const image3 = (await uploadImage(req.files.img3)).cdnUrl;
  const {
    Country,
    city1,
    city2,
    city3,
    TripType,
    StartDate,
    EndDate,
    TripProgram,
    Limit,
  } = req.body;
  const price = parseFloat(req.body.price);
  const PriceForChild = parseFloat(req.body.PriceForChild);
  try {
    const result = await client.query(
      `INSERT INTO Trip(Country, city_1, city_2, city_3, TripType, 
        Price, StartDate, EndDate, TripProgram, Images_1, Images_2,
         Images_3, "Limit", UsersNum, PriceForChild, active, CompanyID)
          VALUES('${Country}','${city1}', '${city2}','${city3}', 
          '${TripType}', ${price},'${StartDate}','${EndDate}',
          '${TripProgram}','${image1}','${image2}','${image3}',
          '${Limit}','0', ${PriceForChild},true ,${company_id}) 
          RETURNING *`
    );

    const newTrip = result.rows[0];

    res.send({
      success: true,
      newTrip: [newTrip],
    });
  } catch (error) {
    console.error("Error during addition, ", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getTrip = async (req, res) => {
  try {
    let TripID = Number(req.params.id);
    const result = await client.query(
      `SELECT * FROM Trip WHERE TripID ='${TripID}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Trip not found" });
    } else {
      let trip = result.rows[0];
      res.send({ success: true, trip: [trip] });
    }
  } catch (error) {
    console.error("Error during operation:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

const editTrip = async (req, res) => {
  const TripID = parseInt(req.params.id);
  const image1 = (await uploadImage(req.files.img1)).cdnUrl;
  const image2 = (await uploadImage(req.files.img2)).cdnUrl;
  const image3 = (await uploadImage(req.files.img3)).cdnUrl;
  const {
    Country,
    city1,
    city2,
    city3,
    TripType,
    StartDate,
    EndDate,
    TripProgram,
    Limit,
  } = req.body;
  const price = parseFloat(req.body.price);
  const PriceForChild = parseFloat(req.body.PriceForChild);
  try {
    const result = await client.query(`
    UPDATE Trip
    SET Country = '${Country}', city_1 = '${city1}', city_2 = '${city2}',
    city_3 = '${city3}', TripType = '${TripType}', Price = '${price}',
    StartDate = '${StartDate}', EndDate = '${EndDate}',
    TripProgram = '${TripProgram}', Images_1 = '${image1}', Images_2 = '${image2}',
    Images_3 = '${image3}', "Limit" = '${Limit}', PriceForChild = '${PriceForChild}'
    WHERE TripID = ${TripID}
    RETURNING *;
  `);

    const updatedTrip = result.rows[0];

    res.send({
      success: true,
      updatedTrip: [updatedTrip],
    });
  } catch (error) {
    console.error("Error during updating, ", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteTrip = async (req, res) => {
  let trip_id = parseInt(req.params.id);
  const result = await client.query(
    `UPDATE Trip
       SET active = false
       WHERE TripID = ${trip_id}
       RETURNING *;`
  );
  const deletedTrip = result.rows[0];
  res.send({
    success: true,
    msg: "deleted successfully",
    deletedTrip: [deletedTrip],
  });
};

module.exports = { trips, addTrip, getTrip, editTrip, deleteTrip };
