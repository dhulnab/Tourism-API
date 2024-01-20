const express = require("express");
const app = express();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const users = require("./routers/users");
const companies = require("./routers/companies");

const port = 3000;
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use("/tourism-api/v1", users);
app.use("/tourism-api/v1", companies);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
