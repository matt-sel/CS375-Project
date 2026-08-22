const pg = require("pg");

const Pool = pg.Pool;
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        } : require("../env.json")
);

pool.connect().then(function() {
    console.log('Connected to database');
});

module.exports = pool;