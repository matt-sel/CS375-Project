const express = require("express");
const pool = require("../database");
const router = express.Router();
const isLoggedIn = require("../utils/auth");

router.get("/", async (req, res) => {
    if (!isLoggedIn(req, res)) {
        return;
    }

    const projectId = req.query.projectId;
    if (!projectId) {
        return res.status(400).json({
            error: "Project ID is required"
        });
    }

    try {
        const result = await pool.query(
            `SELECT tickets.*, users.username,
            assignee.username AS assigned_username,
            ARRAY_AGG(tags.name) AS tags,
            COUNT(DISTINCT votes.user_id) AS vote_count
            FROM tickets

            JOIN project_members ON tickets.project_id = project_members.project_id
                AND project_members.user_id = $2
            JOIN users ON tickets.user_id = users.id
            LEFT JOIN users assignee ON tickets.assigned_to = assignee.id
            LEFT JOIN ticket_tags ON tickets.id = ticket_tags.ticket_id
            LEFT JOIN tags ON ticket_tags.tag_id = tags.id
            LEFT JOIN votes on tickets.id = votes.ticket_id

            WHERE tickets.project_id = $1
            GROUP BY tickets.id, users.username, assignee.username
            ORDER BY tickets.created_at DESC`,
            [projectId, req.session.userId]
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

  if (!req.body.hasOwnProperty("title") || !req.body.title.trim()) {
    return res.status(400).json({
      error: "Please provide a title"
    });
  }

  if (!req.body.projectId) {
    return res.status(400).json({
      error: "Please select a project"
    });
  }

  let project;
  try {
    project = await pool.query(
      `SELECT 1 FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [req.body.projectId, req.session.userId]
    );
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }

  if (project.rows.length === 0) {
    return res.status(403).json({
      error: "You are not a member of this project"
    });
  }

  const title = req.body.title.trim();
  const description = req.body.description ? req.body.description.trim() : "";
  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

  try {
    const ticketResult = await pool.query(
      `INSERT INTO tickets (project_id, user_id, title, description, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING id`,
      [req.body.projectId, req.session.userId, title, description]
    );
    const ticketId = ticketResult.rows[0].id;

    for (const tagName of tags) {
      const trimmed = tagName.trim();
      if (!trimmed) {
        continue;
      }

      let tagResult = await pool.query(
        "SELECT id FROM tags WHERE name = $1",
        [trimmed]
      );

      let tagId;
      if (tagResult.rows.length === 0) {
        // New user-created tag, no category chosen in the UI yet -- see note above
        const inserted = await pool.query(
          "INSERT INTO tags (name, category) VALUES ($1, $2) RETURNING id",
          [trimmed, "general"]
        );
        tagId = inserted.rows[0].id;
      } else {
        tagId = tagResult.rows[0].id;
      }

      await pool.query(
        "INSERT INTO ticket_tags (ticket_id, tag_id) VALUES ($1, $2)",
        [ticketId, tagId]
      );
    }

    return res.status(200).json({
      message: "Ticket created",
      ticket_id: ticketId
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }
});

router.put("/:ticketId/tags", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }

  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ticketResult = await client.query(
      "SELECT project_id FROM tickets WHERE id = $1",
      [req.params.ticketId]
    );
    if (ticketResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Ticket not found" });
    }

    const membership = await client.query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
      [ticketResult.rows[0].project_id, req.session.userId]
    );
    if (membership.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    await client.query(
      "DELETE FROM ticket_tags WHERE ticket_id = $1",
      [req.params.ticketId]
    );

    for (const tagName of tags) {
      const trimmed = tagName.trim();
      if (!trimmed) {
        continue;
      }

      let tagResult = await client.query(
        "SELECT id FROM tags WHERE name = $1",
        [trimmed]
      );

      let tagId;
      if (tagResult.rows.length === 0) {
        const inserted = await client.query(
          "INSERT INTO tags (name, category) VALUES ($1, $2) RETURNING id",
          [trimmed, "general"]
        );
        tagId = inserted.rows[0].id;
      } else {
        tagId = tagResult.rows[0].id;
      }

      await client.query(
        "INSERT INTO ticket_tags (ticket_id, tag_id) VALUES ($1, $2)",
        [req.params.ticketId, tagId]
      );
    }

    await client.query("COMMIT");
    return res.json({ message: "Tags updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.patch("/:ticketId/assign", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }
  try {
    const ticket = await pool.query(
      "SELECT project_id FROM tickets WHERE id = $1",
      [req.params.ticketId]
    );
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const projectId = ticket.rows[0].project_id;

    const membership = await pool.query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
      [projectId, req.session.userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    const assignedTo = req.body.assignedTo || null;
    if (assignedTo) {
      const assigneeCheck = await pool.query(
        "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, assignedTo]
      );
      if (assigneeCheck.rows.length === 0) {
        return res.status(400).json({ error: "User is not a member of this project" });
      }
    }

    await pool.query(
      "UPDATE tickets SET assigned_to = $1 WHERE id = $2",
      [assignedTo, req.params.ticketId]
    );
    return res.json({ message: "Ticket assignment updated" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:ticketId/comments", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }
  try {
    const result = await pool.query(
      `SELECT comments.id, comments.comment, comments.created_at, users.username
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.ticket_id = $1
       ORDER BY comments.created_at ASC`,
      [req.params.ticketId]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:ticketId/comments", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }
  if (!req.body.comment || !req.body.comment.trim()) {
    return res.status(400).json({ error: "Please provide a comment" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO comments (ticket_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING id, comment, created_at`,
      [req.params.ticketId, req.session.userId, req.body.comment.trim()]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];

router.patch("/:ticketId/status", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }

  const status = req.body.status;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const ticket = await pool.query(
      "SELECT project_id FROM tickets WHERE id = $1",
      [req.params.ticketId]
    );
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const membership = await pool.query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
      [ticket.rows[0].project_id, req.session.userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    const closedAt = status === "closed" ? "CURRENT_TIMESTAMP" : "NULL";
    await pool.query(
      `UPDATE tickets SET status = $1, closed_at = ${closedAt} WHERE id = $2`,
      [status, req.params.ticketId]
    );

    return res.json({ message: "Status updated" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;