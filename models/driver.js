const client = require("../db");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
require("dotenv").config();

const driverLogin = async (req, res) => {
  try {
    let { phoneNum, password } = req.body;
    const result = await client.query(
      `SELECT * FROM Driver WHERE phoneNumber = '${phoneNum}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Driver not found" });
    } else {
      let Driver = result.rows[0];
      const match = await bcrypt.compare(password, Driver.password);

      if (match) {
        var token = jwt.sign(Driver, process.env.DRIVER_ACCESS_TOKEN);
        res.send({ success: true, token, driver: [Driver] });
      } else {
        res.send({ success: false, msg: "Wrong password!" });
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

const driverSignup = async (req, res) => {
  try {
    let {
      name,
      phoneNum,
      email,
      password,
      DriverLocation,
      CarName,
      NumberOfPassenger,
      PlateNumber,
      PlateChar,
      PlateType,
      PlateCity,
    } = req.body;
    const hashPassword = bcrypt.hashSync(password, Number(process.env.SALT));

    let result = await client.query(
      `INSERT INTO Driver ( DriverName, phoneNumber, password, Email,
         DriverLocation, CarName, NumberOfPassenger, PlateNumber,
          PlateChar, PlateType, PlateCity, available ) 
      VALUES ('${name}', '${phoneNum}', '${hashPassword}','${email}',
      '${DriverLocation}','${CarName}','${NumberOfPassenger}','${PlateNumber}',
      '${PlateChar}','${PlateType}','${PlateCity}', 'true') 
      RETURNING *;`
    );

    const Driver = result.rows[0];
    res.send({ success: true, driver: [Driver] });
  } catch (error) {
    console.error("Error during registration:", error);

    // Handle the error response
    res
      .status(500)
      .send({ success: false, msg: "Duplicated phone number or email", error });
  }
};
const updateDriver = async (req, res) => {
  try {
    const driver_id = req.params.id;
    let {
      name,
      phoneNum,
      email,
      DriverLocation,
      CarName,
      NumberOfPassenger,
      PlateNumber,
      PlateChar,
      PlateType,
      PlateCity,
    } = req.body;

    let result = await client.query(
      `UPDATE Driver SET DriverName='${name}', phoneNumber='${phoneNum}', Email='${email}',
       DriverLocation='${DriverLocation}', CarName='${CarName}', NumberOfPassenger='${NumberOfPassenger}', PlateNumber='${PlateNumber}',
       PlateChar='${PlateChar}', PlateType='${PlateType}', PlateCity='${PlateCity}'  
       WHERE DriverID = =${driver_id}
       RETURNING *;`
    );

    const Driver = result.rows[0];
    res.send({ success: true, driver: [Driver] });
  } catch (error) {
    console.error("Error during registration:", error);

    // Handle the error response
    res
      .status(500)
      .send({ success: false, msg: "Duplicated phone number or email", error });
  }
};

const getDriver = async (req, res) => {
  try {
    let DriverID = parseInt(req.params.id);
    const result = await client.query(
      `SELECT * FROM Driver WHERE DriverID = '${DriverID}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Driver not found" });
    } else {
      let Driver = result.rows[0];
      res.send({ success: true, Driver: [Driver] });
    }
  } catch (error) {
    console.error("Error during operation:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

const changePassword = async (req, res) => {
  const driver_id = req.params.id;
  try {
    let { password, newPassword } = req.body;
    const result = await client.query(
      `SELECT * FROM Driver WHERE DriverID = '${driver_id}'`
    );
    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Not found" });
    } else {
      let driver = result.rows[0];
      const match = await bcrypt.compare(password, driver.password);
      if (match) {
        const hashPassword = bcrypt.hashSync(
          newPassword,
          Number(process.env.SALT)
        );
        const result1 = await client.query(
          `UPDATE Driver 
             SET Password = '${hashPassword}'
             WHERE DriverID = ${driver_id}
             RETURNING *;`
        );
        const driver = result1.rows[0];
        res.send({ success: true, driver: [driver] });
      } else {
        res.send({ success: false, msg: "Wrong password!" });
      }
    }
  } catch (error) {
    console.error("Error during changing the password:", error);

    // Handle the error response
    res
      .status(500)
      .send({ success: false, msg: "Internal Server Error", error });
  }
};

const changeStatus = async (req, res) => {
  const driver_id = req.params.id;
  try {
    const respo = await client.query(
      `SELECT * FROM Driver WHERE DriverID = '${driver_id}'`
    );
    let driver = respo.rows[0];
    let ava;
    driver.available ? (ava = false) : (ava = true);
    let result = await client.query(
      `UPDATE Driver SET 
             available = '${ava}'
             WHERE DriverID = =${driver_id}
             RETURNING *;`
    );
    driver = result.rows[0];
    res.send({ success: true, driver: [driver] });
  } catch (error) {
    console.error("Error during operation: ", error);

    // Handle the error response
    res
      .status(500)
      .send({ success: false, msg: "Internal Server Error", error });
  }
};

const drivers = async (req, res) => {
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
    const result = await client.query(
      `SELECT * FROM Driver 
          WHERE DriverName ILIKE '%${search}%' AND available = true 
          ORDER BY DriverName ASC
          LIMIT ${limit} OFFSET ${offset};`
    );
    res.send({ success: true, drivers: result.rows });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  driverLogin,
  driverSignup,
  getDriver,
  updateDriver,
  changeStatus,
  changePassword,
  drivers,
};
