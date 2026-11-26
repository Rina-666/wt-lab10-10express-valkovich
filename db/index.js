const { Pool } = require("pg");

const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:JynbBpxMzh85zQEe3NawNxKU4S6t1etb@localhost:5432/wt_lab8_db_valkovich";

const isRenderDb =
    connectionString.includes("render.com") ||
    process.env.NODE_ENV === "production";

const pool = new Pool({
    connectionString,
    ssl: isRenderDb ? { rejectUnauthorized: false } : false
});

module.exports = pool;