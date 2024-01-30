const jwt = require("jsonwebtoken");

async function checkAuthCompany(req, res, next) {
  const token = req.headers.token;
  try {
    jwt.verify(token, process.env.CMOP_ACCESS_TOKEN);
    next();
  } catch (err) {
    res.status(401).send({ success: false, msg: "Unauthorized!" });
  }
}
async function checkAuthUser(req, res, next) {
  const token = req.headers.token;
  try {
    jwt.verify(token, process.env.USER_ACCESS_TOKEN);
    next();
  } catch (err) {
    res.status(401).send({ success: false, msg: "Unauthorized!" });
  }
}
async function checkAuthDriver(req, res, next) {
  const token = req.headers.token;
  try {
    jwt.verify(token, process.env.DRIVER_ACCESS_TOKEN);
    next();
  } catch (err) {
    res.status(401).send({ success: false, msg: "Unauthorized!" });
  }
}

async function checkAuthAll(req, res, next) {
  const token = req.headers.token;
  if (!token) return res.status(401).send({ message: "Access Denied!" });
  try {
    jwt.verify(token, process.env.CMOP_ACCESS_TOKEN);
    next();
  } catch (err) {
    try {
      jwt.verify(token, process.env.USER_ACCESS_TOKEN);
      next();
    } catch (err) {
      try {
        jwt.verify(token, process.env.DRIVER_ACCESS_TOKEN);
        next();
      } catch (err) {
        res.status(401).send({ message: "Access Denied!" });
        console.log(err);
      }
    }
  }
}

module.exports = {
  checkAuthCompany,
  checkAuthUser,
  checkAuthDriver,
  checkAuthAll,
};
