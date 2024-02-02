require("dotenv").config();
const client = require("../db");
const bcrypt = require("bcrypt");
const Mailgen = require("mailgen");
const nodemailer = require("nodemailer");

const sendOTPverificationCode = async (
  email,
  name = "null",
  userid = null,
  companyid = null,
  driverid = null
) => {
  const id =
    userid !== null ? userid : companyid !== null ? companyid : driverid;
  try {
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    let config = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    };
    let transporter = nodemailer.createTransport(config);
    let mailGenerator = new Mailgen({
      theme: "default",
      textDirection: "rtl",
      product: {
        name: "Rahalat",
        link: "#",
      },
    });

    let response = {
      body: {
        intro: "مرحبا بك في عائلة تطبيق رحلات ",
        name: name,
        action: {
          instructions:
            "نرفق اليك رمز تأكيد حسابك على تطبيق رحلات ونتمنى لك رحلات سعيدة  ",
          button: {
            color: "#22BC66",
            text: `${otp}`,
            link: "#",
          },
        },
        outro:
          "اذا لم تكن انت من قام بهذه العملية تجاهل هذه الرسالة ولا تشارك هذا الرمز مع احد",
        greeting: "اهلاً",
        signature: false,
      },
    };
    let mail = mailGenerator.generate(response);

    let message = {
      from: process.env.EMAIL,
      to: email,
      subject: "تأكيد الحساب",
      html: mail,
    };

    await transporter.sendMail(message);

    const hashOTP = bcrypt.hashSync(otp, Number(process.env.SALT));
    const verificationResult = await client.query(`
        INSERT INTO verify (${
          userid !== null
            ? "userid"
            : companyid !== null
            ? "companyid"
            : "driverid"
        }, otp, created_at, expired_at)
        VALUES (${id}, '${hashOTP}', '${Date.now()}', '${Date.now() + 3600000}')
        RETURNING *;
      `);

    if (verificationResult.rows.length === 0) {
      return {
        success: false,
        msg: "Something went wrong in verification operation, email doesn't delivered",
      };
    } else {
      const verificationEmail = verificationResult.rows[0];
      return { success: true, verificationEmail };
    }
  } catch (err) {
    console.log(err);
    return {
      success: false,
      msg: "Something went wrong in verification operation, email doesn't delivered",
    };
  }
};

module.exports = { sendOTPverificationCode };
