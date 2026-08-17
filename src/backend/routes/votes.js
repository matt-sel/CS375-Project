const express = require("express");
const pool = require("../database");
const router = express.Router();
const isLoggedIn = require("../utils/auth");

router.post("/:ticketId", async (req, res) => {
  if (!isLoggedIn(req, res)) {
     return;
  }

  try {
    await pool.query(
      `INSERT INTO votes (ticket_id, user_id)
       VALUES ($1, $2)`,
       [req.params.ticketId, req.session.userId]
    );
    return res.json({
      message: "Successfully Voted"
    });
  } catch (err) {
    // Ran into this so I added a guard: https://www.postgresql.org/docs/8.4/errcodes-appendix.html
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Already voted"
      });
    }

    return res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;