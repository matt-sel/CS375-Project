const express = require("express");
const pool = require("../database");
const router = express.Router();
const isLoggedIn = require("../utils/auth");

router.post("/:ticketId", async (req, res) => {
  if (!isLoggedIn(req, res)) {
    return;
  }

  try {
    const existingVote = await pool.query(
      `SELECT 1
       FROM votes
       WHERE ticket_id = $1 AND user_id = $2`,
      [req.params.ticketId, req.session.userId]
    );

    if (existingVote.rows.length > 0) {
      await pool.query(
        `DELETE FROM votes
         WHERE ticket_id = $1 AND user_id = $2`,
        [req.params.ticketId, req.session.userId]
      );

      return res.json({
        message: "Vote removed"
      });
    }

    await pool.query(
      `INSERT INTO votes (ticket_id, user_id)
       VALUES ($1, $2)`,
      [req.params.ticketId, req.session.userId]
    );

    return res.json({
      message: "Successfully voted"
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;