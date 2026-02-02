# FastInv

FastInv is a Node.js and PostgreSQL-based inventory management application. It provides a web interface for managing products, users, invoices, addresses, and more, with secure database connectivity and modular code structure.

## Features
- User authentication and authorization
- Product, invoice, and address management
- Dashboard and reporting
- Secure PostgreSQL connection using environment variables (.env)
- Modular route and view structure (EJS templates)

## Project Structure
```
fastinv/
  db.sql                # Database schema
  package.json          # Node.js dependencies and scripts
  server.js             # Main server file
  .env                  # Store all secret keys in here
  db/
    pool.js             # PostgreSQL connection pool (uses .env)
    ca.pem              # copy the public key from avien console
   public/               # Static JS files
      script.js
      userAjax.js
   routes/               # Express route handlers
   views/                # EJS templates
      address.ejs
      addressList.ejs
      dashboard.ejs
      grn.ejs
      grnList.ejs
      index.ejs
      invoice.ejs
      invoiceList.ejs
      layout.ejs
      login.ejs
      product.ejs
      users.ejs
      partials/
         footer.ejs
         header.ejs
         navbar.ejs
```

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies:**
   ```
   npm install
   ```
3. **Create a `.env` file in the `fastinv/` directory:**
   ```
   SECRET=YOUR SECRET SESSION KEY
   DB_USER=your_db_user
   DB_HOST=your_db_host
   DB_DATABASE=your_db_name
   DB_PASSWORD=your_db_password
   DB_PORT=your_db_port
   # Optional: DB_SSL_CA=ca.pem
   ```
4. **If your database provider (e.g., Avien Cloud) requires an SSL certificate:**
   - Log in to your Avien Cloud dashboard and download the SSL certificate (CA certificate).
   - Create a file named `ca.pem` in the `fastinv/db` directory (or another secure location).
   - Copy the contents of the Avien Cloud SSL certificate into `ca.pem`.
   - Update your `.env` file to set `DB_SSL_CA=ca.pem` (or the correct path).
   - **Do not commit `ca.pem` to version control.**
   - Example command to copy the certificate:
     ```
     # On Linux/macOS
     cp /path/to/downloaded/ca-cert.pem ./fastinv/db/ca.pem
     # On Windows, use Explorer or Notepad to create and paste the contents.
     ```
5. **Initialize the Database:**
    - To set up the database schema and initial data, execute the `db.sql` file on your Avien Cloud PostgreSQL database.
    - Example command using `psql`:
       ```
       psql -h <your_avien_host> -p <your_avien_port> -U root -W -d fastinv -f db.sql
       ```
       - When prompted for a password, enter: `123456`
       - Replace `<your_avien_host>` and `<your_avien_port>` with your Avien Cloud details.
       - Make sure you have `psql` installed (part of PostgreSQL tools).
       - This will create all tables and insert initial data (including the root user).
6. **Run the application:**
   ```
   node server.js
   ```

6. **Access the app:**
   - Open your browser at `http://localhost:PORT` (replace PORT with your configured port).
   - **Default login credentials:**
     - Username: `root`
     - Password: `123456`
   - These credentials are created by the `db.sql` script and can be used to log in after the initial setup.

## Security
- Do not commit your `.env` file, `ca.pem`, or any sensitive credentials to version control.
- Add `.env` and `ca.pem` to your `.gitignore` file.

## License
This project is for educational purposes.
