const pg = require("pg");
const path = require("path");
const express = require("express");
const app = express();

const PORT = 3000;
const hostname = "localhost";

const env = require("../../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

pool.connect().then(function() {
    console.log('Connected to database');
})

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());

app.listen(PORT, hostname, () => {
    console.log(`http://${hostname}:${PORT}`);
});
