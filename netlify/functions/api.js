const serverless = require("serverless-http");
const createApp = require("../../src/server/app");

const app = createApp();
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  const { connectLambda } = await import("@netlify/blobs");

  connectLambda(event);

  return handler(event, context);
};
