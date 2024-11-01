require('dotenv').config();
const express = require("express");
const apiRoutes = require("./routes/api");
const webhookRoutes = require("./routes/webhook");
const cors = require("cors");
const { ERROR_PAGE } = require('./lib/utility');
const paginationHandler = require('./middlewares/paginationHandler');
const errorHandler = require('./middlewares/errorHandler');
const successHandler = require('./middlewares/successHandler');
global.__basedir = __dirname;

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true, }));
app.use(successHandler);
app.use(paginationHandler);

//Routes for the Path
app.use("/storage", express.static('storage'));
app.use("/public", express.static('public'));
app.use("/api/v1", apiRoutes);
app.use("/webhook/v1", webhookRoutes);

//Error Handle for unknown requests
app.all("*", (req, res, next) => {
  console.log(`Request => method : ${req.method}, path : ${req.path}, auth : ${req.auth?.username ?? 'No Auth'}`);

  res.status(403).send(ERROR_PAGE);
});

app.use(errorHandler);

module.exports = app;
