const path = require("path");
const express = require("express");
const env = require("../env.json")
const session = require("express-session");

const app = express();

const PORT = 3000;
const hostname = "localhost";

const pool = require("./database");
const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());

// Docs: https://expressjs.com/en/resources/middleware/session/
app.use(session({
    secret: env.session_secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/index.html"))
})

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/register.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);

app.listen(PORT, hostname, () => {
    console.log(`http://${hostname}:${PORT}`);
});
