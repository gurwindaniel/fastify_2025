✅ 1️⃣ Total Sales Dashboard
SELECT 
    COUNT(DISTINCT invoice_id) AS total_invoices,
    SUM(sale_quantity) AS total_quantity_sold,
    SUM(sale_amount) AS total_sales_amount
FROM sale;


✅ 2️⃣ Product-wise Sales Report
SELECT 
    p.product_name,
    SUM(s.sale_quantity) AS total_quantity_sold,
    SUM(s.sale_amount) AS total_sales_amount
FROM sale s
JOIN product p ON s.product_id = p.product_id
GROUP BY p.product_name
ORDER BY total_sales_amount DESC;
✅ 3️⃣ Inventory Status Dashboard
SELECT 
    p.product_name,
    COALESCE(SUM(g.grn_quantity), 0) AS total_purchased,
    COALESCE(SUM(s.sale_quantity), 0) AS total_sold,
    COALESCE(SUM(g.grn_quantity), 0) - 
    COALESCE(SUM(s.sale_quantity), 0) AS current_stock
FROM product p
LEFT JOIN grn g ON p.product_id = g.product_id
LEFT JOIN sale s ON p.product_id = s.product_id
GROUP BY p.product_name
ORDER BY p.product_name;
✅ 4️⃣ Customer-wise Sales Report
SELECT 
    a.address_name AS customer_name,
    SUM(s.sale_amount) AS total_purchase_amount
FROM sale s
JOIN invoice i ON s.invoice_id = i.invoice_id
JOIN address a ON i.address_id = a.address_id
GROUP BY a.address_name
ORDER BY total_purchase_amount DESC;
✅ 5️⃣ Profit Analysis Dashboard
SELECT 
    p.product_name,
    COALESCE(SUM(g.grn_amount), 0) AS total_purchase_cost,
    COALESCE(SUM(s.sale_amount), 0) AS total_sales_revenue,
    COALESCE(SUM(s.sale_amount), 0) - 
    COALESCE(SUM(g.grn_amount), 0) AS gross_profit
FROM product p
LEFT JOIN grn g ON p.product_id = g.product_id
LEFT JOIN sale s ON p.product_id = s.product_id
GROUP BY p.product_name
ORDER BY gross_profit DESC;
