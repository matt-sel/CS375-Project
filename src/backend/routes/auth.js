const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../database");
const router = express.Router();

/* Login route, sets session auth with userId */
router.post("/login", async (req, res) => {
  if (!req.body.hasOwnProperty("email")) {
    return res.status(400).json({
      error: "Please provide an email address"
    })
  }

  if (!req.body.hasOwnProperty("password")) {
    return res.status(400).json({
      error: "Please provide a password"
    })
  }

  const email = req.body.email;
  const password = req.body.password;

  try {
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const user = result.rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    req.session.userId = user.id;

    return res.json({
      message: "Login sucessful",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    })
  }
});

/* Register route, creates a new user in the db */
router.post("/register", async (req, res) => {
  if (!req.body.hasOwnProperty("username")) {
    return res.status(400).json({
      error: "Please provide a username"
    });
  }

  if (!req.body.hasOwnProperty("email")) {
    return res.status(400).json({
      error: "Please provide an email address"
    });
  }

  if (!req.body.hasOwnProperty("password")) {
    return res.status(400).json({
      error: "Please provide a password"
    });
  }

  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, hash]
    );

    const user = result.rows[0];

    return res.status(200).json({
      message: "Successfully registered user",
      user_id: user.id,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Username or email already exists"
      });
    }

    return res.status(500).json({
      error: "Server error"
    });
  }
});

/* Grabs the current user, null if doesn' exist or not logged in */
router.get("/user", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "User not logged in"
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      req.session.destroy(); // Ends session, removes the session property from the request
      return res.status(401).json({
        user: null
      });
    }

    return res.json({
      user: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }
});

/* Logout route, destroys the session */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: "Server error"
      });
    }
    return res.json({
      message: "Logout successful"
    });
  });
});

module.exports = router;