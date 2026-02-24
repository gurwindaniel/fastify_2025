CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    passwords VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(role_id)
);


INSERT INTO roles (role_name) VALUES
('Admin'),
('Sales');


INSERT INTO users (user_name, passwords, role_id)
VALUES ('root', '$2b$10$yAphPt3T8mVIZCnrVR5jtOQXeLhNfyE6arJNkRk1ix4gSfyCdWQAS', 1);



create table person_type(
type_id serial primary key,
person_type varchar(100) not null
);

insert into person_type (person_type) values ('Customer'),
                                             ('Vendor');

CREATE TABLE address(
    address_id SERIAL PRIMARY KEY,
    address_name VARCHAR(255) NOT NULL,
    type_id INT REFERENCES person_type(type_id) NOT NULL,
    locations VARCHAR(255),
    pincode DECIMAL(8,0) NOT NULL,
    user_id INT REFERENCES users(user_id) NOT NULL,
    address_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product(
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL
);

CREATE TABLE grn(
    grn_id SERIAL PRIMARY KEY,
    address_id INT REFERENCES address(address_id) NOT NULL,
    product_id INT REFERENCES product(product_id) NOT NULL,
    grn_amount DECIMAL(10,2) NOT NULL,
    grn_quantity INT NOT NULL,
    grn_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(user_id) NOT NULL
);

--ALTER SEQUENCE public.grn_grn_id_seq RESTART WITH 1;

-- create invoice if missing
CREATE TABLE IF NOT EXISTS invoice(
  invoice_id SERIAL PRIMARY KEY,
  address_id INT NOT NULL REFERENCES address(address_id),
  invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT NOT NULL REFERENCES users(user_id)
);

-- create sale if missing
CREATE TABLE IF NOT EXISTS sale(
  sale_id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES invoice(invoice_id),
  product_id INT NOT NULL REFERENCES product(product_id),
  grn_id INT REFERENCES grn(grn_id),
  vendor_address_id INT REFERENCES address(address_id),
  sale_amount DECIMAL(10,2) NOT NULL,
  sale_quantity INT NOT NULL,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT NOT NULL REFERENCES users(user_id)
);

-- Notes:
-- 1) Ensure in application logic that `invoice.address_id` refers to a Customer (person_type = 'Customer').
-- 2) `grn_id` is optional on a sale; include it when the sold goods map directly to a prior GRN (vendor source).
-- 3) `vendor_address_id` stores the vendor address (useful when multiple vendors supply the same product).

-- SALES DASHBOARD QUERY
SELECT 
    COUNT(DISTINCT i.invoice_id) AS total_invoices,
    COUNT(DISTINCT i.address_id) AS total_customers,
    SUM(s.sale_quantity) AS total_items_sold,
    SUM(s.sale_amount) AS total_sales_amount
FROM sale s
JOIN invoice i ON s.invoice_id = i.invoice_id;

-- MONTHLY SALES QUERY

SELECT 
    DATE_TRUNC('month', sale_date) AS month,
    SUM(sale_amount) AS monthly_sales,
    SUM(sale_quantity) AS monthly_quantity
FROM sale
GROUP BY month
ORDER BY month;

--Inventory Dashboard Query
SELECT 
    p.product_id,
    p.product_name,
    COALESCE(SUM(g.grn_quantity), 0) AS total_received,
    COALESCE(SUM(s.sale_quantity), 0) AS total_sold,
    COALESCE(SUM(g.grn_quantity), 0) - COALESCE(SUM(s.sale_quantity), 0) AS current_stock
FROM product p
LEFT JOIN grn g ON p.product_id = g.product_id
LEFT JOIN sale s ON p.product_id = s.product_id
GROUP BY p.product_id, p.product_name
ORDER BY p.product_name;


-- Low Stock Alert:
SELECT *
FROM (
    SELECT 
        p.product_name,
        COALESCE(SUM(g.grn_quantity), 0) - COALESCE(SUM(s.sale_quantity), 0) AS current_stock
    FROM product p
    LEFT JOIN grn g ON p.product_id = g.product_id
    LEFT JOIN sale s ON p.product_id = s.product_id
    GROUP BY p.product_name
) stock_data
WHERE current_stock < 5;

-- Profit Dashboard Query

SELECT 
    p.product_name,
    COALESCE(SUM(g.grn_amount), 0) AS total_purchase_amount,
    COALESCE(SUM(s.sale_amount), 0) AS total_sales_amount,
    COALESCE(SUM(s.sale_amount), 0) - COALESCE(SUM(g.grn_amount), 0) AS gross_profit
FROM product p
LEFT JOIN grn g ON p.product_id = g.product_id
LEFT JOIN sale s ON p.product_id = s.product_id
GROUP BY p.product_name
ORDER BY gross_profit DESC;

--Overall Business Summary

SELECT 
    (SELECT SUM(grn_amount) FROM grn) AS total_purchase,
    (SELECT SUM(sale_amount) FROM sale) AS total_sales,
    (SELECT SUM(sale_amount) FROM sale) -
    (SELECT SUM(grn_amount) FROM grn) AS total_profit;