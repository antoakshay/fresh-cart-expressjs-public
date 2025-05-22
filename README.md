# Fresh Cart - Server

This is the backend server for the **Fresh Cart** project, built using **Node.js** and **Express**.

## Features

- Node.js + Express backend
- JWT-based authentication using secure HTTP-only cookies
- HTTPS support using SSL certificates generated via `mkcert`

------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Getting Started

## Install Dependencies:
npm install

-------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Set Up SSL Certificates

This server uses HTTPS with secure cookies to send JWT tokens. To enable this, you need to generate local SSL certificates using mkcert.
Steps:

   ## Install mkcert (follow the guide on their GitHub page).
   https://github.com/FiloSottile/mkcert

   ## Run the following command in the root directory of the project:
   mkcert localhost
   
## This will generate the following files:

    localhost.pem

    localhost-key.pem

Make sure these files are in the root of your project or update the paths accordingly.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Update server.js

## Update the server.js file to use the generated SSL certificates:

const fs = require('fs');
const https = require('https');
const app = require('./app'); // or your Express setup

## Update the .pem file path (The .pem files you generated in the last step)

const httpsOptions = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## Run the Server

## Ensure nodemon is installed globally:

npm install -g nodemon

## Then run the server:

nodemon server.js

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## For the password reset E-mail functionalities to work, update the REACT_URL inside the authenticationController.js to your fronted IP Address.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## In app.js, add the frontend's port address (where your web app is hosted) to the CORS middleware to allow access.

