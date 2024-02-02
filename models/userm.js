const client = require("../db");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const { sendOTPverificationCode } = require("./verifiedRecord");
const { uploadImage } = require("./image_uploader");
require("dotenv").config();

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
        if (!user.verified) {
          if (!user.userid || !user.email) {
            res.send({
              success: false,
              verified: false,
              msg: "Record missing some details",
            });
            throw Error("Empty otp details are not allowed");
          } else {
            await client.query(
              `DELETE FROM Verify WHERE userid = ${user.userid};`
            );
            const emailStatus = await sendOTPverificationCode(
              user.email,
              user.name,
              user.userid
            );
            if (emailStatus.success) {
              res.send({
                success: true,
                verified: false,
                msg: "Account not verified, email verification message sent to your email address",
                user: [user],
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
          var token = jwt.sign(user, process.env.USER_ACCESS_TOKEN);
          res.send({ success: true, verified: true, token, user });
        }
      } else {
        res.send({ success: false, verified: false, msg: "Wrong password!" });
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

const registration = async (req, res) => {
  try {
    const avatar = (await uploadImage(req.files.foo)).cdnUrl;
    let { name, phoneNum, email, password } = req.body;
    const hashPassword = bcrypt.hashSync(password, Number(process.env.SALT));

    let result = await client.query(
      `INSERT INTO "User" ( Name, phoneNumber, avatar, Email, Password,Verified ) 
      VALUES ('${name}', '${phoneNum}', '${avatar}','${email}','${hashPassword}',false) 
      RETURNING *;`
    );
    if (result.rows.length !== 0) {
      const user = result.rows[0];
      const emailStatus = await sendOTPverificationCode(
        user.email,
        user.name,
        user.userid
      );
      if (emailStatus.success) {
        res.send({ success: true, user: [user] });
      } else {
        await client.query(
          `DELETE FROM "User"
               WHERE UserID = ${user.userid}
               RETURNING *;`
        );
        res.send({ success: false, error: emailStatus.msg });
      }
    } else {
      res.send({
        success: false,
        msg: "something went wrong during the operation",
      });
    }
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
  const avatar = (await uploadImage(req.files.foo)).cdnUrl;
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

const verified = async (req, res) => {
  try {
    const id = req.params.id;
    const otp = req.body.otp;
    if (!id || !otp) {
      res.send({ success: false, msg: "Empty otp details are not allowed" });
      throw Error("Empty otp details are not allowed");
    } else {
      const result = await client.query(
        `SELECT * FROM Verify WHERE userid = '${id}'`
      );
      if (result.rows.length === 0) {
        res.send({
          success: false,
          msg: "Account record does not exist or has been verified already, please sign up or log in",
        });
      } else {
        let record = result.rows[0];
        if (record.expired_at < Date.now()) {
          await client.query(`DELETE FROM Verify
                 WHERE userid = ${id};`);
          res.send({ success: false, msg: "Code has expired, Try again" });
        } else {
          const match = await bcrypt.compare(otp, record.otp);
          if (match) {
            const result1 = await client.query(
              `UPDATE "User" 
               SET Verified = true
               WHERE UserID = ${id}
               RETURNING *;`
            );
            const user = result1.rows[0];
            var token = jwt.sign(user, process.env.USER_ACCESS_TOKEN);
            await client.query(`DELETE FROM Verify WHERE userid = ${id};`);
            res.send({ success: true, token, user: [user] });
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
      await client.query(`DELETE FROM Verify WHERE userid = ${id};`);
      const emailStatus = await sendOTPverificationCode(email, null, id);
      res.send({ success: emailStatus.success, msg: emailStatus.msg });
    }
  } catch (error) {
    res.send({ success: false, msg: error.message });
    console.error(error);
  }
};

module.exports = {
  login,
  registration,
  profile,
  changePassword,
  updateUser,
  verified,
  resendOtp,
};
