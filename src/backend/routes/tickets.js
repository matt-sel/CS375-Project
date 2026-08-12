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
            `SELECT tickets.*, users.username
            FROM tickets
            JOIN users ON tickets.user_id = users.id
            WHERE tickets.company_id = $1 
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