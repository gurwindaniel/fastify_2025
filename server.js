const path=require('path');
// At the top-level of your main server file (e.g., server.js)
global.pgPool = require('./db/pool');
const pool=global.pgPool;
const fastify=require('fastify')({
  logger:true,
  ajv:{
    customOptions:{allErrors:true},
    plugins:[require('ajv-errors')],
  }

});
const fastifyStatic=require('@fastify/static')
const fastifyView=require('@fastify/view')

//Register JWT
fastify.register(require("@fastify/cookie"));
fastify.register(require('@fastify/jwt'),{
  secret: process.env.SECRET || 'supersecretkey',
  sign:{expiresIn:'1h'},
   cookie: {
    cookieName: 'token',
    signed: false
  }
})

// Silent auth: attempt to verify token on every request and attach user to request
fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify();
    // request.user will be set by jwtVerify on success
    console.log('Silent auth: user attached', request.user && request.user.user_name);
  } catch (err) {
    // no valid token — continue without attaching user
  }
});


// Add a decorator to access user info
fastify.decorate("authenticate", async function (request, reply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.redirect('/login');
    }
});

// Global Auth Hook
fastify.addHook("preHandler", async (req, reply) => {

    const url = req.raw.url;
    console.log("Requested URL:", url);

  // Log parsed cookies for debugging to see if token is present
  try {
    console.log('Parsed cookies on request:', req.cookies);
  } catch (e) {
    console.log('No cookies parsed on request');
  }

    // Allow ALL static files
    if (url.startsWith("/public/")) return;

    // Allow authentication-free pages
    const publicRoutes = ["/login", "/"];
    if (publicRoutes.includes(url)) return;

    try {
        await req.jwtVerify();
    } catch (err) {
        return reply.redirect("/login");
    }
});



//Register view engine
fastify.register(fastifyView,{
    engine:{ejs:require('ejs')},
    root:path.join(__dirname,'views'),
})

//Register static files
fastify.register(fastifyStatic,{
    root:path.join(__dirname,'public'),
    prefix:'/public/',
})

fastify.register(require('@fastify/formbody'));

// URL-encoded parser
// fastify.addContentTypeParser(
//   'application/x-www-form-urlencoded',
//   { parseAs: 'string' },
//   (req, body, done) => {
//     try {
//       const data = Object.fromEntries(new URLSearchParams(body));
//       done(null, data);
//     } catch (err) {
//       done(err);
//     }
//   }
// );

//Import routes
fastify.register(require('./routes/auth'));
fastify.register(require('./routes/users'));
fastify.register(require('./routes/address'));
fastify.register(require('./routes/product'));
fastify.register(require('./routes/grn'));
fastify.register(require('./routes/invoice'));
fastify.register(require('./routes/dashboard'));



// Start server
fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});