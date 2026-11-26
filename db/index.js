const { Pool } = require("pg");

const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/wt_lab8";

const isRenderDb =
    connectionString.includes("render.com") ||
    process.env.NODE_ENV === "production";

const pool = new Pool({
    connectionString,
    ssl: isRenderDb ? { rejectUnauthorized: false } : false
});

module.exports = pool;