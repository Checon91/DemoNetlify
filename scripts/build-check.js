const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "public/index.html",
  "public/styles.css",
  "public/app.js",
  "netlify/functions/api.js",
  "src/server/app.js",
  "src/server/db.js"
];

const missing = requiredFiles.filter((file) => {
  return !fs.existsSync(path.join(__dirname, "..", file));
});

if (missing.length > 0) {
  console.error("Missing required files:");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log("Build check passed.");
