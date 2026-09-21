import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { 
  createProduct, 
  updateProduct,
  deleteProduct,
  bulkAddProducts,
  addBulkProductsByInput,
  bulkAllBestSellers,
  modifyCollection,
  randomizeAllProductRatings,
  getAllProducts,
  getProductsByCategory
} from '../controllers/productController';
import { 
  adminLogin,
  getAllAdmins,
  getAdminById,
  addNewAdmin,
  deleteAdmin,
  toggleAdminStatus
} from '../controllers/adminController';
import {
  getAllSettings,
  getSettingByKey,
  createSetting,
  updateSetting,
  updateMultipleSettings,
  deleteSetting,
  getDeliveryCharges,
  updateDeliveryCharge,
  initializeDefaultSettings
} from '../controllers/settingsController';
import {
  getAllCoupons,
  getCouponByCode,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStats
} from '../controllers/couponController';
import { getHeroBanner, updateHeroBanner } from '../controllers/bannerController';
import { cancelImageUpload, uploadImageToCloudinary } from '../controllers/cloudinaryController';
import { validate } from '../middleware/validate';
import { authenticateAdmin, authorizeAdmin } from '../middleware/auth';
import { 
  createProductSchema, 
  updateProductSchema,
  getProductByIdSchema,
  getProductsByCategorySchema,
  addBulkProductsByInputSchema,
  bulkAllBestSellersSchema,
  modifyCollectionSchema
} from '../validation/productValidation';
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminSchema,
  getAdminByIdSchema,
  getAdminsQuerySchema
} from '../validation/adminValidation';
import {
  createSettingSchema,
  updateSettingSchema,
  updateMultipleSettingsSchema,
  getSettingByKeySchema,
  getSettingsQuerySchema
} from '../validation/settingsValidation';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  getCouponByCodeSchema,
  getCouponsQuerySchema
} from '../validation/couponValidation';

// Configure multer for file upload (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const handleImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  imageUpload.single('image')(req, res, (error: any) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'image upload failure: file size is greater than 10 mb' });
      return;
    }

    if (error) {
      res.status(400).json({ message: error.message || 'Image upload failed' });
      return;
    }

    next();
  });
};

const router = Router();

// ======================
// ADMIN AUTHENTICATION
// ======================

// Admin Login (Public route - no authentication required)
router.post('/login', validate(adminLoginSchema), adminLogin);

// ======================
// ADMIN MANAGEMENT ROUTES (Settings -> Admin Users)
// ======================

// Get all admins (requires admin management permission)
router.get(
  '/admins',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(getAdminsQuerySchema),
  getAllAdmins
);

// Get single admin by ID
router.get(
  '/admins/:adminId',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(getAdminByIdSchema),
  getAdminById
);

// Create new admin (requires admin management permission)
router.post(
  '/admins',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(createAdminSchema),
  addNewAdmin
);

// Modify existing admin (requires admin management permission)
router.put(
  '/admins/:adminId',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(updateAdminSchema),
  addNewAdmin
);

// Delete admin
router.delete(
  '/admins/:adminId',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(getAdminByIdSchema),
  deleteAdmin
);

// Toggle admin active status
router.patch(
  '/admins/:adminId/toggle-status',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(getAdminByIdSchema),
  toggleAdminStatus
);

// ======================
// SETTINGS MANAGEMENT (Settings -> Delivery Charges, etc.)
// ======================

// Get all settings
router.get(
  '/settings',
  authenticateAdmin,
  authorizeAdmin('read'),
  validate(getSettingsQuerySchema),
  getAllSettings
);

// Get delivery charges specifically (admin, auth required)
router.get(
  '/settings/delivery-charges',
  authenticateAdmin,
  authorizeAdmin('read'),
  getDeliveryCharges
);

// Public: Get delivery settings for storefront (no auth)
router.get('/public/delivery-settings', getDeliveryCharges);

// Public: Get hero banner for storefront (no auth)
router.get('/public/banner/hero', getHeroBanner);

// Get hero banner (admin)
router.get(
  '/banner/hero',
  authenticateAdmin,
  authorizeAdmin('read'),
  getHeroBanner
);

// Update hero banner (admin)
router.put(
  '/banner/hero',
  authenticateAdmin,
  authorizeAdmin('write'),
  updateHeroBanner
);

// Update or create delivery charge
router.put(
  '/settings/delivery-charges',
  authenticateAdmin,
  authorizeAdmin('write'),
  updateDeliveryCharge
);

