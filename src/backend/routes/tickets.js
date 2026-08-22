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
            ARRAY_AGG(tags.name) AS tags,
            COUNT(DISTINCT votes.user_id) AS vote_count
            FROM tickets

            JOIN project_members ON tickets.project_id = project_members.project_id
                AND project_members.user_id = $2
            JOIN users ON tickets.user_id = users.id
            LEFT JOIN ticket_tags ON tickets.id = ticket_tags.ticket_id
            LEFT JOIN tags ON ticket_tags.tag_id = tags.id
            LEFT JOIN votes on tickets.id = votes.ticket_id

            WHERE tickets.project_id = $1
            GROUP BY tickets.id, users.username
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

  const title = req.body.title.trim();
  const description = req.body.description ? req.body.description.trim() : "";
  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

  try {
    const ticketResult = await pool.query(
      `INSERT INTO tickets (company_id, user_id, title, description, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING id`,
      [req.session.companyId, req.session.userId, title, description]
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

module.exports = router;