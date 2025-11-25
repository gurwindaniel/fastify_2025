const pool = require('../db/pool');

async function addressRoutes(fastify, options) {
  
  // Display address form
  fastify.get('/address', 
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const personTypes = await pool.query(
          "SELECT type_id, person_type FROM person_type ORDER BY type_id ASC"
        );
        
        return reply.view('address.ejs', {
          personTypes: personTypes.rows,
          currentUser: req.user || null,
          message: null,
          error: null
        });
      } catch (err) {
        console.error(err);
        return reply.view('address.ejs', {
          personTypes: [],
          currentUser: req.user || null,
          message: null,
          error: 'Failed to load person types'
        });
      }
    }
  );

  // Handle address creation
  fastify.post('/address/create',
    { 
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['address_name', 'type_id', 'locations', 'pincode'],
          properties: {
            address_name: {
              type: 'string',
              minLength: 3,
              errorMessage: {
                minLength: 'Address name must be at least 3 characters long.'
              }
            },
            type_id: {
              type: 'string',
              errorMessage: {
                type: 'Please select a valid person type.'
              }
            },
            locations: {
              type: 'string',
              minLength: 5,
              errorMessage: {
                minLength: 'Location must be at least 5 characters long.'
              }
            },
            pincode: {
              type: 'string',
              pattern: '^[0-9]{6,8}$',
              errorMessage: {
                pattern: 'Pincode must be 6-8 digits.'
              }
            }
          }
        }
      }
    },
    async (req, reply) => {
      try {
        const { address_name, type_id, locations, pincode } = req.body;
        const user_id = req.user.user_id;

        const result = await pool.query(
          "INSERT INTO address (address_name, type_id, locations, pincode, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING address_id",
          [address_name, parseInt(type_id), locations, parseInt(pincode), user_id]
        );

        // Fetch person types to re-render form with success message
        const personTypes = await pool.query(
          "SELECT type_id, person_type FROM person_type ORDER BY type_id ASC"
        );

        return reply.view('address.ejs', {
          personTypes: personTypes.rows,
          currentUser: req.user || null,
          message: `Address created successfully! Address ID: ${result.rows[0].address_id}`,
          error: null
        });
      } catch (err) {
        console.error('Address creation error:', err);
        
        const personTypes = await pool.query(
          "SELECT type_id, person_type FROM person_type ORDER BY type_id ASC"
        );

        return reply.view('address.ejs', {
          personTypes: personTypes.rows,
          currentUser: req.user || null,
          message: null,
          error: err.message || 'Failed to create address'
        });
      }
    }
  );

  // Optional: Display list of user's addresses
  fastify.get('/address/list',
    { preHandler: fastify.authenticate },
    async (req, reply) => {
      try {
        const addresses = await pool.query(
          `SELECT a.address_id, a.address_name, pt.person_type, a.locations, a.pincode, a.address_date
           FROM address a
           JOIN person_type pt ON a.type_id = pt.type_id
           WHERE a.user_id = $1
           ORDER BY a.address_date DESC`,
          [req.user.user_id]
        );

        return reply.view('addressList.ejs', {
          addresses: addresses.rows,
          currentUser: req.user || null
        });
      } catch (err) {
        console.error(err);
        return reply.send({ error: err.message });
      }
    }
  );

}

module.exports = addressRoutes;
