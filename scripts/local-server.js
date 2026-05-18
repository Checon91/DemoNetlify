require("dotenv").config();

const express = require("express");
const path = require("path");
const createApp = require("../src/server/app");

const port = Number(process.env.PORT || 8888);
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

const server = express();

server.use("/api", createApp());
server.use(express.static(publicDir));
server.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

server.listen(port, () => {
  console.log(`PulseDesk running at http://localhost:${port}`);
});
