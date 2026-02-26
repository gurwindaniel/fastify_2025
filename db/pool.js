const {Pool} = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Check if running on Heroku (DATABASE_URL is set) or locally
const isHeroku = !!process.env.DATABASE_URL;

let pool;

if (isHeroku) {
    // Heroku with external DB (e.g., Aiven) - uses DATABASE_URL
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // Local/Aiven with ca.pem certificate
    const caPath = path.join(__dirname, 'ca.pem');
    const hasCert = fs.existsSync(caPath);
    
    pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: hasCert ? {
            ca: fs.readFileSync(caPath).toString(),
            rejectUnauthorized: true
        } : false
    });
}

module.exports = pool;