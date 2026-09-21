import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../db/models/Product';
import * as XLSX from 'xlsx';

const CATEGORY_MAP: Record<string, string> = {
  'andhra': 'Andhra Sweets',
  'andhra sweets': 'Andhra Sweets',
  'cashew': 'Cashew Sweets',
  'kaju': 'Cashew Sweets',
  'cashew sweets': 'Cashew Sweets',
  'bengali': 'Bengali Sweets',
  'bengali sweets': 'Bengali Sweets',
  'ghee and milk bengali': 'Ghee & Milk Bengali Sweets',
  'ghee and milk bengali sweets': 'Ghee & Milk Bengali Sweets',
  'ghee & milk bengali': 'Ghee & Milk Bengali Sweets',
  'ghee & milk bengali sweets': 'Ghee & Milk Bengali Sweets',
  'milk ghee / milk bengali': 'Milk Bengali Sweets',
  'milk bengali': 'Milk Bengali Sweets',
  'milk bengali sweets': 'Milk Bengali Sweets',
  'khoya': 'Khoya Sweets',
  'khoya sweets': 'Khoya Sweets',
  'laddu': 'Laddu Sweets',
  'laddu sweets': 'Laddu Sweets',
  'milk': 'Milk Sweets',
  'milk sweets': 'Milk Sweets',
  'home': 'Home Foods',
  'home foods': 'Home Foods',
  'home foods sweet & namkins': 'Home Foods',
  'home foods sweets & namkeens': 'Home Foods',
  'gift boxes': 'Gift Boxes',
  'gift-boxes': 'Gift Boxes',
  'giftboxes': 'Gift Boxes',
  'other': 'Category Unspecified',
  'category unspecified': 'Category Unspecified',
  'sweets': 'Category Unspecified',
  'namkeen': 'Category Unspecified',
  'dry-fruits': 'Category Unspecified',
  'seasonal': 'Category Unspecified',
};

const toCanonicalCategory = (rawValue: unknown): string => {
  if (typeof rawValue !== 'string') return 'Category Unspecified';
  const normalized = rawValue.trim().toLowerCase();
  return CATEGORY_MAP[normalized] || 'Category Unspecified';
};

