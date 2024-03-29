const pool = require("../db");
const bcrypt = require("bcrypt");
const { sendOTPverificationCode } = require("./verifiedRecord");
var jwt = require("jsonwebtoken");
require("dotenv").config();

const driverLogin = async (req, res) => {
  try {
    let { phoneNum, password } = req.body;
    const result = await pool.query(
      `SELECT * FROM Driver WHERE phoneNumber = '${phoneNum}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Driver not found" });
    } else {
      let driver = result.rows[0];
      const match = await bcrypt.compare(password, driver.password);
      if (match) {
        if (!driver.verified) {
          if (!driver.driverid || !driver.email) {
            res.send({
              success: false,
              verified: false,
              msg: "Record missing some details",
            });
            throw Error("Empty otp details are not allowed");
          } else {
            await pool.query(
              `DELETE FROM Verify WHERE driverid = ${driver.driverid};`
            );
            const emailStatus = await sendOTPverificationCode(
              driver.email,
              driver.drivername,
              null,
              null,
              driver.driverid
            );
            if (emailStatus.success) {
              res.send({
                success: true,
                verified: false,
                msg: "Account not verified, email verification message sent to your email address",
              });
            } else {
              res.send({
                success: false,
                verified: false,
                msg: "Invalid email address",
              });
            }
          }
        } else {
          var token = jwt.sign(driver, process.env.DRIVER_ACCESS_TOKEN);
          res.send({ success: true, verified: true, token, driver: [driver] });
        }
      } else {
        res.send({ success: false, verified: false, msg: "Wrong password!" });
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .send({ success: false, verified: false, msg: "Internal Server Error" });
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

    let result = await pool.query(
      `INSERT INTO Driver ( DriverName, phoneNumber, password, Email,
         DriverLocation, CarName, NumberOfPassenger, PlateNumber,
          PlateChar, PlateType, PlateCity, available,Verified ) 
      VALUES ('${name}', '${phoneNum}', '${hashPassword}','${email}',
      '${DriverLocation}','${CarName}','${NumberOfPassenger}','${PlateNumber}',
      '${PlateChar}','${PlateType}','${PlateCity}', 'true',false) 
      RETURNING *;`
    );

    const Driver = result.rows[0];

    const emailStatus = await sendOTPverificationCode(
      Driver.email,
      Driver.drivername,
      null,
      null,
      Driver.driverid
    );
    if (emailStatus.success) {
      res.send({ success: true, driver: [Driver] });
    } else {
      await pool.query(
        `DELETE FROM Driver
             WHERE DriverID = ${Driver.driverid}
             RETURNING *;`
      );
      res.send({ success: false, error: emailStatus.msg });
    }
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

    let result = await pool.query(
      `UPDATE Driver SET DriverName ='${name}', phoneNumber ='${phoneNum}', Email='${email}',
       DriverLocation='${DriverLocation}', CarName='${CarName}', NumberOfPassenger='${NumberOfPassenger}', PlateNumber='${PlateNumber}',
       PlateChar='${PlateChar}', PlateType='${PlateType}', PlateCity='${PlateCity}'  
       WHERE DriverID =${driver_id}
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
    const result = await pool.query(
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
    const result = await pool.query(
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
        const result1 = await pool.query(
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
    const respo = await pool.query(
      `SELECT * FROM Driver WHERE DriverID = '${driver_id}'`
    );
    let driver = respo.rows[0];
    let ava;
    driver.available ? (ava = false) : (ava = true);
    let result = await pool.query(
      `UPDATE Driver SET 
             available = '${ava}'
             WHERE DriverID = ${driver_id}
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
    const result = await pool.query(
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

const verified = async (req, res) => {
  try {
    const id = req.params.id;
    const otp = req.body.otp;
    if (!id || !otp) {
      res.send({ success: false, msg: "Empty otp details are not allowed" });
      throw Error("Empty otp details are not allowed");
    } else {
      const result = await pool.query(
        `SELECT * FROM Verify WHERE driverid = '${id}'`
      );
      if (result.rows.length === 0) {
        res.send({
          success: false,
          msg: "Account record does not exist or has been verified already, please sign up or log in",
        });
      } else {
        let record = result.rows[0];
        if (record.expired_at < Date.now()) {
          await pool.query(`DELETE FROM Verify
                 WHERE driverid = ${id};`);
          res.send({ success: false, msg: "Code has expired, Try again" });
        } else {
          const match = await bcrypt.compare(otp, record.otp);
          if (match) {
            const result1 = await pool.query(
              `UPDATE Driver 
               SET Verified = true
               WHERE DriverID = ${id}
               RETURNING *;`
            );
            const driver = result1.rows[0];
            var token = jwt.sign(driver, process.env.DRIVER_ACCESS_TOKEN);
            await pool.query(`DELETE FROM Verify WHERE driverid = ${id};`);
            res.send({ success: true, token, driver: [driver] });
          } else {
            res.send({ success: false, msg: "Invalid OTP code" });
            throw new Error("Invalid OTP code");
          }
        }
      }
    }
  } catch (error) {
    res.send({ success: false, msg: error.message });
    console.error(error);
  }
};

const resendOtp = async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.body.email;
    if (!id || !email) {
      res.send({ success: false, msg: "Empty otp details are not allowed" });
      throw Error("Empty otp details are not allowed");
    } else {
      await pool.query(`DELETE FROM Verify WHERE driverid = ${id};`);
      const emailStatus = await sendOTPverificationCode(email, null, id);
      res.send({ success: emailStatus.success, msg: emailStatus.msg });
    }
  } catch (error) {
    res.send({ success: false, msg: error.message });
    console.error(error);
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
  verified,
  resendOtp,
};
