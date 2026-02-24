const pool = global.pgPool;
async function dashboardRoutes(fastify, options) {

  // Dashboard page
  fastify.get('/dashboard', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      // load vendor addresses for the current user
      const vendors = await pool.query(
        `SELECT a.address_id, a.address_name
         FROM address a
         JOIN person_type pt ON a.type_id = pt.type_id
         WHERE pt.person_type = 'Vendor' AND a.user_id = $1
         ORDER BY a.address_name`,
        [req.user.user_id]
      );

      return reply.view('dashboard.ejs', {
        vendors: vendors.rows,
        currentUser: req.user || null
      });
    } catch (err) {
      console.error('Dashboard render error:', err);
      return reply.view('dashboard.ejs', { vendors: [], currentUser: req.user || null, error: 'Failed to load dashboard' });
    }
  });

  // API: overall summary (sales, estimated purchase cost, profit)
  fastify.get('/dashboard/summary', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const userId = req.user.user_id;

      const q = `
WITH grn_stats AS (
  -- grn_amount is stored as total received amount for the row (do not multiply by quantity)
  SELECT product_id, SUM(grn_quantity) AS received_qty, SUM(grn_amount) AS received_cost
  FROM grn
  WHERE user_id = $1
  GROUP BY product_id
), sale_stats AS (
  -- sale_amount is stored as total sale amount for the row (do not multiply by quantity)
  SELECT product_id, SUM(sale_quantity) AS sold_qty, SUM(sale_amount) AS sales_amount
  FROM sale
  WHERE user_id = $1
  GROUP BY product_id
), combined AS (
  SELECT COALESCE(s.product_id, g.product_id) AS product_id,
         COALESCE(s.sold_qty,0) AS sold_qty,
         COALESCE(s.sales_amount,0) AS sales_amount,
         COALESCE(g.received_qty,0) AS received_qty,
         COALESCE(g.received_cost,0) AS received_cost
  FROM sale_stats s
  FULL OUTER JOIN grn_stats g ON s.product_id = g.product_id
)
SELECT
  SUM(sales_amount)::numeric(18,2) AS total_sales,
  -- estimated purchase cost for sold units: sold_qty * (received_cost/received_qty)
  SUM(CASE WHEN received_qty>0 THEN sold_qty * (received_cost/received_qty) ELSE 0 END)::numeric(18,2) AS estimated_purchase_cost,
  (SUM(sales_amount) - SUM(CASE WHEN received_qty>0 THEN sold_qty * (received_cost/received_qty) ELSE 0 END))::numeric(18,2) AS profit
FROM combined;
      `;

      const res = await pool.query(q, [userId]);
      const row = res.rows[0] || { total_sales: 0, estimated_purchase_cost: 0, profit: 0 };
      return reply.send(row);
    } catch (err) {
      console.error('Dashboard summary error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // API: vendor -> product profit/stats
  fastify.get('/dashboard/vendor-products', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const vendorId = parseInt(req.query.vendor_id);
      const userId = req.user.user_id;
      if (isNaN(vendorId)) return reply.code(400).send({ error: 'Invalid vendor id' });

      const q = `
  WITH grn_stats AS (
        -- total received cost = sum of grn_amount (each grn_amount is already a total for that GRN row)
        SELECT product_id, SUM(grn_quantity) AS received_qty, SUM(grn_amount) AS received_cost
    FROM grn
    WHERE address_id = $1 AND user_id = $2
    GROUP BY product_id
  ), sale_stats AS (
    -- sales that are linked to this vendor either by vendor_address_id or by originating GRN
        -- sale_amount is stored as total sale amount for the sale row
        SELECT product_id, SUM(sale_quantity) AS sold_qty, SUM(sale_amount) AS sales_amount
    FROM sale
    WHERE user_id = $2 AND (vendor_address_id = $1 OR grn_id IN (SELECT grn_id FROM grn WHERE address_id = $1 AND user_id = $2))
    GROUP BY product_id
  )
SELECT p.product_id, p.product_name,
       COALESCE(g.received_qty,0) AS received_qty,
       COALESCE(g.received_cost,0) AS received_cost,
       COALESCE(s.sold_qty,0) AS sold_qty,
       COALESCE(s.sales_amount,0) AS sales_amount,
      -- profit as requested: (sales_amount * sold_qty) - (received_cost * sold_qty)
      (COALESCE(s.sales_amount,0) * COALESCE(s.sold_qty,0) - COALESCE(g.received_cost,0) * COALESCE(s.sold_qty,0)) AS profit_est
FROM product p
JOIN grn_stats g ON p.product_id = g.product_id
LEFT JOIN sale_stats s ON p.product_id = s.product_id
ORDER BY profit_est DESC;
      `;

      const res = await pool.query(q, [vendorId, userId]);
      return reply.send(res.rows);
    } catch (err) {
      console.error('Vendor products error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // API: Sales Dashboard Summary
  fastify.get('/dashboard/sales-summary', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const userId = req.user.user_id;
      const q = `
        SELECT 
          COUNT(DISTINCT i.invoice_id) AS total_invoices,
          COUNT(DISTINCT i.address_id) AS total_customers,
          COALESCE(SUM(s.sale_quantity), 0) AS total_items_sold,
          COALESCE(SUM(s.sale_amount), 0)::numeric(18,2) AS total_sales_amount
        FROM sale s
        JOIN invoice i ON s.invoice_id = i.invoice_id
        WHERE s.user_id = $1
      `;
      const res = await pool.query(q, [userId]);
      return reply.send(res.rows[0] || { total_invoices: 0, total_customers: 0, total_items_sold: 0, total_sales_amount: 0 });
    } catch (err) {
      console.error('Sales summary error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // API: Monthly Sales
  fastify.get('/dashboard/monthly-sales', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const userId = req.user.user_id;
      const q = `
        SELECT 
          DATE_TRUNC('month', sale_date) AS month,
          SUM(sale_amount)::numeric(18,2) AS monthly_sales,
          SUM(sale_quantity) AS monthly_quantity
        FROM sale
        WHERE user_id = $1
        GROUP BY month
        ORDER BY month
      `;
      const res = await pool.query(q, [userId]);
      return reply.send(res.rows);
    } catch (err) {
      console.error('Monthly sales error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // API: Inventory Dashboard
  fastify.get('/dashboard/inventory', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const userId = req.user.user_id;
      const q = `
        SELECT 
          p.product_id,
          p.product_name,
          COALESCE(SUM(g.grn_quantity), 0) AS total_received,
          COALESCE(SUM(s.sale_quantity), 0) AS total_sold,
          COALESCE(SUM(g.grn_quantity), 0) - COALESCE(SUM(s.sale_quantity), 0) AS current_stock
        FROM product p
        LEFT JOIN grn g ON p.product_id = g.product_id AND g.user_id = $1
        LEFT JOIN sale s ON p.product_id = s.product_id AND s.user_id = $1
        GROUP BY p.product_id, p.product_name
        ORDER BY p.product_name
      `;
      const res = await pool.query(q, [userId]);
      return reply.send(res.rows);
    } catch (err) {
      console.error('Inventory error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // API: Low Stock Alert
  fastify.get('/dashboard/low-stock', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const userId = req.user.user_id;
      const threshold = parseInt(req.query.threshold) || 5;
      const q = `
        SELECT *
        FROM (
          SELECT 
            p.product_id,
            p.product_name,
            COALESCE(SUM(g.grn_quantity), 0) - COALESCE(SUM(s.sale_quantity), 0) AS current_stock
          FROM product p
          LEFT JOIN grn g ON p.product_id = g.product_id AND g.user_id = $1
          LEFT JOIN sale s ON p.product_id = s.product_id AND s.user_id = $1
          GROUP BY p.product_id, p.product_name
        ) stock_data
        WHERE current_stock < $2
        ORDER BY current_stock ASC
      `;
      const res = await pool.query(q, [userId, threshold]);
      return reply.send(res.rows);
    } catch (err) {
      console.error('Low stock error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // API: Profit Dashboard by Product
  fastify.get('/dashboard/profit-by-product', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const userId = req.user.user_id;
      const q = `
        SELECT 
          p.product_id,
          p.product_name,
          COALESCE(SUM(g.grn_amount), 0)::numeric(18,2) AS total_purchase_amount,
          COALESCE(SUM(s.sale_amount), 0)::numeric(18,2) AS total_sales_amount,
          (COALESCE(SUM(s.sale_amount), 0) - COALESCE(SUM(g.grn_amount), 0))::numeric(18,2) AS gross_profit
        FROM product p
        LEFT JOIN grn g ON p.product_id = g.product_id AND g.user_id = $1
        LEFT JOIN sale s ON p.product_id = s.product_id AND s.user_id = $1
        GROUP BY p.product_id, p.product_name
        ORDER BY gross_profit DESC
      `;
      const res = await pool.query(q, [userId]);
      return reply.send(res.rows);
    } catch (err) {
      console.error('Profit by product error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

  // API: Overall Business Summary
  fastify.get('/dashboard/business-summary', { preHandler: fastify.authenticate }, async (req, reply) => {
    try {
      const userId = req.user.user_id;
      const q = `
        SELECT 
          (SELECT COALESCE(SUM(grn_amount), 0) FROM grn WHERE user_id = $1)::numeric(18,2) AS total_purchase,
          (SELECT COALESCE(SUM(sale_amount), 0) FROM sale WHERE user_id = $1)::numeric(18,2) AS total_sales,
          ((SELECT COALESCE(SUM(sale_amount), 0) FROM sale WHERE user_id = $1) -
           (SELECT COALESCE(SUM(grn_amount), 0) FROM grn WHERE user_id = $1))::numeric(18,2) AS total_profit
      `;
      const res = await pool.query(q, [userId]);
      return reply.send(res.rows[0] || { total_purchase: 0, total_sales: 0, total_profit: 0 });
    } catch (err) {
      console.error('Business summary error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });

}

module.exports = dashboardRoutes;
