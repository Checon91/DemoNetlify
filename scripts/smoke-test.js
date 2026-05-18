require("dotenv").config();

const http = require("http");
const createApp = require("../src/server/app");

const app = createApp();
const server = http.createServer(app);

function request(method, path, body, token) {
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        hostname: "127.0.0.1",
        port: server.address().port,
        path,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

server.listen(0, async () => {
  try {
    const suffix = Date.now();
    const register = await request("POST", "/auth/register", {
      name: "Smoke Test",
      email: `smoke-${suffix}@example.com`,
      password: "password123"
    });

    if (register.status !== 201) {
      throw new Error(`Register failed with ${register.status}`);
    }

    const token = register.body.token;
    const created = await request(
      "POST",
      "/projects",
      {
        title: "Ship the smoke test",
        description: "Created by npm test",
        priority: "high",
        status: "active"
      },
      token
    );

    if (created.status !== 201) {
      throw new Error(`Create project failed with ${created.status}`);
    }

    const list = await request("GET", "/projects", null, token);
    if (list.status !== 200 || !Array.isArray(list.body.projects)) {
      throw new Error(`List projects failed with ${list.status}`);
    }

    console.log("Smoke test passed.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
