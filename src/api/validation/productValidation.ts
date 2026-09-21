import { z } from 'zod';

const productCategories = [
  'Andhra Sweets',
  'Cashew Sweets',
  'Bengali Sweets',
  'Ghee & Milk Bengali Sweets',
  'Milk Bengali Sweets',
  'Khoya Sweets',
  'Laddu Sweets',
  'Milk Sweets',
  'Home Foods',
  'Gift Boxes',
  'Category Unspecified',
  'GHEE AND MILK BENGALI',
  'HOME FOODS SWEET & NAMKINS',
  'MILK Ghee / MILK BENGALI',
] as const;

const weightOptionSchema = z.object({
  weight: z.string().min(1, 'Weight is required'),
  unit: z.string().optional(),
  value: z.number().min(0).optional(),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  pieces: z.number().int().min(0).optional(),
});

const productBodySchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(productCategories),
  collection: z.string().optional(),
  // Optional at the service level; the admin form requires at least one option.
  // Each option, when provided, is still validated.
  weightOptions: z.array(weightOptionSchema).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  ingredients: z.array(z.string()).optional(),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbohydrates: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    sugar: z.number().min(0).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  isBestSeller: z.boolean().optional(),
});

const bulkProductBodySchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  collection: z.string().optional(),
  weightOptions: z.array(weightOptionSchema).optional(),
  images: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbohydrates: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    sugar: z.number().min(0).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  isBestSeller: z.boolean().optional(),
  isActive: z.boolean().optional(),
  productId: z.string().optional(),
});

const bulkProductsPayloadSchema = z.union([
  z.object({
    products: z.array(bulkProductBodySchema).min(1, 'At least one product is required').max(500, 'Maximum 500 products allowed per request'),
  }),
  z.array(bulkProductBodySchema).min(1, 'At least one product is required').max(500, 'Maximum 500 products allowed per request'),
]);

const normalizeBulkBodyInput = (input: unknown): unknown => {
  // Handle raw JSON string body.
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }

  // Handle form-data where products is sent as a stringified JSON array.
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const payload = input as Record<string, unknown>;
    if (typeof payload.products === 'string') {
      try {
        return { ...payload, products: JSON.parse(payload.products) };
      } catch {
        return input;
      }
    }
  }

  return input;
};

// Create Product Schema
export const createProductSchema = z.object({
  body: productBodySchema,
});

// Bulk Add Products by JSON Input Schema
export const addBulkProductsByInputSchema = z.object({
  body: z.preprocess(normalizeBulkBodyInput, bulkProductsPayloadSchema),
});

const bulkBestSellerItemSchema = z.union([
  z.string().min(1, 'Product ID is required').regex(/^[a-zA-Z0-9-_]+$/, 'Invalid product ID format'),
  z.object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid product ID format'),
  }),
]);

const bulkBestSellerPayloadSchema = z.union([
  z.object({
    products: z.array(bulkBestSellerItemSchema).min(1, 'At least one product is required').max(2000, 'Maximum 2000 products allowed per request'),
  }),
  z.array(bulkBestSellerItemSchema).min(1, 'At least one product is required').max(2000, 'Maximum 2000 products allowed per request'),
]);

export const bulkAllBestSellersSchema = z.object({
  body: z.preprocess(normalizeBulkBodyInput, bulkBestSellerPayloadSchema),
});

const modifyCollectionItemSchema = z.union([
  z.string().min(1, 'Product identifier is required'),
  z.object({
    productId: z.string().min(1, 'Product ID is required').optional(),
    _id: z.string().min(1, 'Product _id is required').optional(),
  }).refine((value) => Boolean(value.productId || value._id), {
    message: 'Each product item must include productId or _id',
  }),
]);

const modifyCollectionPayloadSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required'),
  isCollectionNameModified: z.boolean().optional().default(false),
  products: z.array(modifyCollectionItemSchema).max(5000, 'Maximum 5000 products allowed per request').optional().default([]),
}).refine(
  (value) => value.products.length > 0 || value.isCollectionNameModified === true,
  {
    message: 'Provide at least one product or set isCollectionNameModified to true',
    path: ['products'],
  }
);

export const modifyCollectionSchema = z.object({
  body: z.preprocess(normalizeBulkBodyInput, modifyCollectionPayloadSchema),
});

// Update Product Schema
export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().min(10).optional(),
    category: z.enum(productCategories).optional(),
    collection: z.string().optional(),
    weightOptions: z.array(weightOptionSchema).optional(),
    images: z.array(z.string().url()).optional(),
    ingredients: z.array(z.string()).optional(),
    nutritionalInfo: z.object({
      calories: z.number().min(0).optional(),
      protein: z.number().min(0).optional(),
      carbohydrates: z.number().min(0).optional(),
      fat: z.number().min(0).optional(),
      sugar: z.number().min(0).optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
    isBestSeller: z.boolean().optional(),
  }),
  params: z.object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid product ID format'),
  }),
});

// Get Product by ID Schema
export const getProductByIdSchema = z.object({
  params: z.object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid product ID format'),
  }),
});

// Get Products by Category Schema
export const getProductsByCategorySchema = z.object({
  params: z.object({
    category: z.enum(productCategories),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Search Products Schema
export const searchProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.enum(productCategories).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    isBestSeller: z.enum(['true', 'false']).optional(),
    isNewArrival: z.enum(['true', 'false']).optional(),
    sort: z.enum(['createdAt', 'price', 'name', 'ratings.average']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type SearchProductsInput = z.infer<typeof searchProductsSchema>;

// Bulk Upload Validation Schema
export const bulkUploadSchema = z.object({
  file: z.object({
    mimetype: z.string().refine(
      (mimetype) =>
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimetype === 'application/vnd.ms-excel',
      {
        message: 'File must be an Excel file (.xlsx or .xls)',
      }
    ),
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  }),
});

export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;
