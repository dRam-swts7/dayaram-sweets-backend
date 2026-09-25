# Dayaram Sweets Backend

E-commerce backend API for Dayaram Sweets built with Node.js, Express, TypeScript, and MongoDB.


## Features

- RESTful API architecture
- TypeScript for type safety
- MongoDB with Mongoose ODM
- JWT authentication
- Password hashing with bcrypt
- CORS enabled
- Environment variable configuration

## Project Structure

```
src/
├── api/
│   ├── controllers/     # Request handlers
│   │   ├── userController.ts
│   │   ├── productController.ts
│   │   ├── orderController.ts
│   │   └── paymentController.ts
│   └── routes/          # API routes
│       ├── userRoutes.ts
│       ├── productRoutes.ts
│       ├── orderRoutes.ts
│       └── paymentRoutes.ts
├── db/
│   ├── config.ts        # Database connection
│   └── models/          # Mongoose schemas
│       ├── User.ts
│       ├── Product.ts
│       ├── Order.ts
│       └── Payment.ts
└── index.ts             # Application entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dayaram-sweets
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Build the project:
```bash
npm run build
```

5. Run in development mode:
```bash
npm run dev
```

6. Run in production mode:
```bash
npm start
```

## API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile/:id` - Update user profile
- `GET /api/users` - Get all users
- `DELETE /api/users/:id` - Delete user

### Products
- `POST /api/products` - Create product
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get products by category
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/user/:userId` - Get user orders
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `GET /api/payments/order/:orderId` - Get payments by order
- `PUT /api/payments/:id/status` - Update payment status

## Database Models

### User
- User information and authentication
- Address details
- Role-based access (customer/admin)

### Product
- Product details and pricing
- Stock management
- Categories and tags
- Ratings and reviews support

### Order
- Order items and totals
- Shipping and billing addresses
- Order status tracking
- Payment method

### Payment
- Transaction details
- Payment gateway integration support
- Status tracking
- Refund support

## Technologies

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
