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
            `SELECT tickets.*, users.username,
            ARRAY_AGG(tags.name) AS tags,
            COUNT(DISTINCT votes.user_id) AS vote_count
            FROM tickets

            JOIN users ON tickets.user_id = users.id
            LEFT JOIN ticket_tags ON tickets.id = ticket_tags.ticket_id
            LEFT JOIN tags ON ticket_tags.tag_id = tags.id
            LEFT JOIN votes on tickets.id = votes.ticket_id

            WHERE tickets.company_id = $1 
            GROUP BY tickets.id, users.username
            ORDER BY tickets.created_at DESC`,
            [req.session.companyId]
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ticketResult = await client.query(
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

      let tagResult = await client.query(
        "SELECT id FROM tags WHERE name = $1",
        [trimmed]
      );

      let tagId;
      if (tagResult.rows.length === 0) {
        // New user-created tag, no category chosen in the UI yet -- see note above
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
        [ticketId, tagId]
      );
    }

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Ticket created",
      ticket_id: ticketId
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      error: "Server error"
    });
  } finally {
    client.release();
  }
});

module.exports = router;