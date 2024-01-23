const client = require("../db");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const { uploadFile } = require("@uploadcare/upload-client");

const companySignup = async (req, res) => {
  const buff = await uploadFile(req.files.logo.data, {
    publicKey: process.env.PUBLIC_KEY,
    store: "auto",
    metadata: {
      subsystem: "uploader",
      pet: "cat",
    },
  });
  const logo = buff.cdnUrl;
  try {
    let { name, phoneNum, email, password, location, facebookURL } = req.body;
    const hashPassword = bcrypt.hashSync(password, Number(process.env.SALT));

    let result = await client.query(
      `INSERT INTO Company ( CompanyName, password, Email, Location, CompanyLogo, CompanyNumber, Facebook, active ) 
          VALUES ('${name}', '${hashPassword}', '${email}','${location}','${logo}','${phoneNum}', '${facebookURL}', 'true') 
          RETURNING *;`
    );

    const company = result.rows[0];
    res.send({ success: true, company: [company] });
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
    const result = await client.query(
      `SELECT * FROM Company WHERE CompanyNumber = '${phoneNum}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "User not found" });
    } else {
      let company = result.rows[0];
      const match = await bcrypt.compare(password, company.password);

      if (match) {
        var token = jwt.sign(company, process.env.CMOP_ACCESS_TOKEN);
        res.send({ success: true, token, company: [company] });
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
    const result = await client.query(
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
  const buff = await uploadFile(req.files.logo.data, {
    publicKey: process.env.PUBLIC_KEY,
    store: "auto",
    metadata: {
      subsystem: "uploader",
      pet: "cat",
    },
  });
  const logo = buff.cdnUrl;
  let { name, phoneNum, email, password, location, facebookURL } = req.body;
  const hashPassword = bcrypt.hashSync(password, Number(process.env.SALT));
  try {
    const result = await client.query(`
        UPDATE Company
        SET CompanyName = '${name}', password = '${hashPassword}', Email = '${email}',
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
  const result = await client.query(
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
      `SELECT * FROM Company 
          WHERE CompanyName ILIKE '%${search}%' AND active = true 
          ORDER BY CompanyName ASC
          LIMIT ${limit} OFFSET ${offset};`
    );
    res.send({ success: true, companies: result.rows });
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
    const result = await client.query(
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
        const result1 = await client.query(
          `UPDATE Company 
           SET Password = '${hashPassword}'
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

module.exports = {
  Companies,
  companyLogin,
  companySignup,
  deleteCompany,
  editCompany,
  getCompany,
  changePassword,
};
