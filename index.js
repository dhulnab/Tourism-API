const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const users = require("./routers/users");
const companies = require("./routers/companies");
const trips = require("./routers/trips");
const driver = require("./routers/deivers");
const tickets = require("./routers/tickets");
const reviews = require("./routers/reviews");

const port = process.env.PORT;
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 },
  })
);

app.use("/tourism-api/v1", users);
app.use("/tourism-api/v1", companies);
app.use("/tourism-api/v1", trips);
app.use("/tourism-api/v1", driver);
app.use("/tourism-api/v1", tickets);
app.use("/tourism-api/v1", reviews);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
