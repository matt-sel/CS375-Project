const path = require("path");
const express = require("express");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 3000;
const secret = process.env.SESSION_SECRET ? process.env.SESSION_SECRET : require("../env.json").session_secret;

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const ticketRoutes = require("./routes/tickets");
const voteRoutes = require("./routes/votes");

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());

// Docs: https://expressjs.com/en/resources/middleware/session/
app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
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

app.get("/new-ticket", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/new-ticket.html"));
});

app.get("/projects", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/projects.html"))
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/votes", voteRoutes);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port: ${PORT}`)
});
