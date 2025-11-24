//routes/items.js
const pool=require('../db/pool');

//Get all items
async function  itemRoutes(fastify,options){

    //Home Page
    fastify.get('/items',async(request,reply)=>{
        try{
            const item=await pool.query('SELECT * FROM items ORDER BY id ASC');
            return reply.view('/index.ejs',{items:item.rows});

        }catch(err){
            console.error(err.message);
        }
    })

}

module.exports=itemRoutes;