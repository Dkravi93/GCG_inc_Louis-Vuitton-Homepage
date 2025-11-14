    import { Request, Response } from 'express';
    import { ProductModel } from '../models/product';
    import { mockProducts } from '../data/mockProducts';
    import { z } from 'zod';

    export async function getAllProducts(req: Request, res: Response) {
      try {
        const {
          q,
          category,
          material,
          gender,
          style,
          color,
          featured,
          onSale,
          limitedEdition,
          sort = 'new',
          page = '1',
          pageSize = '12',
        } = req.query as Record<string, string>;

        const useDb = true; // switch to mock by setting false
        if (!useDb) {
          return res.json(mockProducts);
        }

        const filter: any = { hidden: { $ne: true } };
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (category) filter.category = category;
        if (material) filter.material = material;
        if (gender) filter.gender = gender;
        if (style) filter.style = style;
        if (color) filter.color = color;
        if (featured === 'true') filter.featured = true;
        if (onSale === 'true') filter.onSale = true;
        if (limitedEdition === 'true') filter.limitedEdition = true;
        // Embargo: only show launched
        // filter.$or = [{ launchAt: { $exists: false } }, { launchAt: { $lte: new Date() } }];

        const sortMap: Record<string, any> = {
          new: { createdAt: -1 },
          price_asc: { price: 1 },
          price_desc: { price: -1 },
        };
        const sortSpec = sortMap[sort] ?? sortMap.new;

        const pageNum = Math.max(1, parseInt(page));
        const sizeNum = Math.max(1, Math.min(60, parseInt(pageSize)));

        const [items, total] = await Promise.all([
          ProductModel.find(filter).sort(sortSpec).skip((pageNum - 1) * sizeNum).limit(sizeNum).lean(),
          ProductModel.countDocuments(filter),
        ]);

        return res.json({ items, total, page: pageNum, pageSize: sizeNum });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch products' + (error instanceof Error ? `: ${error.message}` : '') });
      }
    }

    export async function getProductById(req: Request, res: Response) {
      try {
        const useDb = true;
        if (!useDb) {
          //@ts-expect-error: mockProducts may not have a strict 'id' property type
          const productMock = mockProducts.find(p => p.id === req.params.id);
          if (!productMock) return res.status(404).json({ message: 'Not found' });
          return res.json(productMock);
        }
        const product = await ProductModel.findById(req.params.id).lean();
        if (!product) return res.status(404).json({ message: 'Not found' });
        return res.json(product);
      } catch {
        return res.status(500).json({ message: 'Failed to fetch product' });
      }
    }

    export async function searchProducts(req: Request, res: Response) {
      try {
        const { q = '' } = req.query as Record<string, string>;
        if (!q) return res.json([]);
        const items = await ProductModel.find({ name: { $regex: q, $options: 'i' }, hidden: { $ne: true } })
          .select('name category basePrice brand images')
          .limit(10)
          .lean();
        return res.json(items);
      } catch {
        return res.status(500).json({ message: 'Search failed' });
      }
    }

    const createProductSchema = z.object({
      name: z.string().min(2),
      basePrice: z.number().nonnegative(),
      brand: z.string().min(2),
      category: z.string().min(2),
      material: z.string().optional(),
      gender: z.enum(['men', 'women', 'unisex']).optional(),
      style: z.string().optional(),
      color: z.string().optional(),
      featured: z.boolean().optional(),
      onSale: z.boolean().optional(),
      limitedEdition: z.boolean().optional(),
      hidden: z.boolean().optional(),
      launchAt: z.coerce.date().optional(),
      tags: z.array(z.string()).optional(),
      variants: z.array(z.object({
        sku: z.string(),
        color: z.string(),
        size: z.string(),
        stock: z.number().int().nonnegative(),
        price: z.number().nonnegative().optional()
      })).optional(),
      images: z.array(z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        isPrimary: z.boolean().optional()
      })).optional(),
      discount: z.object({
        type: z.enum(['percentage', 'fixed']),
        value: z.number().nonnegative()
      }).optional(),
      description: z.string().optional(),
    });

    export async function createProduct(req: Request, res: Response) {
      try {
        const parsed = createProductSchema.safeParse(req.body);
        console.log('Create product payload:', req.body, parsed);
        if (!parsed.success) return res.status(400).json({ message: 'Invalid product data' });
        const doc = await ProductModel.create(parsed.data);
        return res.status(201).json(doc);
      } catch (error) {
        return res.status(500).json({ message: 'Failed to create product' });
      }
    }

    export async function deleteProduct(req: Request, res: Response) {
      try {
        const productId = req.params.id;
        const result = await ProductModel.findByIdAndDelete(productId);
        if (!result) return res.status(404).json({ message: 'Product not found' });
        return res.status(204).send({ status:"success", message: "Product deleted Successfully" });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to delete product' });
      }
    }

    export async function updateProduct(req: Request, res: Response) {
      try {
        const productId = req.params.id;
        const parsed = createProductSchema.partial().safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: 'Invalid product data' });
        const updated = await ProductModel.findByIdAndUpdate(productId, parsed.data, { new: true });
        if (!updated) return res.status(404).json({ message: 'Product not found' });
        return res.status(200).json({ status:"success", message: "Product updated Successfully", data: updated });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to update product' });
      }
    }
