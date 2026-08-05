const express = require("express");
const pool = require("../database");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM companies ORDER BY name");
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }
});

module.exports = router;