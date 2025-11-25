module.exports = async function (fastify) {

    // Root should bring login (central entry point)
    fastify.get('/', async (req, reply) => {
        return reply.redirect('/login');
    });

    const pool = require('../db/pool');
    const bcrypt = require("bcryptjs");

    // Show login page
    fastify.get("/login", async (req, reply) => {
        // If already authenticated, redirect to main app (GRN)
        if (req.user) return reply.redirect('/grn');
        return reply.view("login.ejs", { error: null, currentUser: req.user || null });
    });

    // Handle login form
    fastify.post("/login", async (req, reply) => {
        const { user_name, passwords } = req.body;
        
        const result =  await pool.query(
            "SELECT * FROM users WHERE user_name=$1", [user_name]
        );

        if (result.rows.length === 0) {
            return reply.view("login.ejs", { error: "User not found", currentUser: req.user || null });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(passwords, user.passwords);
        console.log("Is valid password:", isValid);

        if (!isValid) {
            return reply.view("login.ejs", { error: "Invalid password", currentUser: req.user || null });
        }

        console.log("User ID:", user.user_id)

        const token = fastify.jwt.sign({
            user_id: user.user_id,
            user_name: user.user_name
        });


        reply.setCookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/"
        });

        return reply.redirect("/grn");
    });

    // Logout
    fastify.get("/logout", async (req, reply) => {
        // Clear the cookie using same path as when it was set
        reply.clearCookie("token", { path: "/" });
        reply.redirect("/login");
    });
};
