require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const crypto = require("crypto");
const express = require("express");
const { createToken, publicUser, verifyToken } = require("./auth");
const { readData, updateData } = require("./db");

const allowedStatuses = new Set(["active", "completed"]);
const allowedPriorities = new Set(["low", "medium", "high"]);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanProjectInput(input) {
  return {
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    status: allowedStatuses.has(input.status) ? input.status : "active",
    priority: allowedPriorities.has(input.priority) ? input.priority : "medium",
    dueDate: input.dueDate ? String(input.dueDate) : ""
  };
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createApp() {
  const app = express();

  app.use((req, res, next) => {
    const functionPrefix = "/.netlify/functions/api";
    if (req.url.startsWith(functionPrefix)) {
      req.url = req.url.slice(functionPrefix.length) || "/";
    }

    if (req.url.startsWith("/api/")) {
      req.url = req.url.slice(4) || "/";
    }

    next();
  });

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  async function requireAuth(req, res, next) {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";

      if (!token) {
        return res.status(401).json({ message: "Authentication required." });
      }

      const payload = verifyToken(token);
      const data = await readData();
      const user = data.users.find((item) => item.id === payload.sub);

      if (!user) {
        return res.status(401).json({ message: "User no longer exists." });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
  }

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      service: "PulseDesk API",
      storage: process.env.USE_NETLIFY_BLOBS === "true" ? "netlify-blobs" : "local-json"
    });
  });

  app.post(
    "/auth/register",
    asyncRoute(async (req, res) => {
      const name = String(req.body.name || "").trim();
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || "");

      if (name.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters." });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Enter a valid email address." });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }

      let createdUser;

      await updateData(async (data) => {
        const existing = data.users.some((user) => user.email === email);

        if (existing) {
          const error = new Error("An account with that email already exists.");
          error.status = 409;
          throw error;
        }

        createdUser = {
          id: crypto.randomUUID(),
          name,
          email,
          passwordHash: await bcrypt.hash(password, 12),
          createdAt: new Date().toISOString()
        };

        data.users.push(createdUser);
        return data;
      });

      res.status(201).json({
        user: publicUser(createdUser),
        token: createToken(createdUser)
      });
    })
  );

  app.post(
    "/auth/login",
    asyncRoute(async (req, res) => {
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || "");
      const data = await readData();
      const user = data.users.find((item) => item.email === email);

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: "Email or password is incorrect." });
      }

      res.json({
        user: publicUser(user),
        token: createToken(user)
      });
    })
  );

  app.get(
    "/auth/me",
    requireAuth,
    asyncRoute(async (req, res) => {
      res.json({ user: publicUser(req.user) });
    })
  );

  app.get(
    "/projects",
    requireAuth,
    asyncRoute(async (req, res) => {
      const data = await readData();
      const projects = data.projects
        .filter((project) => project.userId === req.user.id)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      res.json({ projects });
    })
  );

  app.post(
    "/projects",
    requireAuth,
    asyncRoute(async (req, res) => {
      const input = cleanProjectInput(req.body);

      if (input.title.length < 3) {
        return res.status(400).json({ message: "Project title must be at least 3 characters." });
      }

      let project;

      await updateData(async (data) => {
        const now = new Date().toISOString();

        project = {
          id: crypto.randomUUID(),
          userId: req.user.id,
          ...input,
          createdAt: now,
          updatedAt: now
        };

        data.projects.push(project);
        return data;
      });

      res.status(201).json({ project });
    })
  );

  app.patch(
    "/projects/:id",
    requireAuth,
    asyncRoute(async (req, res) => {
      const input = cleanProjectInput(req.body);

      if (input.title.length < 3) {
        return res.status(400).json({ message: "Project title must be at least 3 characters." });
      }

      let updatedProject;

      await updateData(async (data) => {
        const project = data.projects.find(
          (item) => item.id === req.params.id && item.userId === req.user.id
        );

        if (!project) {
          const error = new Error("Project not found.");
          error.status = 404;
          throw error;
        }

        Object.assign(project, input, {
          updatedAt: new Date().toISOString()
        });

        updatedProject = project;
        return data;
      });

      res.json({ project: updatedProject });
    })
  );

  app.delete(
    "/projects/:id",
    requireAuth,
    asyncRoute(async (req, res) => {
      await updateData(async (data) => {
        const before = data.projects.length;
        data.projects = data.projects.filter(
          (project) => !(project.id === req.params.id && project.userId === req.user.id)
        );

        if (data.projects.length === before) {
          const error = new Error("Project not found.");
          error.status = 404;
          throw error;
        }

        return data;
      });

      res.status(204).send();
    })
  );

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
  });

  app.use((error, req, res, next) => {
    const status = error.status || 500;

    if (status >= 500) {
      console.error(error);
    }

    res.status(status).json({
      message: error.message || "Something went wrong."
    });
  });

  return app;
}

module.exports = createApp;
