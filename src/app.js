const express = require("express");

const indexRoutes = require("./routes/index.routes");

const errorMiddleware = require("./middleware/error.middleware") 

const app = express();

app.use(express.json());



app.use("/",indexRoutes);
app.use(errorMiddleware);

module.exports = app;



