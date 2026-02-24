INSERT INTO product (product_name) VALUES
('Laptop'),
('Mouse'),
('Keyboard'),
('Monitor');


-- Customers
INSERT INTO address (address_name, type_id, locations, pincode, user_id)
VALUES 
('John Traders', 1, 'Chennai', 600001, 1),
('Smart Solutions', 1, 'Bangalore', 560001, 1);

-- Vendors
INSERT INTO address (address_name, type_id, locations, pincode, user_id)
VALUES 
('Tech Wholesale', 2, 'Mumbai', 400001, 1),
('IT Distributors', 2, 'Hyderabad', 500001, 1);

INSERT INTO grn (address_id, product_id, grn_amount, grn_quantity, user_id)
VALUES
(3, 1, 200000, 20, 1),
(3, 2, 20000, 100, 1),
(4, 3, 40000, 80, 1),
(4, 4, 60000, 40, 1);

INSERT INTO invoice (address_id, user_id)
VALUES
(1, 1),
(2, 1);

INSERT INTO sale
(invoice_id, product_id, grn_id, vendor_address_id, sale_amount, sale_quantity, user_id)
VALUES
(1, 1, 1, 3, 60000, 5, 1),
(1, 2, 2, 3, 5000, 20, 1),
(2, 3, 3, 4, 15000, 10, 1),
(2, 4, 4, 4, 20000, 8, 1);

