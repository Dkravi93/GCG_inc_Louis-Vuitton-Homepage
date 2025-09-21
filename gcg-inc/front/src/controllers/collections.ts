import { Request, Response } from 'express';
import { Collection } from '../models/collection';
import { Product } from '../models/product';
import type { AuthenticatedRequest } from '../types/express';
import type {
  CollectionParams,
  CollectionQuery,
  CollectionResponse,
  CreateCollectionBody,
  UpdateCollectionBody,
  AddProductBody
} from '../types/collection';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const getAllCollections = catchAsync(async (
  req: Request<CollectionParams, CollectionResponse[], null, CollectionQuery>,
  res: Response<CollectionResponse[]>
) => {
  const collections = await Collection.find().populate('products').lean();
  // @ts-ignore
  res.json(collections);
});

export const getCollectionById = catchAsync(async (
  req: Request<CollectionParams, CollectionResponse>,
  res: Response<CollectionResponse>
) => {
  const collection = await Collection.findById(req.params.id).populate('products');
  if (!collection) {
    throw new AppError('Collection not found', 404);
  }
  // @ts-ignore
  res.json(collection);
});

export const createCollection = catchAsync(async (
  req: Request<CollectionParams, CollectionResponse, CreateCollectionBody>,
  res: Response<CollectionResponse>
) => {
  const authenticatedReq = req as AuthenticatedRequest<CollectionParams, CollectionResponse, CreateCollectionBody>;
  const { name, description, image, banner, isActive, isFeatured } = req.body;
  const collection = await Collection.create({
    name,
    description,
    image,
    banner,
    isActive,
    isFeatured,
    products: [],
    createdBy: authenticatedReq.user._id
  });
  // @ts-ignore
  res.status(201).json(collection);
});

export const updateCollection = catchAsync(async (
  req: Request<CollectionParams, CollectionResponse, UpdateCollectionBody>,
  res: Response<CollectionResponse>
) => {
  const authenticatedReq = req as AuthenticatedRequest<CollectionParams, CollectionResponse, UpdateCollectionBody>;
  const { name, description, image, banner, isActive, isFeatured } = req.body;
  const collection = await Collection.findByIdAndUpdate(
    req.params.id,
    { name, description, image, banner, isActive, isFeatured },
    { new: true }
  ).populate('products');
  if (!collection) {
    throw new AppError('Collection not found', 404);
  }
  // @ts-ignore
  res.json(collection);
});

export const deleteCollection = catchAsync(async (
  req: Request<CollectionParams, void>,
  res: Response<void>
) => {
  const authenticatedReq = req as AuthenticatedRequest<CollectionParams, void>;
  const collection = await Collection.findByIdAndDelete(req.params.id);
  if (!collection) {
    throw new AppError('Collection not found', 404);
  }
  res.status(204).send();
});

export const addProductToCollection = catchAsync(async (
  req: Request<CollectionParams, CollectionResponse, AddProductBody>,
  res: Response<CollectionResponse>
) => {
  const authenticatedReq = req as AuthenticatedRequest<CollectionParams, CollectionResponse, AddProductBody>;
  const { productId } = req.body;
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const collection = await Collection.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { products: productId } },
    { new: true }
  ).populate('products');

  if (!collection) {
    throw new AppError('Collection not found', 404);
  }

  // @ts-ignore
  res.json(collection);
});

export const removeProductFromCollection = catchAsync(async (
  req: Request<CollectionParams, CollectionResponse>,
  res: Response<CollectionResponse>
) => {
  const authenticatedReq = req as AuthenticatedRequest<CollectionParams, CollectionResponse>;
  const collection = await Collection.findByIdAndUpdate(
    req.params.id,
    { $pull: { products: req.params.productId } },
    { new: true }
  ).populate('products');

  if (!collection) {
    throw new AppError('Collection not found', 404);
  }

  // @ts-ignore
  res.json(collection);
});
