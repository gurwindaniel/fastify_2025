const pool = global.pgPool;

async function invoiceRoutes(fastify, options) {

  // Render invoice creation page
  fastify.get('/invoice', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      // Customer addresses (person_type = 'Customer') belonging to this user
      const customerAddresses = await pool.query(
        `SELECT a.address_id, a.address_name
         FROM address a
         JOIN person_type pt ON a.type_id = pt.type_id
         WHERE pt.person_type = 'Customer' AND a.user_id = $1
         ORDER BY a.address_id ASC`,
        [req.user.user_id]
      );

      // Vendor addresses (person_type = 'Vendor') belonging to this user
      const vendorAddresses = await pool.query(
        `SELECT a.address_id, a.address_name
         FROM address a
         JOIN person_type pt ON a.type_id = pt.type_id
         WHERE pt.person_type = 'Vendor' AND a.user_id = $1
         ORDER BY a.address_id ASC`,
        [req.user.user_id]
      );

      return reply.view('invoice.ejs', {
        customerAddresses: customerAddresses.rows,
        vendorAddresses: vendorAddresses.rows,
        products: [],
        currentUser: req.user || null,
        message: null,
        error: null
      });
    } catch (err) {
      console.error('Invoice page error:', err);
      return reply.view('invoice.ejs', {
        customerAddresses: [],
        vendorAddresses: [],
        products: [],
        currentUser: req.user || null,
        message: null,
        error: 'Failed to load invoice form data'
      });
    }
  });

  // AJAX: get products supplied by a vendor (distinct products from GRN)
  fastify.get('/invoice/vendor-products', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const vendorId = parseInt(req.query.vendor_id);
      if (isNaN(vendorId)) return reply.code(400).send({ error: 'Invalid vendor id' });

      const products = await pool.query(
        `SELECT p.product_id, p.product_name,
                COALESCE(AVG(g.grn_amount::numeric), 0) AS received_price
         FROM product p
         JOIN grn g ON p.product_id = g.product_id
         WHERE g.address_id = $1 AND g.user_id = $2
         GROUP BY p.product_id, p.product_name
         ORDER BY p.product_name ASC`,
        [vendorId, req.user.user_id]
      );

      return reply.send(products.rows);
    } catch (err) {
      console.error('Vendor products error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // Create invoice and a sale line (single-line invoice)
  fastify.post('/invoice/create', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const { customer_address_id, vendor_address_id, product_id, sale_quantity, sale_amount } = req.body;
      const user_id = req.user.user_id;

      if (!customer_address_id || !product_id || !sale_quantity || !sale_amount) {
        throw new Error('Missing required fields');
      }

      // Ensure customer_address_id belongs to this user and is a Customer
      const custCheck = await pool.query(
        `SELECT a.address_id FROM address a JOIN person_type pt ON a.type_id = pt.type_id
         WHERE a.address_id = $1 AND a.user_id = $2 AND pt.person_type = 'Customer'`,
        [parseInt(customer_address_id), user_id]
      );
      if (custCheck.rows.length === 0) throw new Error('Invalid customer address selected');

      // If vendor_address_id provided, ensure it belongs to user and is Vendor
      let vendorId = null;
      if (vendor_address_id) {
        const vendorCheck = await pool.query(
          `SELECT a.address_id FROM address a JOIN person_type pt ON a.type_id = pt.type_id
           WHERE a.address_id = $1 AND a.user_id = $2 AND pt.person_type = 'Vendor'`,
          [parseInt(vendor_address_id), user_id]
        );
        if (vendorCheck.rows.length === 0) throw new Error('Invalid vendor address selected');
        vendorId = parseInt(vendor_address_id);
      }

      // Create invoice
      const invRes = await pool.query(
        'INSERT INTO invoice (address_id, user_id) VALUES ($1, $2) RETURNING invoice_id',
        [parseInt(customer_address_id), user_id]
      );
      const invoiceId = invRes.rows[0].invoice_id;

      // Insert sale line
      const saleRes = await pool.query(
        `INSERT INTO sale (invoice_id, product_id, grn_id, vendor_address_id, sale_amount, sale_quantity, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING sale_id`,
        [invoiceId, parseInt(product_id), null, vendorId, parseFloat(sale_amount), parseInt(sale_quantity), user_id]
      );

      return reply.view('invoice.ejs', {
        customerAddresses: (await pool.query(`SELECT a.address_id, a.address_name FROM address a JOIN person_type pt ON a.type_id=pt.type_id WHERE pt.person_type='Customer' AND a.user_id=$1`, [user_id])).rows,
        vendorAddresses: (await pool.query(`SELECT a.address_id, a.address_name FROM address a JOIN person_type pt ON a.type_id=pt.type_id WHERE pt.person_type='Vendor' AND a.user_id=$1`, [user_id])).rows,
        products: [],
        currentUser: req.user || null,
        message: `Invoice ${invoiceId} created. Sale ID: ${saleRes.rows[0].sale_id}`,
        error: null
      });

    } catch (err) {
      console.error('Invoice create error:', err);
      const user_id = req.user && req.user.user_id;
      return reply.view('invoice.ejs', {
        customerAddresses: user_id ? (await pool.query(`SELECT a.address_id, a.address_name FROM address a JOIN person_type pt ON a.type_id=pt.type_id WHERE pt.person_type='Customer' AND a.user_id=$1`, [user_id])).rows : [],
        vendorAddresses: user_id ? (await pool.query(`SELECT a.address_id, a.address_name FROM address a JOIN person_type pt ON a.type_id=pt.type_id WHERE pt.person_type='Vendor' AND a.user_id=$1`, [user_id])).rows : [],
        products: [],
        currentUser: req.user || null,
        message: null,
        error: err.message || 'Failed to create invoice'
      });
    }
  });

  // List invoices and sales for the user
  fastify.get('/invoice/list', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const rows = await pool.query(
        `SELECT i.invoice_id, i.invoice_date, c.address_name AS customer_address,
                s.sale_id, p.product_name, s.sale_quantity, s.sale_amount, v.address_name AS vendor_address
         FROM invoice i
         JOIN sale s ON s.invoice_id = i.invoice_id
         JOIN product p ON s.product_id = p.product_id
         LEFT JOIN address v ON s.vendor_address_id = v.address_id
         JOIN address c ON i.address_id = c.address_id
         WHERE i.user_id = $1
         ORDER BY i.invoice_date DESC`,
        [req.user.user_id]
      );

      return reply.view('invoiceList.ejs', { rows: rows.rows, currentUser: req.user || null });
    } catch (err) {
      console.error('Invoice list error:', err);
      return reply.send({ error: err.message });
    }
  });

}

module.exports = invoiceRoutes;
