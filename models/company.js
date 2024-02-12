const pool = require("../db");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const { sendOTPverificationCode } = require("./verifiedRecord");
const { uploadImage } = require("./image_uploader");
require("dotenv").config();

const companySignup = async (req, res) => {
  const logo = (await uploadImage(req.files.logo)).cdnUrl;
  try {
    let { name, phoneNum, email, password, location, facebookURL } = req.body;
    const hashPassword = bcrypt.hashSync(password, Number(process.env.SALT));

    let result = await pool.query(
      `INSERT INTO Company ( CompanyName, password, Email, Location, CompanyLogo, CompanyNumber, Facebook, active,Verified ) 
          VALUES ('${name}', '${hashPassword}', '${email}','${location}','${logo}','${phoneNum}', '${facebookURL}', 'true',false) 
          RETURNING *;`
    );

    const company = result.rows[0];
    const emailStatus = await sendOTPverificationCode(
      company.email,
      company.companyname,
      null,
      company.companyid
    );
    if (emailStatus.success) {
      res.send({ success: true, company: [company] });
    } else {
      await pool.query(
        `DELETE FROM Company
             WHERE CompanyID = ${company.companyid}
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

const companyLogin = async (req, res) => {
  try {
    let { phoneNum, password } = req.body;
    const result = await pool.query(
      `SELECT * FROM Company WHERE CompanyNumber = '${phoneNum}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "User not found" });
    } else {
      let company = result.rows[0];
      const match = await bcrypt.compare(password, company.password);

      if (match) {
        if (!company.verified) {
          if (!company.companyid || !company.email) {
            res.send({
              success: false,
              verified: false,
              msg: "Record missing some details",
            });
            throw Error("Empty otp details are not allowed");
          } else {
            await pool.query(
              `DELETE FROM Verify WHERE companyid = ${company.companyid};`
            );
            const emailStatus = await sendOTPverificationCode(
              company.email,
              company.companyname,
              null,
              company.companyid
            );
            if (emailStatus.success) {
              res.send({
                success: true,
                verified: false,
                msg: "Account not verified, email verification message sent to your email address",
                company: [company],
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
          var token = jwt.sign(company, process.env.CMOP_ACCESS_TOKEN);
          res.send({
            success: true,
            verified: true,
            token,
            company: [company],
          });
        }
      } else {
        res.send({ success: false, msg: "Wrong password!" });
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

const getCompany = async (req, res) => {
  try {
    let CompanyID = Number(req.params.id);
    const result = await pool.query(
      `SELECT * FROM Company WHERE CompanyID ='${CompanyID}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Company not found" });
    } else {
      let company = result.rows[0];
      res.send({ success: true, company: [company] });
    }
  } catch (error) {
    console.error("Error during operation:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

const editCompany = async (req, res) => {
  const CompanyID = req.params.id;
  const logo = (await uploadImage(req.files.logo)).cdnUrl;
  let { name, phoneNum, email, location, facebookURL } = req.body;
  try {
    const result = await pool.query(`
        UPDATE Company
        SET CompanyName = '${name}', Email = '${email}',
        Location = '${location}', CompanyLogo = '${logo}', CompanyNumber = '${phoneNum}',
        active = 'true',Facebook = '${facebookURL}'
        WHERE CompanyID = ${CompanyID}
        RETURNING *;
      `);
    if (result.rowCount > 0) {
      const updatedCompany = result.rows[0];
      res.send({
        success: true,
        updatedCompany: [updatedCompany],
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Company not found",
      });
    }
  } catch (error) {
    console.error("Error updating Company:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteCompany = async (req, res) => {
  let CompanyID = parseInt(req.params.id);
  const result = await pool.query(
    `UPDATE Company
       SET active = false
       WHERE CompanyID = ${CompanyID}
       RETURNING *;`
  );
  const deletedCompany = result.rows[0];
  res.send({
    success: true,
    msg: "deleted successfully",
    deletedCompany: [deletedCompany],
  });
};

const Companies = async (req, res) => {
  let search = req.query.search || null;
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
    if (search !== null) {
      const result = await pool.query(
        `SELECT * FROM Company 
            WHERE CompanyName ILIKE '%${search}%' AND active = true 
            ORDER BY CompanyName ASC
            LIMIT ${limit} OFFSET ${offset};`
      );
      res.send({ success: true, companies: result.rows });
    } else {
      const result = await pool.query(
        `SELECT * FROM Company 
            WHERE active = true 
            ORDER BY CompanyName ASC
            LIMIT ${limit} OFFSET ${offset};`
      );
      res.send({ success: true, companies: result.rows });
    }
  } catch (error) {
    console.error("Error fetching Companies:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const changePassword = async (req, res) => {
  const company_id = req.params.id;
  try {
    let { password, newPassword } = req.body;
    const result = await pool.query(
      `SELECT * FROM Company WHERE CompanyID = '${company_id}'`
    );
    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Not found" });
    } else {
      let company = result.rows[0];
      const match = await bcrypt.compare(password, company.password);
      if (match) {
        const hashPassword = bcrypt.hashSync(
          newPassword,
          Number(process.env.SALT)
        );
        const result1 = await pool.query(
          `UPDATE Company 
           SET password = '${hashPassword}'
           WHERE CompanyID = ${company_id}
           RETURNING *;`
        );
        const company = result1.rows[0];
        res.send({ success: true, company: [company] });
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

const verified = async (req, res) => {
  try {
    const id = req.params.id;
    const otp = req.body.otp;
    if (!id || !otp) {
      res.send({ success: false, msg: "Empty otp details are not allowed" });
      throw Error("Empty otp details are not allowed");
    } else {
      const result = await pool.query(
        `SELECT * FROM Verify WHERE companyid = '${id}'`
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
                 WHERE companyid = ${id};`);
          res.send({ success: false, msg: "Code has expired, Try again" });
        } else {
          const match = await bcrypt.compare(otp, record.otp);
          if (match) {
            const result1 = await pool.query(
              `UPDATE Company 
               SET Verified = true
               WHERE CompanyID = ${id}
               RETURNING *;`
            );
            const company = result1.rows[0];
            var token = jwt.sign(company, process.env.CMOP_ACCESS_TOKEN);
            await pool.query(`DELETE FROM Verify WHERE companyid = ${id};`);
            res.send({ success: true, token, company: [company] });
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
      await pool.query(`DELETE FROM Verify WHERE companyid = ${id};`);
      const emailStatus = await sendOTPverificationCode(email, null, id);
      res.send({ success: emailStatus.success, msg: emailStatus.msg });
    }
  } catch (error) {
    res.send({ success: false, msg: error.message });
    console.error(error);
  }
};

module.exports = {
  Companies,
  companyLogin,
  companySignup,
  deleteCompany,
  editCompany,
  getCompany,
  changePassword,
  verified,
  resendOtp,
};
