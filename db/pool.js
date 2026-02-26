const {Pool} = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Check if running on Heroku (DATABASE_URL is set) or locally
const isHeroku = !!process.env.DATABASE_URL;

let pool;

if (isHeroku) {
    // Heroku PostgreSQL - uses DATABASE_URL
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // Local/Aiven with ca.pem certificate
    const caCert = fs.readFileSync(path.join(__dirname, 'ca.pem')).toString();
    pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: {
            ca: caCert,
            rejectUnauthorized: false
        }
    });
}



module.exports=pool;