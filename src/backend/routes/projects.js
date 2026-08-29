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

router.get("/:projectId/members", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }

  try {
    const result = await pool.query(
      `SELECT users.id, users.username
       FROM project_members
       JOIN users ON users.id = project_members.user_id
       JOIN project_members AS current_member
         ON current_member.project_id = project_members.project_id
       WHERE project_members.project_id = $1
         AND current_member.user_id = $2
       ORDER BY users.username ASC`,
      [req.params.projectId, req.session.userId]
    );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }
});

async function telemetryQuery(req, res, query) {
  if (!isLoggedIn(req, res)) return;
  try {
    const result = await pool.query(query, [req.params.projectId]);
    return res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: "Server error"
    })
  }
}

router.get("/:projectId/telemetry/tickets-by-status", (req, res) => {
  return telemetryQuery(req, res,
    `SELECT status, COUNT(*) as count
      FROM tickets
      WHERE project_id = $1
      GROUP BY status`
  );
});

router.get("/:projectId/telemetry/tickets-by-day", (req, res) => {
  return telemetryQuery(req, res,
    `SELECT 
      DATE(created_at) as day,
      COUNT(CASE WHEN closed_at IS NULL THEN 1 END) as open, -- Open ticks
      COUNT(CASE WHEN closed_at IS NOT NULL THEN 1 END) as closed -- Closed ticks
      FROM tickets
      WHERE project_id = $1
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC -- Sort by oldest to newest`
  );
});

router.get("/:projectId/telemetry/top-contributors", (req, res) => {
  return telemetryQuery(req, res,
    `SELECT 
      users.username,
      COUNT(*) as tickets_closed
      FROM tickets
      JOIN users ON tickets.user_id = users.id
      WHERE tickets.project_id = $1 AND tickets.closed_at IS NOT NULL -- Only tickets that are closed
      GROUP BY users.username
      ORDER BY tickets_closed DESC
      LIMIT 5`
  );
});

router.get("/:projectId/telemetry/top-voted-tickets", (req, res) => {
  return telemetryQuery(req, res,
    `SELECT 
      tickets.id,
      tickets.title,
      COUNT(votes.user_id) as vote_count
      FROM tickets
      LEFT JOIN votes ON tickets.id = votes.ticket_id -- Case for when tick has no votes
      WHERE tickets.project_id = $1
      GROUP BY tickets.id, tickets.title
      ORDER BY vote_count DESC
      LIMIT 5 -- We want top 5`
  );
});

router.get("/:projectId/telemetry/cumulative-closed", (req, res) => {
  return telemetryQuery(req, res,
    `SELECT 
      DATE(closed_at) as day,
      COUNT(*) as daily_count,
      -- https://www.geeksforgeeks.org/postgresql/compute-a-running-total-in-postgresql/
      -- We are summing over a count to give use a running total over dates
      SUM(COUNT(*)) OVER (ORDER BY DATE(closed_at)) as cumulative_count
      FROM tickets
      WHERE project_id = $1 AND closed_at IS NOT NULL
      GROUP BY DATE(closed_at)
      ORDER BY DATE(closed_at) ASC`
  );
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
