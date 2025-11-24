const path=require('path');
const fastify=require('fastify')({logger:true});
const fastifyStatic=require('@fastify/static')
const fastifyView=require('@fastify/view')

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
fastify.register(require('./routes/items'));
fastify.register(require('./routes/users'));


// Start server
fastify.listen({ port: 3000 }, err => {
  if (err) throw err;
  console.log("Server running on http://localhost:3000");
});