const pool = require('../db/pool');

async function grnRoutes(fastify, options) {

  // Display GRN creation form
  fastify.get('/grn',
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const [addressResult, productResult] = await Promise.all([
          pool.query(
            "SELECT a.address_id, a.address_name, pt.person_type FROM address a JOIN person_type pt ON a.type_id = pt.type_id WHERE a.user_id = $1 ORDER BY a.address_id ASC",
            [req.user.user_id]
          ),
          pool.query(
            "SELECT product_id, product_name FROM product ORDER BY product_id ASC"
          )
        ]);

        return reply.view('grn.ejs', {
          addresses: addressResult.rows,
          products: productResult.rows,
          currentUser: req.user || null,
          message: null,
          error: null
        });
      } catch (err) {
        console.error(err);
        return reply.view('grn.ejs', {
          addresses: [],
          products: [],
          currentUser: req.user || null,
          message: null,
          error: 'Failed to load form data'
        });
      }
    }
  );

  // Handle GRN creation
  fastify.post('/grn/create',
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['address_id', 'product_id', 'grn_amount', 'grn_quantity'],
          properties: {
            address_id: {
              type: 'string',
              errorMessage: { type: 'Please select a valid address.' }
            },
            product_id: {
              type: 'string',
              errorMessage: { type: 'Please select a valid product.' }
            },
            grn_amount: {
              type: 'string',
              pattern: '^[0-9]+(\\.[0-9]{1,2})?$',
              errorMessage: { pattern: 'Amount must be a valid decimal (e.g., 1000.50).' }
            },
            grn_quantity: {
              type: 'string',
              pattern: '^[0-9]+$',
              errorMessage: { pattern: 'Quantity must be a whole number.' }
            }
          }
        }
      }
    },
    async (req, reply) => {
      try {
        const { address_id, product_id, grn_amount, grn_quantity } = req.body;
        const user_id = req.user.user_id;

        // Verify that the address belongs to the current user
        const addressCheck = await pool.query(
          "SELECT address_id FROM address WHERE address_id = $1 AND user_id = $2",
          [parseInt(address_id), user_id]
        );

        if (addressCheck.rows.length === 0) {
          throw new Error('Invalid address selected');
        }

        const result = await pool.query(
          "INSERT INTO grn (address_id, product_id, grn_amount, grn_quantity, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING grn_id",
          [parseInt(address_id), parseInt(product_id), parseFloat(grn_amount), parseInt(grn_quantity), user_id]
        );

        // Re-fetch form data
        const [addressResult, productResult] = await Promise.all([
          pool.query(
            "SELECT a.address_id, a.address_name, pt.person_type FROM address a JOIN person_type pt ON a.type_id = pt.type_id WHERE a.user_id = $1 ORDER BY a.address_id ASC",
            [user_id]
          ),
          pool.query(
            "SELECT product_id, product_name FROM product ORDER BY product_id ASC"
          )
        ]);

        return reply.view('grn.ejs', {
          addresses: addressResult.rows,
          products: productResult.rows,
          currentUser: req.user || null,
          message: `GRN created successfully! GRN ID: ${result.rows[0].grn_id}`,
          error: null
        });
      } catch (err) {
        console.error('GRN creation error:', err);

        const [addressResult, productResult] = await Promise.all([
          pool.query(
            "SELECT a.address_id, a.address_name, pt.person_type FROM address a JOIN person_type pt ON a.type_id = pt.type_id WHERE a.user_id = $1 ORDER BY a.address_id ASC",
            [req.user.user_id]
          ),
          pool.query(
            "SELECT product_id, product_name FROM product ORDER BY product_id ASC"
          )
        ]);

        return reply.view('grn.ejs', {
          addresses: addressResult.rows,
          products: productResult.rows,
          currentUser: req.user || null,
          message: null,
          error: err.message || 'Failed to create GRN'
        });
      }
    }
  );

  // Display list of user's GRNs
  fastify.get('/grn/list',
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const grns = await pool.query(
          `SELECT g.grn_id, g.grn_amount, g.grn_quantity, g.grn_date,
                  p.product_name, a.address_name, pt.person_type
           FROM grn g
           JOIN product p ON g.product_id = p.product_id
           JOIN address a ON g.address_id = a.address_id
           JOIN person_type pt ON a.type_id = pt.type_id
           WHERE g.user_id = $1
           ORDER BY g.grn_date DESC`,
          [req.user.user_id]
        );

        return reply.view('grnList.ejs', {
          grns: grns.rows,
          currentUser: req.user || null
        });
      } catch (err) {
        console.error(err);
        return reply.send({ error: err.message });
      }
    }
  );

  // Get all GRNs (JSON endpoint for AJAX, optional)
  fastify.get('/grn/api/list',
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const grns = await pool.query(
          `SELECT g.grn_id, g.grn_amount, g.grn_quantity, g.grn_date,
                  p.product_name, a.address_name, pt.person_type
           FROM grn g
           JOIN product p ON g.product_id = p.product_id
           JOIN address a ON g.address_id = a.address_id
           JOIN person_type pt ON a.type_id = pt.type_id
           WHERE g.user_id = $1
           ORDER BY g.grn_date DESC`,
          [req.user.user_id]
        );
        return reply.send(grns.rows);
      } catch (err) {
        console.error(err);
        return reply.send({ error: err.message });
      }
    }
  );

}

module.exports = grnRoutes;
