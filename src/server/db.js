const fs = require("fs/promises");
const path = require("path");

const STORE_NAME = "pulsedesk";
const DATA_KEY = "database";
const localDataFile = path.join(__dirname, "..", "..", ".data", "db.json");

const emptyData = () => ({
  users: [],
  projects: []
});

function shouldUseNetlifyBlobs() {
  return (
    process.env.USE_NETLIFY_BLOBS === "true" ||
    process.env.NETLIFY === "true" ||
    Boolean(process.env.NETLIFY_SITE_ID)
  );
}

async function readLocalData() {
  try {
    const raw = await fs.readFile(localDataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    return emptyData();
  }
}

async function writeLocalData(data) {
  await fs.mkdir(path.dirname(localDataFile), { recursive: true });
  await fs.writeFile(localDataFile, JSON.stringify(data, null, 2));
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(STORE_NAME);
}

async function readData() {
  if (!shouldUseNetlifyBlobs()) {
    return readLocalData();
  }

  const store = await getBlobStore();
  const data = await store.get(DATA_KEY, { type: "json" });
  return data || emptyData();
}

async function writeData(data) {
  if (!shouldUseNetlifyBlobs()) {
    await writeLocalData(data);
    return data;
  }

  const store = await getBlobStore();
  await store.setJSON(DATA_KEY, data);
  return data;
}

async function updateData(updater) {
  const data = await readData();
  const nextData = await updater(data);
  await writeData(nextData);
  return nextData;
}

module.exports = {
  readData,
  writeData,
  updateData
};
