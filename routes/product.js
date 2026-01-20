const pool = global.pgPool;

async function productRoutes(fastify, options) {

  // Display product creation form
  fastify.get('/product',
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const products = await pool.query(
          "SELECT product_id, product_name FROM product ORDER BY product_id ASC"
        );

        return reply.view('product.ejs', {
          products: products.rows,
          currentUser: req.user || null,
          message: null,
          error: null
        });
      } catch (err) {
        console.error(err);
        return reply.view('product.ejs', {
          products: [],
          currentUser: req.user || null,
          message: null,
          error: 'Failed to load products'
        });
      }
    }
  );

  // Handle product creation
  fastify.post('/product/create',
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['product_name'],
          properties: {
            product_name: {
              type: 'string',
              minLength: 3,
              errorMessage: {
                minLength: 'Product name must be at least 3 characters long.'
              }
            }
          }
        }
      }
    },
    async (req, reply) => {
      try {
        const { product_name } = req.body;

        const result = await pool.query(
          "INSERT INTO product (product_name) VALUES ($1) RETURNING product_id",
          [product_name]
        );

        // Fetch all products to re-render
        const products = await pool.query(
          "SELECT product_id, product_name FROM product ORDER BY product_id ASC"
        );

        return reply.view('product.ejs', {
          products: products.rows,
          currentUser: req.user || null,
          message: `Product "${product_name}" created successfully! Product ID: ${result.rows[0].product_id}`,
          error: null
        });
      } catch (err) {
        console.error('Product creation error:', err);

        const products = await pool.query(
          "SELECT product_id, product_name FROM product ORDER BY product_id ASC"
        );

        return reply.view('product.ejs', {
          products: products.rows,
          currentUser: req.user || null,
          message: null,
          error: err.message || 'Failed to create product'
        });
      }
    }
  );

  // Get all products (JSON endpoint for AJAX, optional)
  fastify.get('/product/api/list',
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const products = await pool.query(
          "SELECT product_id, product_name FROM product ORDER BY product_id ASC"
        );
        return reply.send(products.rows);
      } catch (err) {
        console.error(err);
        return reply.send({ error: err.message });
      }
    }
  );

}

module.exports = productRoutes;
