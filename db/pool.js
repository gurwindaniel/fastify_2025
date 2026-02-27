const {Pool} = require('pg');
require('dotenv').config();

let sslCert = process.env.SSL_CERT;
if (sslCert) {
    sslCert = sslCert.replace(/\\n/g, '\n');
}
console.log(sslCert);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        ca: sslCert,
        rejectUnauthorized: true
    }
});

module.exports = pool;