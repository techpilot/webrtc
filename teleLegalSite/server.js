const fs = require("fs");
const https = require("https");
const express = require("express");
const cors = require("cors");
const socketio = require("socket.io");

const app = express();
app.use(cors());
app.use(express.static(__dirname + "/public"));
app.use(express.json());

const key = fs.readFileSync("./certs/cert.key");
const cert = fs.readFileSync("./certs/cert.crt");

const expressServer = https.createServer({ key, cert }, app);
const io = socketio(expressServer, {
  cors: [
    "https://127.0.0.1:5173",
    "https://localhost:5173",
    "https://localhost:5174",
  ],
});

expressServer.listen(9000);
module.exports = { io, expressServer, app };
