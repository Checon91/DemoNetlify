const serverless = require("serverless-http");
const createApp = require("../../src/server/app");

const app = createApp();

module.exports.handler = serverless(app);
