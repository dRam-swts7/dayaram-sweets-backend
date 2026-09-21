import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { connectDB } from './db/config';
import userRoutes from './api/routes/userRoutes';
import productRoutes from './api/routes/productRoutes';
import orderRoutes from './api/routes/orderRoutes';
import paymentRoutes from './api/routes/paymentRoutes';
import resetPasswordRoutes from './api/routes/resetPasswordRoutes';
import adminRoutes from './api/routes/adminRoutes';
import refundRoutes from './api/routes/refundRoutes';
import adminRefundRoutes from './api/routes/adminRefundRoutes';
import cloudinaryRoutes from './api/routes/cloudinaryRoutes';
import bannerRoutes from './api/routes/bannerRoutes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reset-password', resetPasswordRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/admin/refunds', adminRefundRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/cloudinary-signature', cloudinaryRoutes);
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
