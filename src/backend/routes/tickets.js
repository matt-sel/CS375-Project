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
            ARRAY_AGG(tags.name) AS tags
            FROM tickets

            JOIN users ON tickets.user_id = users.id
            LEFT JOIN ticket_tags ON tickets.id = ticket_tags.ticket_id
            LEFT JOIN tags ON ticket_tags.tag_id = tags.id

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

module.exports = router;