const {Pool} = require('pg');

//Create a connection pool
const pool=new Pool({
    user:'postgres',
    host:'localhost',
    database:'fastinv',
    password:'trogen',
    port:5432
})



module.exports=pool;