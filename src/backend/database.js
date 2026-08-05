const pg = require("pg");
const env = require("../env.json");

const Pool = pg.Pool;
const pool = new Pool(env);

pool.connect().then(function() {
    console.log('Connected to database');
});

module.exports = pool;