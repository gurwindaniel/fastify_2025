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

ALTER SEQUENCE public.grn_grn_id_seq RESTART WITH 1;
