import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  watermark?: boolean;
}

interface ImageVariant {
  size: string;
  width: number;
  height: number;
  url: string;
  path: string;
}

interface ProcessedImage {
  original: {
    url: string;
    path: string;
    size: number;
  };
  variants: ImageVariant[];
}

class ImageService {
  private readonly uploadDir: string;
  private readonly cdnBaseUrl: string;
  private readonly watermarkPath: string;
  
  // Predefined image sizes for different use cases
  private readonly imageSizes = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
    hero: { width: 1920, height: 1080 },
    card: { width: 400, height: 500 }
  };

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.cdnBaseUrl = process.env.CDN_BASE_URL || '';
    this.watermarkPath = path.join(__dirname, '../assets/watermark.png');
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories(): Promise<void> {
    const directories = ['products', 'collections', 'users', 'temp'];
    
    for (const dir of directories) {
      const fullPath = path.join(this.uploadDir, dir);
      try {
        await fs.access(fullPath);
      } catch {
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${fullPath}`);
      }
    }
  }

  /**
   * Process a single image file and create multiple variants
   */
  async processImage(
    file: Express.Multer.File | Buffer,
    category: string = 'products',
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    try {
      const fileId = uuidv4();
      const originalFormat = options.format || 'jpeg';
      
      // Handle both file upload and buffer input
      let inputBuffer: Buffer;
      if (Buffer.isBuffer(file)) {
        inputBuffer = file;
      } else {
        inputBuffer = file.buffer;
      }

      const originalPath = path.join(this.uploadDir, category, `${fileId}-original.${originalFormat}`);
      const originalUrl = this.getImageUrl(category, `${fileId}-original.${originalFormat}`);

      // Process original image
      const processedOriginal = await this.optimizeImage(inputBuffer, {
        quality: 90,
        format: originalFormat,
        ...options
      });

      // Save original
      await fs.writeFile(originalPath, processedOriginal);
      const originalStats = await fs.stat(originalPath);

      // Create variants
      const variants: ImageVariant[] = [];
      
      for (const [sizeName, dimensions] of Object.entries(this.imageSizes)) {
        const variantFileName = `${fileId}-${sizeName}.${originalFormat}`;
        const variantPath = path.join(this.uploadDir, category, variantFileName);
        const variantUrl = this.getImageUrl(category, variantFileName);

        const variantBuffer = await this.createVariant(inputBuffer, {
          width: dimensions.width,
          height: dimensions.height,
          format: originalFormat,
          quality: sizeName === 'thumbnail' ? 80 : 85,
          fit: 'cover',
          ...options
        });

        await fs.writeFile(variantPath, variantBuffer);

        variants.push({
          size: sizeName,
          width: dimensions.width,
          height: dimensions.height,
          url: variantUrl,
          path: variantPath
        });
      }

      return {
        original: {
          url: originalUrl,
          path: originalPath,
          size: originalStats.size
        },
        variants
      };

    } catch (error) {
      console.error('❌ Image processing failed:', error);
      throw new Error('Image processing failed');
    }
  }

  /**
   * Process multiple images in batch
   */
  async processBatchImages(
    files: (Express.Multer.File | Buffer)[],
    category: string = 'products',
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processImage(file, category, options);
        results.push(result);
      } catch (error) {
        console.error('❌ Failed to process image in batch:', error);
      }
    }
    
    return results;
  }

  /**
   * Create a resized variant of an image
   */
  private async createVariant(
    inputBuffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    let processor = sharp(inputBuffer);

    // Resize image
    if (options.width || options.height) {
      processor = processor.resize(options.width, options.height, {
        fit: options.fit || 'cover',
        withoutEnlargement: true
      });
    }

    // Add watermark if requested
    if (options.watermark) {
      try {
        await fs.access(this.watermarkPath);
        processor = processor.composite([{
          input: this.watermarkPath,
          gravity: 'southeast',
          blend: 'over'
        }]);
      } catch (error) {
        console.warn('⚠️  Watermark file not found, skipping...');
      }
    }

    // Set format and quality
    switch (options.format) {
      case 'jpeg':
        processor = processor.jpeg({ quality: options.quality || 85, progressive: true });
        break;
      case 'png':
        processor = processor.png({ quality: options.quality || 85, progressive: true });
        break;
      case 'webp':
        processor = processor.webp({ quality: options.quality || 85 });
        break;
      default:
        processor = processor.jpeg({ quality: options.quality || 85, progressive: true });
    }

    return processor.toBuffer();
  }

  /**
   * Optimize image without resizing
   */
  private async optimizeImage(
    inputBuffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    let processor = sharp(inputBuffer);

    // Auto-orient based on EXIF data
    processor = processor.rotate();

    // Apply format and quality
    switch (options.format) {
      case 'jpeg':
        processor = processor.jpeg({ 
          quality: options.quality || 90, 
          progressive: true,
          mozjpeg: true 
        });
        break;
      case 'png':
        processor = processor.png({ 
          quality: options.quality || 90, 
          progressive: true,
          compressionLevel: 9
        });
        break;
      case 'webp':
        processor = processor.webp({ quality: options.quality || 90 });
        break;
      default:
        processor = processor.jpeg({ 
          quality: options.quality || 90, 
          progressive: true,
          mozjpeg: true 
        });
    }

    return processor.toBuffer();
  }

  /**
   * Generate WebP versions for modern browsers
   */
  async generateWebPVariants(processedImage: ProcessedImage): Promise<string[]> {
    const webpUrls: string[] = [];

    // Convert original to WebP
    const originalBuffer = await fs.readFile(processedImage.original.path);
    const webpBuffer = await sharp(originalBuffer).webp({ quality: 85 }).toBuffer();
    
    const webpFileName = path.basename(processedImage.original.path, path.extname(processedImage.original.path)) + '.webp';
    const webpPath = path.join(path.dirname(processedImage.original.path), webpFileName);
    
    await fs.writeFile(webpPath, webpBuffer);
    webpUrls.push(this.getImageUrl(path.basename(path.dirname(processedImage.original.path)), webpFileName));

    // Convert variants to WebP
    for (const variant of processedImage.variants) {
      const variantBuffer = await fs.readFile(variant.path);
      const webpVariantBuffer = await sharp(variantBuffer).webp({ quality: 80 }).toBuffer();
      
      const webpVariantFileName = path.basename(variant.path, path.extname(variant.path)) + '.webp';
      const webpVariantPath = path.join(path.dirname(variant.path), webpVariantFileName);
      
      await fs.writeFile(webpVariantPath, webpVariantBuffer);
      webpUrls.push(this.getImageUrl(path.basename(path.dirname(variant.path)), webpVariantFileName));
    }

    return webpUrls;
  }

  /**
   * Delete image files
   */
  async deleteImage(imagePath: string): Promise<void> {
    try {
      await fs.unlink(imagePath);
      console.log(`🗑️  Deleted image: ${imagePath}`);
    } catch (error) {
      console.error('❌ Failed to delete image:', error);
    }
  }

  /**
   * Delete all variants of an image
   */
  async deleteImageVariants(fileId: string, category: string): Promise<void> {
    const directory = path.join(this.uploadDir, category);
    
    try {
      const files = await fs.readdir(directory);
      const imageFiles = files.filter(file => file.startsWith(fileId));
      
      for (const file of imageFiles) {
        await this.deleteImage(path.join(directory, file));
      }
    } catch (error) {
      console.error('❌ Failed to delete image variants:', error);
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imagePath: string): Promise<sharp.Metadata> {
    try {
      const buffer = await fs.readFile(imagePath);
      return await sharp(buffer).metadata();
    } catch (error) {
      console.error('❌ Failed to get image metadata:', error);
      throw error;
    }
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(variants: ImageVariant[]): string {
    return variants
      .map(variant => `${variant.url} ${variant.width}w`)
      .join(', ');
  }

  /**
   * Generate image URL based on CDN or local serving
   */
  private getImageUrl(category: string, filename: string): string {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${category}/${filename}`;
    }
    
    // Local serving URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${category}/${filename}`;
  }

  /**
   * Clean up temporary files older than specified time
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    const tempDir = path.join(this.uploadDir, 'temp');
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          await this.deleteImage(filePath);
        }
      }
      
      console.log(`🧹 Cleaned up temporary files older than ${olderThanHours} hours`);
    } catch (error) {
      console.error('❌ Failed to cleanup temp files:', error);
    }
  }
}

export const imageService = new ImageService();
export default ImageService;