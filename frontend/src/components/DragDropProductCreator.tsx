import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  AlertCircle,
  CheckCircle,
  Loader,
  Eye
} from 'lucide-react';

interface ProductImage {
  url: string;
  isPrimary?: boolean;
  file?: File;
  preview?: string;
}

interface ProductVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
}

interface ProductFormData {
  name: string;
  basePrice: number;
  category: string;
  brand: string;
  description: string;
  material: string;
  style: string;
  featured: boolean;
  onSale: boolean;
  limitedEdition: boolean;
  tags: string;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  variants: ProductVariant[];
  images: ProductImage[];
}

interface DragDropProductCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
}

export default function DragDropProductCreator({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: DragDropProductCreatorProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    basePrice: 0,
    category: 'sunglasses',
    brand: '',
    description: '',
    material: '',
    style: '',
    featured: false,
    onSale: false,
    limitedEdition: false,
    tags: '',
    discount: { type: 'percentage', value: 0 },
    variants: [{ sku: '', color: '', size: '', stock: 0 }],
    images: [],
    ...initialData
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setErrors(prev => ({ ...prev, files: 'Please upload only image files' }));
      return;
    }

    setUploading(true);
    const newImages: ProductImage[] = [];

    for (const file of imageFiles) {
      try {
        // Create preview URL
        const preview = URL.createObjectURL(file);
        
        // Simulate upload progress
        const fileName = file.name;
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
        
        // Simulate progressive upload
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
        }

        newImages.push({
          url: preview,
          file,
          preview,
          isPrimary: formData.images.length === 0 && newImages.length === 0
        });

        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileName];
          return updated;
        });
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    
    setUploading(false);
    setErrors(prev => {
      const updated = { ...prev };
      delete updated.files;
      return updated;
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const updatedImages = prev.images.filter((_, i) => i !== index);
      // If we removed the primary image, make the first remaining image primary
      if (prev.images[index].isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }
      return {
        ...prev,
        images: updatedImages
      };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { sku: '', color: '', size: '', stock: 0 }]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (formData.basePrice <= 0) newErrors.basePrice = 'Price must be greater than 0';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.images.length === 0) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setErrors({ general: 'Failed to create product' });
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Product details' },
    { number: 2, title: 'Images', description: 'Upload photos' },
    { number: 3, title: 'Variants', description: 'Colors & sizes' },
    { number: 4, title: 'Review', description: 'Finalize product' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Base Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                  placeholder="0.00"
                />
                {errors.basePrice && (
                  <p className="text-red-400 text-xs mt-1">{errors.basePrice}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="sunglasses">Sunglasses</option>
                  <option value="eyeglasses">Eyeglasses</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                  placeholder="Enter brand name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                placeholder="Describe your product..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                  placeholder="e.g., Acetate, Metal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Style
                </label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                  placeholder="e.g., Aviator, Wayfarer"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/20 hover:border-white/40'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  dragActive ? 'bg-blue-500/20' : 'bg-white/10'
                }`}>
                  <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-400' : 'text-white/60'}`} />
                </div>
                
                <div>
                  <p className="text-white text-lg font-medium">
                    {dragActive ? 'Drop images here' : 'Drag & drop images here'}
                  </p>
                  <p className="text-white/60 text-sm mt-2">
                    or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-white/40 text-xs mt-2">
                    PNG, JPG, JPEG up to 10MB each
                  </p>
                </div>
              </div>

              {uploading && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <Loader className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                    <p className="text-white">Uploading images...</p>
                  </div>
                </div>
              )}
            </div>

            {errors.images && (
              <p className="text-red-400 text-sm">{errors.images}</p>
            )}

            {/* Upload Progress */}
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">{fileName}</span>
                  <span className="text-white/60 text-sm">{progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Image Gallery */}
            {formData.images.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-4">Uploaded Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-white/5 rounded-lg overflow-hidden">
                        <img
                          src={image.preview || image.url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Image Controls */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className={`p-2 rounded-full transition-colors ${
                            image.isPrimary 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                          title={image.isPrimary ? 'Primary image' : 'Set as primary'}
                        >
                          {image.isPrimary ? <CheckCircle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {image.isPrimary && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Product Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Variant {index + 1}</h4>
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].sku = e.target.value;
                          setFormData(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                        placeholder="SKU123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].color = e.target.value;
                          setFormData(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                        placeholder="Black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Size
                      </label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].size = e.target.value;
                          setFormData(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                        placeholder="Medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].stock = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-white font-medium text-xl">Review Product</h3>
            
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="text-white font-medium text-lg">{formData.name}</h4>
                <p className="text-white/60">{formData.category} • {formData.brand}</p>
              </div>
              
              <div>
                <span className="text-2xl font-light text-white">${formData.basePrice.toFixed(2)}</span>
              </div>
              
              {formData.description && (
                <p className="text-white/80">{formData.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-white">
                  {formData.images.length} image{formData.images.length !== 1 ? 's' : ''}
                </span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-white">
                  {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''}
                </span>
                {formData.featured && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    Featured
                  </span>
                )}
              </div>
            </div>
            
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{errors.general}</span>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light text-white">Create New Product</h2>
                  <p className="text-white/60">Add a new product to your catalog</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center mt-6">
                <div className="flex items-center gap-4">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <button
                        onClick={() => setCurrentStep(step.number)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all ${
                          currentStep >= step.number
                            ? 'border-white bg-white text-black'
                            : 'border-white/20 text-white/60 hover:border-white/40'
                        }`}
                      >
                        {step.number}
                      </button>
                      <div className="ml-2 mr-4">
                        <div className={`text-sm font-medium ${
                          currentStep >= step.number ? 'text-white' : 'text-white/60'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-white/40">{step.description}</div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-8 h-px ${
                          currentStep > step.number ? 'bg-white' : 'bg-white/20'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit}>
                {renderStepContent()}
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-6">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex gap-3">
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                      className="px-6 py-3 rounded-lg bg-white text-black hover:bg-white/90 transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="px-6 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      Create Product
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}