export const normalizeWeightOption = (option: any) => {
  if (!option || typeof option !== 'object') return option;
  let rawWeight = String(option.weight || '').trim();
  let unit = option.unit ? String(option.unit).trim().toLowerCase() : undefined;
  let value = option.value !== undefined && option.value !== null && option.value !== '' ? Number(option.value) : undefined;
  let pieces = option.pieces !== undefined && option.pieces !== null && option.pieces !== '' ? Number(option.pieces) : undefined;

  if (unit === 'pieces' || unit === 'pcs') {
    if (value && !pieces) pieces = value;
    if (pieces && !value) value = pieces;
    if (pieces) rawWeight = `${pieces} pieces`;
    unit = 'pieces';
  } else if (unit === 'g' || unit === 'gm' || unit === 'grams') {
    if (value) rawWeight = `${value}g`;
    unit = 'g';
  } else if (unit === 'kg' || unit === 'kilograms') {
    if (value) rawWeight = `${value} kg`;
    unit = 'kg';
  } else if (unit === 'box' || unit === 'pack') {
    if (value) rawWeight = `${value} ${unit}`;
  } else if (/^\d+(\.\d+)?$/.test(rawWeight)) {
    const num = Number(rawWeight);
    if (pieces) {
      unit = 'pieces';
      rawWeight = `${pieces} pieces`;
    } else {
      unit = 'g';
      value = num;
      rawWeight = `${num}g`;
    }
  } else if (/^(\d+(\.\d+)?)\s*(g|gm|grams)$/i.test(rawWeight)) {
    const match = rawWeight.match(/^(\d+(\.\d+)?)\s*(g|gm|grams)$/i);
    if (match) {
      value = Number(match[1]);
      unit = 'g';
      rawWeight = `${value}g`;
    }
  } else if (/^(\d+(\.\d+)?)\s*(kg|kgs|kilo|kilograms)$/i.test(rawWeight)) {
    const match = rawWeight.match(/^(\d+(\.\d+)?)\s*(kg|kgs|kilo|kilograms)$/i);
    if (match) {
      value = Number(match[1]);
      unit = 'kg';
      rawWeight = `${value} kg`;
    }
  } else if (/^(\d+)\s*(pcs|pc|pieces|piece)$/i.test(rawWeight)) {
    const match = rawWeight.match(/^(\d+)\s*(pcs|pc|pieces|piece)$/i);
    if (match) {
      pieces = Number(match[1]);
      value = pieces;
      unit = 'pieces';
      rawWeight = `${pieces} pieces`;
    }
  }

  return {
    ...option,
    weight: rawWeight || 'Default',
    ...(unit ? { unit } : {}),
    ...(value !== undefined && !isNaN(value) ? { value } : {}),
    ...(pieces !== undefined && !isNaN(pieces) ? { pieces } : {}),
    price: Number(option.price || 0),
    stock: Number(option.stock || 0),
    ...(option.originalPrice !== undefined ? { originalPrice: Number(option.originalPrice) } : {}),
  };
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.weightOptions)) {
      body.weightOptions = body.weightOptions.map(normalizeWeightOption);
    }
    const product = await Product.create(body);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    let product = await Product.findOne({ productId });
    if (!product && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ category: req.params.category, isActive: true });
    console.log(`Found ${products.length} products in category ${req.params.category}`);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getBestSellingProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await Product.find({ isBestSeller: true, isActive: true })
      .sort({ 'ratings.count': -1, 'ratings.average': -1 })
      .limit(limit);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getSpecialCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({
      isActive: true,
      collection: { $nin: ['', 'best-seller'] },
    }).lean();

    const formattedProducts = products.map((product: any) => ({
      ...product,
      collection: product?.collection || '',
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getSpecialCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await Product.aggregate([
      {
        $match: {
          isActive: true,
          collection: { $ne: '' },
        },
      },
      { $sort: { updatedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$collection',
          products: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          collection_name: '$_id',
          products: 1,
        },
      },
      { $sort: { collection_name: 1 } },
    ]);

    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const updateData = { ...req.body };
    if (Array.isArray(updateData.weightOptions)) {
      updateData.weightOptions = updateData.weightOptions.map(normalizeWeightOption);
    }
    // Match by productId slug, or by Mongo _id (products created via the admin
    // have no productId, so the client sends the _id instead).
    let product = await Product.findOneAndUpdate(
      { productId },
      updateData,
      { new: true }
    );
    if (!product && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findByIdAndUpdate(productId, updateData, { new: true });
    }
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const modifyCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = Array.isArray(req.body) ? { products: req.body } : req.body;
    const products = Array.isArray(payload?.products) ? payload.products : [];
    const collectionName = typeof payload?.collectionName === 'string' ? payload.collectionName.trim() : '';
    const isCollectionNameModified = payload?.isCollectionNameModified === true;

    const productIds = products
      .map((item: any) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        if (item && typeof item.productId === 'string') {
          return item.productId.trim();
        }

        return '';
      })
      .filter((productId: string) => productId.length > 0);

    const objectIds = products
      .map((item: any) => {
        if (item && typeof item._id === 'string' && mongoose.Types.ObjectId.isValid(item._id)) {
          return new mongoose.Types.ObjectId(item._id);
        }

        return null;
      })
      .filter((value: mongoose.Types.ObjectId | null): value is mongoose.Types.ObjectId => value !== null);

    const uniqueProductIds = Array.from(new Set(productIds));
    const uniqueObjectIds = Array.from(
      new Map<string, mongoose.Types.ObjectId>(
        objectIds.map((value: mongoose.Types.ObjectId) => [value.toHexString(), value])
      ).values()
    );

    const targetFilters: Array<Record<string, unknown>> = [];

    if (uniqueProductIds.length > 0) {
      targetFilters.push({ productId: { $in: uniqueProductIds } });
    }

    if (uniqueObjectIds.length > 0) {
      targetFilters.push({ _id: { $in: uniqueObjectIds } });
    }

    const matchedProducts = targetFilters.length > 0
      ? await Product.find(
          targetFilters.length === 1 ? targetFilters[0] : { $or: targetFilters },
          { _id: 1, productId: 1, collection: 1, isBestSeller: 1 }
        ).lean()
      : [];

    const matchedProductIds = new Set(
      matchedProducts
        .map((product: any) => (typeof product.productId === 'string' ? product.productId : ''))
        .filter((productId: string) => productId.length > 0)
    );

    const matchedObjectIds = new Set(
      matchedProducts.map((product: any) => String(product._id))
    );

    const notFoundProductIds = uniqueProductIds.filter((productId) => !matchedProductIds.has(productId));
    const notFoundObjectIds = uniqueObjectIds
      .map((objectId) => objectId.toHexString())
      .filter((objectId) => !matchedObjectIds.has(objectId));

    let explicitlyUpdatedCount = 0;

    if (matchedProducts.length > 0) {
      const explicitUpdateResult = await Product.updateMany(
        {
          _id: { $in: matchedProducts.map((product: any) => product._id) },
        },
        [
          {
            $set: {
              collection: {
                $cond: [
                  {
                    $eq: [
                      {
                        $trim: {
                          input: {
                            $ifNull: ['$collection', ''],
                          },
                        },
                      },
                      collectionName,
                    ],
                  },
                  '',
                  collectionName,
                ],
              },
            },
          },
        ]
      );
      explicitlyUpdatedCount = explicitUpdateResult.modifiedCount;
    }

    let reassignedCollectionCount = 0;

    if (isCollectionNameModified) {
      const reassignResult = await Product.updateMany(
        {
          isActive: true,
          collection: { $nin: ['', collectionName] },
        },
        {
          $set: { collection: collectionName },
        }
      );

      reassignedCollectionCount = reassignResult.modifiedCount;
    }

    res.status(200).json({
      message: 'Collection updated successfully',
      collectionName,
      explicitlyUpdatedCount,
      reassignedCollectionCount,
      isCollectionNameModified,
      matchedProducts: matchedProducts.map((product: any) => ({
        _id: product._id,
        productId: product.productId,
        previousCollection: product.collection || '',
        isBestSeller: product.isBestSeller,
      })),
      notFoundProductIds,
      notFoundObjectIds,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    // Soft delete. Match by productId slug, or by Mongo _id (products created
    // via the admin have no productId, so the client sends the _id instead).
    let product = await Product.findOneAndUpdate(
      { productId },
      { isActive: false },
      { new: true }
    );
    if (!product && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findByIdAndUpdate(productId, { isActive: false }, { new: true });
    }
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Search products with query parameters
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      isBestSeller, 
      isNewArrival,
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    // Build the base filter object (everything except price, which now lives
    // inside the weightOptions array and is matched via a computed minPrice).
    const filter: any = { isActive: true };

    // Text search in name and description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by best seller
    if (isBestSeller === 'true') {
      filter.isBestSeller = true;
    }

    // Filter by new arrival
    if (isNewArrival === 'true') {
      filter.isNewArrival = true;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sorting: 'price' now sorts by the cheapest weight option (minPrice).
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sort === 'price' ? 'minPrice' : (sort as string);
    const sortObj: any = { [sortField]: sortOrder };

    // Price-range filter: match products whose cheapest option is in range.
    const priceMatch: any = {};
    if (minPrice) priceMatch.$gte = Number(minPrice);
    if (maxPrice) priceMatch.$lte = Number(maxPrice);

    // Build the aggregation pipeline
    const pipeline: any[] = [
      { $match: filter },
      // Cheapest option price, falling back to the legacy scalar price for
      // pre-existing products that have no weightOptions.
      { $addFields: { minPrice: { $ifNull: [{ $min: '$weightOptions.price' }, '$price'] } } },
    ];

    if (minPrice || maxPrice) {
      pipeline.push({ $match: { minPrice: priceMatch } });
    }

    const result = await Product.aggregate([
      ...pipeline,
      {
        $facet: {
          products: [
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limitNum },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const products = result[0]?.products ?? [];
    const total = result[0]?.totalCount[0]?.count ?? 0;

    res.status(200).json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bulk add products from Excel file
export const bulkAddProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Read the Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON, skipping the first row (headers)
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      res.status(400).json({ message: 'Excel file is empty or has no data rows' });
      return;
    }

    // Create products from Excel data
    const results = {
      success: [] as any[],
      failed: [] as any[]
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row: any = data[i];
        
        // Map Excel columns to product fields.
        // Each Excel row is one product with a single weight option built from
        // the weight/price/originalPrice/stock columns. Multi-option products
        // are created via the admin UI or the JSON bulk import.
        const rawWeight = String(row.weight || row.Weight || (row.pieces || row.Pieces ? `${row.pieces || row.Pieces} pieces` : 'Default'));
        const rawPieces = row.pieces !== undefined ? Number(row.pieces) : (row.Pieces !== undefined ? Number(row.Pieces) : undefined);
        const weightOption = normalizeWeightOption({
          weight: rawWeight,
          pieces: rawPieces,
          price: Number(row.price || row.Price),
          stock: row.stock !== undefined ? Number(row.stock) : (row.Stock !== undefined ? Number(row.Stock) : 0),
          ...(row.originalPrice || row.OriginalPrice ? { originalPrice: Number(row.originalPrice || row.OriginalPrice) } : {}),
        });

        const productData: any = {
          name: row.name || row.Name,
          description: row.description || row.Description,
          category: toCanonicalCategory(row.category || row.Category),
          weightOptions: [weightOption],
          isActive: row.isActive !== undefined ? row.isActive : (row.IsActive !== undefined ? row.IsActive : true),
          isBestSeller: row.isBestSeller || row.IsBestSeller || row.isFeatured || row.IsFeatured || false
        };

        // Handle array fields (comma-separated in Excel)
        if (row.images || row.Images) {
          const imageString = row.images || row.Images;
          productData.images = typeof imageString === 'string' 
            ? imageString.split(',').map((img: string) => img.trim()).filter((img: string) => img)
            : [];
        }

        if (row.tags || row.Tags) {
          const tagString = row.tags || row.Tags;
          productData.tags = typeof tagString === 'string' 
            ? tagString.split(',').map((tag: string) => tag.trim().toLowerCase()).filter((tag: string) => tag)
            : [];
        }

        if (row.ingredients || row.Ingredients) {
          const ingredientString = row.ingredients || row.Ingredients;
          productData.ingredients = typeof ingredientString === 'string' 
            ? ingredientString.split(',').map((ing: string) => ing.trim()).filter((ing: string) => ing)
            : [];
        }

        // Remove undefined/null fields
        Object.keys(productData).forEach(key => {
          if (productData[key] === undefined || productData[key] === null) {
            delete productData[key];
          }
        });

        const product = await Product.create(productData);
        results.success.push({ row: i + 2, product: product._id, name: product.name });
      } catch (error: any) {
        results.failed.push({ 
          row: i + 2, 
          error: error.message || 'Failed to create product',
          data: data[i]
        });
      }
    }

    res.status(200).json({
      message: 'Bulk import completed',
      summary: {
        total: data.length,
        successful: results.success.length,
        failed: results.failed.length
      },
      results
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Server error during bulk import', 
      error: error.message || error 
    });
  }
};

// Bulk add products from JSON input array
export const addBulkProductsByInput = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = Array.isArray(req.body) ? req.body : req.body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ message: 'Products array is required and cannot be empty' });
      return;
    }

    const normalizedProducts = products.map((product: any) => {
      return {
        ...product,
        category: toCanonicalCategory(product?.category),
        weightOptions: Array.isArray(product?.weightOptions)
          ? product.weightOptions.map(normalizeWeightOption)
          : product?.weightOptions,
      };
    });

    const success: any[] = [];
    const failed: any[] = [];
    const usedProductIds = new Set<string>();
    const adjustedProductIds: Array<{ index: number; from: string; to: string }> = [];

    const buildUniqueProductId = async (baseProductId: string): Promise<string> => {
      let candidate = baseProductId;
      let suffix = 0;

      while (usedProductIds.has(candidate) || await Product.exists({ productId: candidate })) {
        suffix += 1;
        candidate = `${baseProductId}-${suffix}`;
      }

      return candidate;
    };

    for (let index = 0; index < normalizedProducts.length; index++) {
      try {
        const productData = { ...normalizedProducts[index] } as any;

        if (typeof productData.productId === 'string' && productData.productId.trim()) {
          const originalProductId = productData.productId.trim();
          const uniqueProductId = await buildUniqueProductId(originalProductId);

          if (uniqueProductId !== originalProductId) {
            adjustedProductIds.push({ index, from: originalProductId, to: uniqueProductId });
          }

          productData.productId = uniqueProductId;
          usedProductIds.add(uniqueProductId);
        }

        const product = await Product.create(productData);
        success.push({
          index,
          id: product._id,
          name: product.name,
          productId: product.productId,
        });
      } catch (error: any) {
        failed.push({
          index,
          error: error.message || 'Failed to create product',
          product: normalizedProducts[index],
        });
      }
    }

    const statusCode = failed.length > 0 ? 207 : 201;

    res.status(statusCode).json({
      message: 'Bulk product insertion completed',
      summary: {
        total: products.length,
        successful: success.length,
        adjustedProductIds: adjustedProductIds.length,
        failed: failed.length,
      },
      success,
      adjustedProductIds,
      failed,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bulk mark existing products as best sellers
export const bulkAllBestSellers = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body?.products;

    if (!Array.isArray(payload) || payload.length === 0) {
      res.status(400).json({ message: 'Products array is required and cannot be empty' });
      return;
    }

    const rawProductIds = payload
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item.productId === 'string') return item.productId.trim();
        return '';
      })
      .filter((productId: string) => productId.length > 0);

    const uniqueProductIds = Array.from(new Set(rawProductIds));

    if (uniqueProductIds.length === 0) {
      res.status(400).json({ message: 'No valid productId values found in request' });
      return;
    }

    const existingProducts = await Product.find(
      { productId: { $in: uniqueProductIds } },
      { productId: 1, isBestSeller: 1 }
    ).lean();

    const existingProductIds = new Set(existingProducts.map((p: any) => p.productId));
    const alreadyBestSeller = existingProducts
      .filter((p: any) => p.isBestSeller)
      .map((p: any) => p.productId);

    const notFound = uniqueProductIds.filter((productId) => !existingProductIds.has(productId));

    const updateResult = await Product.updateMany(
      { productId: { $in: uniqueProductIds }, isBestSeller: { $ne: true } },
      { $set: { isBestSeller: true } }
    );

    res.status(200).json({
      message: 'Bulk best-seller update completed',
      summary: {
        totalReceived: payload.length,
        uniqueProductIds: uniqueProductIds.length,
        matched: existingProducts.length,
        updated: updateResult.modifiedCount,
        alreadyBestSeller: alreadyBestSeller.length,
        notFound: notFound.length,
      },
      alreadyBestSeller,
      notFound,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Randomize ratings for all active products
export const randomizeAllProductRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true }, { _id: 1, productId: 1, ratings: 1 });

    if (!products.length) {
      res.status(200).json({ message: 'No active products found', updated: 0 });
      return;
    }

    const ratingAverages = [4, 4.5, 5];
    const ratingCounts = [9, 10, 11, 12];
    const updatedProducts: Array<{ productId?: string; average: number; count: number }> = [];

    for (const product of products) {
      const average = ratingAverages[Math.floor(Math.random() * ratingAverages.length)];
      const count = ratingCounts[Math.floor(Math.random() * ratingCounts.length)];

      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            ratings: {
              average,
              count,
            },
          },
        }
      );

      updatedProducts.push({
        productId: product.productId,
        average,
        count,
      });
    }

    res.status(200).json({
      message: 'Ratings randomized successfully for active products',
      updated: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
