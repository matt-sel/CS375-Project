const express = require("express");
const pool = require("../database");
const router = express.Router();
const isLoggedIn = require("../utils/auth");

router.get("/", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }

  try {
    const result = await pool.query(
      `SELECT projects.id, projects.name
       FROM projects
       JOIN project_members ON projects.id = project_members.project_id
       WHERE project_members.user_id = $1
       ORDER BY projects.name ASC`,
      [req.session.userId]
    );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }
});

router.post("/", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }

  if (!req.body.hasOwnProperty("name")) {
    return res.status(400).json({
      error: "Please provide a project name"
    });
  }

  const name = req.body.name.trim();

  if (!name) {
    return res.status(400).json({
      error: "Project name cannot be empty"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO projects (name)
       VALUES ($1)
       RETURNING id, name`,
      [name]
    );

    await pool.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)`,
      [result.rows[0].id, req.session.userId]
    );

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Project name already exists"
      });
    }

    return res.status(500).json({
      error: "Server error"
    });
  }
});

router.post("/:projectId/members", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }

  if (!req.body.hasOwnProperty("username")) {
    return res.status(400).json({
      error: "Please provide a username"
    });
  }

  try {
    const projectMember = await pool.query(
      `SELECT 1 FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [req.params.projectId, req.session.userId]
    );

    if (projectMember.rows.length === 0) {
      return res.status(403).json({
        error: "You are not a member of this project"
      });
    }

    const user = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [req.body.username.trim()]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)`,
      [req.params.projectId, user.rows[0].id]
    );

    return res.json({
      message: "User added to project"
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        error: "User is already in this project"
      });
    }

    return res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;
