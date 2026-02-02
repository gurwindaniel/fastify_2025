const {Pool} = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const caCert = fs.readFileSync(path.join(__dirname, 'ca.pem')).toString();
//Create a connection pool
// const pool=new Pool({
//     user:'postgres',
//     host:'localhost',
//     database:'fastinv',
//     password:'trogen',
//     port:5432
// })

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        ca: caCert,
        rejectUnauthorized: false // Avien Cloud usually requires SSL
    }
});



module.exports=pool;