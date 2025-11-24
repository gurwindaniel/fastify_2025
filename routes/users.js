const pool = require('../db/pool');
const bcryptjs=require('bcryptjs');

async function userRoutes(fastify, options) {

  // Display user creation form
  fastify.get('/users', async (req, reply) => {
    const roles = await pool.query("SELECT * FROM roles ORDER BY role_id ASC");

    return reply.view('users.ejs', {
      roles: roles.rows
    });
  });

  // Handle form POST
  fastify.post('/users/create', async (req, reply) => {
    const { user_name, passwords, role_id } = req.body;
    console.log(req.body);
   

    try {
       let roleid =Number(role_id);
       //hash password
       const saltRounds=10;
       const hashedPassword=await bcryptjs.hash(passwords,saltRounds);
        await pool.query(
            "INSERT INTO users (user_name, passwords, role_id) VALUES ($1, $2, $3)",
            [user_name, hashedPassword, roleid]
        );

        return reply.send({ success: true, message: "User created" });

    } catch (err) {
        return reply.send({ success: false, message: err.message });
    }
});


}

module.exports = userRoutes;
