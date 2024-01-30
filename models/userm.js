const client = require("../db");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const { uploadFile } = require("@uploadcare/upload-client");

const login = async (req, res) => {
  try {
    let { phoneNum, password } = req.body;
    const result = await client.query(
      `SELECT * FROM "User" WHERE phoneNumber = '${phoneNum}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "User not found" });
    } else {
      let user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        var token = jwt.sign(user, process.env.USER_ACCESS_TOKEN);
        res.send({ success: true, token, user });
      } else {
        res.send({ success: false, msg: "Wrong password!" });
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

const registration = async (req, res) => {
  const buff = await uploadFile(req.files.foo.data, {
    publicKey: process.env.PUBLIC_KEY,
    store: "auto",
    metadata: {
      subsystem: "uploader",
      pet: "cat",
    },
  });
  const avatar = buff.cdnUrl;
  try {
    let { name, phoneNum, email, password } = req.body;
    const hashPassword = bcrypt.hashSync(password, Number(process.env.SALT));

    let result = await client.query(
      `INSERT INTO "User" ( Name, phoneNumber, avatar, Email, Password ) 
      VALUES ('${name}', '${phoneNum}', '${avatar}','${email}','${hashPassword}') 
      RETURNING *;`
    );

    const user = result.rows[0];
    var token = jwt.sign(user, process.env.USER_ACCESS_TOKEN);
    res.send({ success: true, token, user: [user] });
  } catch (error) {
    console.error("Error during registration:", error);

    // Handle the error response
    res
      .status(500)
      .send({ success: false, msg: "Duplicated phone number or email", error });
  }
};
const updateUser = async (req, res) => {
  const user_id = req.params.id;
  const buff = await uploadFile(req.files.foo.data, {
    publicKey: process.env.PUBLIC_KEY,
    store: "auto",
    metadata: {
      subsystem: "uploader",
      pet: "cat",
    },
  });
  const avatar = buff.cdnUrl;
  try {
    let { name, phoneNum, email } = req.body;

    let result = await client.query(
      `UPDATE "User" 
       SET
       Name = '${name}', phoneNumber = '${phoneNum}', avatar = '${avatar}', Email = '${email}'
       WHERE UserID = ${user_id}
       RETURNING *;`
    );

    const updatedUser = result.rows[0];
    res.send({ success: true, updatedUser: [updatedUser] });
  } catch (error) {
    console.error("Error during registration:", error);

    // Handle the error response
    res
      .status(500)
      .send({ success: false, msg: "Duplicated phone number or email", error });
  }
};
const changePassword = async (req, res) => {
  const user_id = req.params.id;
  try {
    let { password, newPassword } = req.body;
    const result = await client.query(
      `SELECT * FROM "User" WHERE UserID = '${user_id}'`
    );
    if (result.rows.length === 0) {
      res.send({ success: false, msg: "Not found" });
    } else {
      let user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const hashPassword = bcrypt.hashSync(
          newPassword,
          Number(process.env.SALT)
        );
        const result1 = await client.query(
          `UPDATE "User" 
           SET Password = '${hashPassword}'
           WHERE UserID = ${user_id}
           RETURNING *;`
        );
        const user = result1.rows[0];
        res.send({ success: true, user: [user] });
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

const profile = async (req, res) => {
  try {
    let UserID = req.params.id;
    const result = await client.query(
      `SELECT * FROM "User" WHERE UserID = '${UserID}'`
    );

    if (result.rows.length === 0) {
      res.send({ success: false, msg: "User not found" });
    } else {
      let user = result.rows[0];
      res.send({ success: true, user: [user] });
    }
  } catch (error) {
    console.error("Error during operation:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

module.exports = { login, registration, profile, changePassword, updateUser };
