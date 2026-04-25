# ProShop MERN eCommerce Platform

An eCommerce platform built with the MERN stack (MongoDB, Express, React, Node.js) and Redux for state management. Users can browse products, add reviews, and complete purchases via PayPal. Admin users can manage products, users, and orders. Originally created by [Brad Traversy](https://github.com/bradtraversy/proshop_mern); this fork is maintained as a homework project for AI-Driven Development.

![screenshot](https://github.com/bradtraversy/proshop_mern/blob/master/uploads/Screen%20Shot%202020-09-29%20at%205.50.52%20PM.png)

## Features

- Full-featured shopping cart
- Product reviews and ratings
- Top products carousel
- Product pagination and search
- User profiles with order history
- Admin product, user, and order management
- Checkout process (shipping, payment method, place order)
- PayPal / credit card integration
- Database seeder (sample products and users)

## Tech Stack

| Layer     | Technology                                                        |
|-----------|-------------------------------------------------------------------|
| Backend   | Node.js, Express 4.17, Mongoose 5.10, ES Modules (`"type":"module"`) |
| Frontend  | React 16.13, Redux 4, React-Bootstrap 1.3, React Router 5        |
| Database  | MongoDB (local via Docker or Atlas)                               |
| Auth      | JWT (`jsonwebtoken` 9.x) + bcryptjs                              |
| Payments  | PayPal (`react-paypal-button-v2`)                                 |
| Uploads   | Multer (stored in `uploads/`)                                     |
| Dev tools | Nodemon, Concurrently                                            |

## Repository Structure

```
proshop_mern/
├── backend/
│   ├── config/         # Database connection
│   ├── controllers/    # Route handlers
│   ├── data/           # Seed data (users, products)
│   ├── middleware/     # Auth & error-handling middleware
│   ├── models/         # Mongoose models (User, Product, Order)
│   ├── routes/         # Express routers
│   ├── seeder.js       # Database import/destroy script
│   ├── server.js       # Express entry point
│   └── utils/          # JWT helper
├── frontend/
│   └── src/
│       ├── actions/    # Redux action creators
│       ├── components/ # Reusable React components
│       ├── constants/  # Redux action type constants
│       ├── reducers/   # Redux reducers
│       ├── screens/    # Page-level components
│       └── store.js    # Redux store configuration
├── uploads/            # User-uploaded product images
├── docs/               # Homework reports and investigation logs
├── .env.example        # Safe placeholder environment variables
├── package.json        # Backend dependencies & dev scripts
└── README.md           # This file
```

## Prerequisites

- **Node.js** v14.6+ (v17+ works with the OpenSSL workaround already applied in `frontend/package.json`)
- **npm** (comes with Node.js)
- **Docker** (for running MongoDB locally)
- **Git**
- **PayPal sandbox account** (optional — only needed to test the checkout/payment flow)

## Environment Variables

The backend reads these variables via `dotenv` from a `.env` file in the project root:

| Variable         | Purpose                                          | Example value                             |
|------------------|--------------------------------------------------|-------------------------------------------|
| `NODE_ENV`       | `development` or `production` mode               | `development`                             |
| `PORT`           | Backend server port (defaults to 5000 in code)   | `5001`                                    |
| `MONGO_URI`      | MongoDB connection string                        | `mongodb://localhost:27017/proshop`        |
| `JWT_SECRET`     | Secret key for signing JSON Web Tokens           | `change_me`                               |
| `PAYPAL_CLIENT_ID` | PayPal sandbox client ID for payment integration | `your_paypal_sandbox_client_id`           |

**Setup:** Copy the example file and edit it:

```bash
cp .env.example .env
```

> **`.env` is local-only and must never be committed.** It is listed in `.gitignore`.

## MongoDB Setup

Use Docker to run MongoDB locally:

```bash
# First time — create and start the container:
docker run -d -p 27017:27017 --name mongo mongo:7

# Subsequent times — start existing container:
docker start mongo
```

The default connection URI is `mongodb://localhost:27017/proshop` (no authentication for local dev).

## Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## Seed Database

Import sample data (3 users, 6 products):

```bash
npm run data:import
```

To destroy all data and start fresh:

```bash
npm run data:destroy
```

### Sample User Logins

| Email               | Password | Role     |
|---------------------|----------|----------|
| admin@example.com   | 123456   | Admin    |
| john@example.com    | 123456   | Customer |
| jane@example.com    | 123456   | Customer |

## Running the App

```bash
npm run dev
```

This starts both backend and frontend concurrently:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001 (or your configured `PORT`)

To verify it works:

```bash
# Backend should return JSON product data:
curl http://localhost:5001/api/products

# Frontend should return HTML:
curl -I http://localhost:3000
```

## Troubleshooting

### MongoDB connection refused

- Ensure the Docker container is running: `docker ps`
- Start it if stopped: `docker start mongo`
- Verify `MONGO_URI` in `.env` matches `mongodb://localhost:27017/proshop`

### Mongo container name already exists

If `docker run` fails with "name already in use":

```bash
docker start mongo    # start the existing container
```

### Missing `.env` file

Copy the example and configure:

```bash
cp .env.example .env
```

### Port 5000 conflict on macOS

macOS 12+ uses port 5000 for AirPlay Receiver. Set `PORT=5001` in `.env` and ensure `frontend/package.json` has `"proxy": "http://127.0.0.1:5001"`. Alternatively, disable AirPlay Receiver in System Settings → General → AirDrop & Handoff.

### Port conflicts from leftover processes

```bash
pkill -f "nodemon backend"
lsof -ti :5001 :3000 | xargs kill -9
npm run dev
```

### OpenSSL errors with Node 17+

The `frontend/package.json` start script already includes `NODE_OPTIONS=--openssl-legacy-provider`. If the build script also fails, add the same flag there.

### PayPal sandbox placeholder

The app works without a real PayPal client ID — checkout will fail at the payment step. To test payments, create a PayPal sandbox app at https://developer.paypal.com and set `PAYPAL_CLIENT_ID` in `.env`.

### Seed/import errors

Ensure MongoDB is running and `MONGO_URI` is correct before running `npm run data:import`.

## Useful Scripts

| Command                | Description                                        |
|------------------------|----------------------------------------------------|
| `npm run dev`          | Start backend + frontend concurrently              |
| `npm run server`       | Start backend only (with nodemon)                  |
| `npm run client`       | Start frontend only                                |
| `npm start`            | Start backend (production, no nodemon)             |
| `npm run data:import`  | Seed database with sample data                     |
| `npm run data:destroy` | Destroy all database data                          |
| `npm test --prefix frontend` | Run frontend tests (Jest)                    |
| `npm run build --prefix frontend` | Production build of frontend            |

## Homework Notes

This fork is being prepared for an **AI-Driven Development** homework assignment. Commit history, documentation, and investigation logs in `docs/lessons/` reflect the learning process. See `docs/report.md` for the homework submission report.

## License

The MIT License — Copyright (c) 2020 Traversy Media https://traversymedia.com
