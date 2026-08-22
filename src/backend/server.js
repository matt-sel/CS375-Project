const path = require("path");
const express = require("express");
const env = require("../env.json")
const session = require("express-session");

const app = express();

const PORT = 3000;
const hostname = "localhost";

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const ticketRoutes = require("./routes/tickets");
const voteRoutes = require("./routes/votes");

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

app.get("/tickets", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/html/tickets.html"))
});

app.get("/projects", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/projects.html"))
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/votes", voteRoutes);

app.listen(PORT, hostname, () => {
    console.log(`http://${hostname}:${PORT}`);
});
