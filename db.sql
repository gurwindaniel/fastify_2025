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

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  quantity INT
);


insert into items (id,name, quantity) values (1,'Laptop',3);
insert into items (id,name, quantity) values (2,'Printer',5);

INSERT INTO roles (role_name) VALUES
('Admin'),
('Sales');
