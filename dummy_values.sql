INSERT INTO product (product_name) VALUES
('Laptop'),
('Mouse'),
('Keyboard'),
('Monitor'),
('Printer');


-- Customers
INSERT INTO address (address_name, type_id, locations, pincode, user_id)
VALUES 
('John Enterprises', 1, 'Chennai', 600001, 1),
('ABC Technologies', 1, 'Bangalore', 560001, 1);

-- Vendors
INSERT INTO address (address_name, type_id, locations, pincode, user_id)
VALUES 
('Global Supplies', 2, 'Mumbai', 400001, 1),
('Tech Distributors', 2, 'Hyderabad', 500001, 1);

INSERT INTO grn (address_id, product_id, grn_amount, grn_quantity, user_id)
VALUES
(3, 1, 50000.00, 10, 1),  -- Vendor 1 supplied 10 Laptops
(3, 2, 5000.00, 50, 1),   -- Vendor 1 supplied 50 Mouse
(4, 3, 8000.00, 40, 1);   -- Vendor 2 supplied 40 Keyboards


INSERT INTO invoice (address_id, user_id)
VALUES
(1, 1),  -- Invoice for John Enterprises
(2, 1);  -- Invoice for ABC Technologies


INSERT INTO sale 
(invoice_id, product_id, grn_id, vendor_address_id, sale_amount, sale_quantity, user_id)
VALUES
(1, 1, 1, 3, 60000.00, 2, 1),  -- Sold 2 Laptops
(1, 2, 2, 3, 8000.00, 5, 1),   -- Sold 5 Mouse
(2, 3, 3, 4, 12000.00, 4, 1);  -- Sold 4 Keyboards