// Initialize default settings (one-time setup)
router.post(
  '/settings/initialize',
  authenticateAdmin,
  authorizeAdmin('write'),
  initializeDefaultSettings
);

// Get single setting by key
router.get(
  '/settings/:key',
  authenticateAdmin,
  authorizeAdmin('read'),
  validate(getSettingByKeySchema),
  getSettingByKey
);

// Create new setting
router.post(
  '/settings',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(createSettingSchema),
  createSetting
);

// Update setting by key (property-value approach)
router.put(
  '/settings/:key',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(updateSettingSchema),
  updateSetting
);

// Update multiple settings at once (bulk update)
router.patch(
  '/settings/bulk-update',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(updateMultipleSettingsSchema),
  updateMultipleSettings
);

// Delete setting
router.delete(
  '/settings/:key',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(getSettingByKeySchema),
  deleteSetting
);

// ======================
// COUPONS MANAGEMENT (Settings -> Coupons)
// ======================

// Get coupon statistics
router.get(
  '/coupons/stats',
  authenticateAdmin,
  authorizeAdmin('read'),
  getCouponStats
);

// Get all coupons
router.get(
  '/coupons',
  authenticateAdmin,
  authorizeAdmin('read'),
  validate(getCouponsQuerySchema),
  getAllCoupons
);

// Validate coupon (can be used by order system)
router.post(
  '/coupons/validate',
  validate(validateCouponSchema),
  validateCoupon
);

// Get single coupon by code
router.get(
  '/coupons/:code',
  authenticateAdmin,
  authorizeAdmin('read'),
  validate(getCouponByCodeSchema),
  getCouponByCode
);

// Create new coupon
router.post(
  '/coupons',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(createCouponSchema),
  createCoupon
);

// Update coupon
router.put(
  '/coupons/:code',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(updateCouponSchema),
  updateCoupon
);

// Toggle coupon active status
router.patch(
  '/coupons/:code/toggle-status',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(getCouponByCodeSchema),
  toggleCouponStatus
);

// Delete coupon
router.delete(
  '/coupons/:code',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(getCouponByCodeSchema),
  deleteCoupon
);

// ======================
// PRODUCT MANAGEMENT ROUTES (Admin Only)
// ======================

// All Products - View all products (requires read access)
router.get(
  '/products',
  // authenticateAdmin,
  // authorizeAdmin('read'),
  getAllProducts
);

// Get products by category (requires read access)
router.get(
  '/products/category/:category',
  authenticateAdmin,
  authorizeAdmin('read'),
  validate(getProductsByCategorySchema),
  getProductsByCategory
);

// Add Product - Create a new product (requires write access)
router.post(
  '/products',
  // authenticateAdmin,
  // authorizeAdmin('write'),
  validate(createProductSchema), // enforces images to be valid URLs (no file/base64)
  createProduct
);

// Upload image to Cloudinary (requires write access)
router.post(
  '/image/upload',
  authenticateAdmin,
  authorizeAdmin('write'),
  handleImageUpload,
  uploadImageToCloudinary
);

// Cancel image upload and remove image from Cloudinary (requires write access)
router.post(
  '/image/cancel',
  authenticateAdmin,
  authorizeAdmin('write'),
  cancelImageUpload
);

// Update Product - Modify existing product (requires write access)
router.put(
  '/products/:productId',
  // authenticateAdmin,
  // authorizeAdmin('write'),
  validate(updateProductSchema),
  updateProduct
);

// Delete Product - Soft delete a product (requires write access)
router.delete(
  '/products/:productId',
  // authenticateAdmin,
  // authorizeAdmin('write'),
  validate(getProductByIdSchema),
  deleteProduct
);

// Bulk Upload - Import products from Excel (requires write access)
router.post(
  '/products/bulk-input',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(addBulkProductsByInputSchema),
  addBulkProductsByInput
);

// Bulk Upload - Import products from Excel (requires write access)
router.post(
  '/products/bulk-upload',
  authenticateAdmin,
  authorizeAdmin('write'),
  upload.single('file'),
  bulkAddProducts
);

// Bulk mark products as best sellers (requires write access)
router.post(
  '/products/bulk-best-sellers',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(bulkAllBestSellersSchema),
  bulkAllBestSellers
);

// Bulk modify product collections (requires write access)
router.patch(
  '/products/modify-collection',
  authenticateAdmin,
  authorizeAdmin('write'),
  validate(modifyCollectionSchema),
  modifyCollection
);

// Randomize ratings for all active products
router.post(
  '/products/randomize-ratings',
  authenticateAdmin,
  authorizeAdmin('write'),
  randomizeAllProductRatings
);

export default router;
