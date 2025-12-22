import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Upload,
  X,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Tag,
  Book
} from 'lucide-react';
import { useAtomValue } from 'jotai';
import { authUserAtom } from '../store/auth';
import { productsApi } from '../lib/api';
import DragDropProductCreator, { ProductFormData } from '../components/DragDropProductCreator';

interface Product {
  _id: string;
  name: string;
  basePrice: number;
  category: string;
  brand?: string;
  featured?: boolean;
  onSale?: boolean;
  limitedEdition?: boolean;
  hidden?: boolean;
  launchAt?: string;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  variants?: Array<{ sku: string; color: string; size: string; stock: number }>;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  material?: string;
  style?: string;
  tags?: string[];
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

type View = 'dashboard' | 'products' | 'orders' | 'analytics' | 'settings' | 'docs';
type ProductModal = 'create' | 'edit' | 'view' | null;

export default function AdminPage() {
  const user = useAtomValue(authUserAtom);
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productModal, setProductModal] = useState<ProductModal>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    recentOrders: [],
    topProducts: []
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);



  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data: any = await productsApi.getAll();
      setProducts(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now - in real implementation, these would be separate API calls
      setStats({
        totalProducts: products.length || 0,
        totalOrders: 156,
        totalRevenue: 48750.00,
        totalUsers: 1240,
        recentOrders: [],
        topProducts: []
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateProduct = async (formData: ProductFormData) => {
    setMessage(null);
    try {
      // First, upload any new images
      const imageUrls = [];
      for (const image of formData.images) {
        if (image.file) {
           imageUrls.push({
            url: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop&sig=${Date.now()}`,
            isPrimary: image.isPrimary || false
          });
        } else if (image.url) {
           imageUrls.push({
            url: image.url,
            isPrimary: image.isPrimary || false
          });
        } else {
           imageUrls.push({
            url: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop&sig=${Date.now()}`,
            isPrimary: image.isPrimary || false
          });
        }
      }
      
      const productData = {
        ...formData,
        images: imageUrls,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        launchAt: formData.launchAt || undefined
      };
      
      await productsApi.create(productData);
      
      setMessage({ type: 'success', text: 'Product created successfully!' });
      fetchProducts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create product' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateProduct = async (formData: ProductFormData) => {
    if (!selectedProduct) return;
    setMessage(null);
    try {
      // Process images
      const imageUrls = [];
      for (const image of formData.images) {
        if (image.file) {
           imageUrls.push({
            url: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop&sig=${Date.now()}`,
            isPrimary: image.isPrimary || false
          });
        } else if (image.url) {
           imageUrls.push({
            url: image.url,
            isPrimary: image.isPrimary || false
          });
        } else {
           imageUrls.push({
            url: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop&sig=${Date.now()}`,
            isPrimary: image.isPrimary || false
          });
        }
      }
      
      const productData = {
        ...formData,
        images: imageUrls,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        launchAt: formData.launchAt || undefined
      };
      
      await productsApi.update(selectedProduct._id, productData);

      setMessage({ type: 'success', text: 'Product updated successfully!' });
      fetchProducts();
      setProductModal(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
       console.error(error);
       setMessage({ type: 'error', text: 'Failed to update product' });
       setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsApi.delete(productId);
      
      setMessage({ type: 'success', text: 'Product deleted successfully' });
      fetchProducts();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete product' });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const Navigation = () => (
    <nav className="flex space-x-8 border-b mb-8">
      {[
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'orders', label: 'Orders', icon: Clock },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'settings', label: 'Settings', icon: Users },
        { id: 'docs', label: 'API Docs', icon: Book }
      ].map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as View)}
            className={`flex rounded items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              currentView === item.id
                ? 'border-neutral-800 bg-neutral-500'
                : 'border-transparent  hover:border-neutral-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  const Dashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm ">Total Products</p>
              <p className="text-3xl font-light ">{stats.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 " />
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm ">Total Orders</p>
              <p className="text-3xl font-light ">{stats.totalOrders}</p>
            </div>
            <Clock className="h-8 w-8 " />
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Revenue</p>
              <p className="text-3xl font-light text-black">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8" />
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Users</p>
              <p className="text-3xl font-light text-black">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 " />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-light mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setProductModal('create')}
              className="w-full border flex items-center gap-3 p-3 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create New Product
            </button>
            <button className="w-full border flex items-center gap-3 p-3 rounded-lg hover:bg-white/20 transition-colors">
              <Upload className="h-5 w-5" />
              Bulk Import Products
            </button>
            <button className="w-full border flex items-center gap-3 p-3 rounded-lg hover:bg-white/20 transition-colors">
              <TrendingUp className="h-5 w-5" />
              View Analytics
            </button>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-light mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="">New product "Aviator Classic" created</span>
              <span className=" ml-auto">2h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="">Low stock alert for "Ray-Ban Wayfarer"</span>
              <span className=" ml-auto">4h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="">Order #GCG-1234 completed</span>
              <span className=" ml-auto">6h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light">Products</h2>
          <p className="">Manage your product catalog</p>
        </div>
        <button
          onClick={() => {
            setSelectedProduct(null);
            setProductModal('create');
          }}
          className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black transition-all hover:bg-white/90 hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Create Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 " />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/20 py-2 pl-10 pr-4 focus:border-white/40 focus:outline-none"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-white/20 px-4 py-2  focus:border-white/40 focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="sunglasses">Sunglasses</option>
          <option value="optical">Optical</option>
          <option value="accessories">Accessories</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="h-48 rounded-lg mb-4" />
              <div className="h-4 rounded mb-2" />
              <div className="h-6 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-2xl border p-6 hover:text-dark transition-colors"
            >
              <div className="relative mb-4">
                <img
                  src={product.images?.[0]?.url || `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop&sig=${product._id}`}
                  alt={product.name}
                  className="h-48 w-full rounded-lg object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {product.featured && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                  {product.onSale && <Tag className="h-4 w-4 text-green-400" />}
                  {product.limitedEdition && <AlertCircle className="h-4 w-4 text-purple-400" />}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      navigate(`/product/${product._id}`);
                    }}
                    className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
                    title="View Product"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                  onClick={() => {
                    setSelectedProduct(product);
                    setProductModal('edit');
                  }}
                  className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
                  title="Edit Product"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="rounded-full bg-red-500/20 p-2 hover:bg-red-500/30 transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium  mb-1">{product.name}</h3>
                <p className="text-sm  mb-2">{product.category}</p>
                <p className="text-lg font-light ">${product.basePrice.toFixed(2)}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    product.hidden 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {product.hidden ? 'Hidden' : 'Published'}
                  </span>
                  {product.variants && (
                    <span className="">
                      {product.variants.length} variants
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // CreateProductModal replaced with DragDropProductCreator
  const DocsView = () => (
    <div className="h-[calc(100vh-200px)] rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <iframe 
        src="/api-docs" 
        className="w-full h-full bg-white"
        title="API Documentation"
      />
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductsView />;
      case 'orders':
        return <div className="text-center py-12"><p className="">Orders management coming soon</p></div>;
      case 'analytics':
        return <div className="text-center py-12"><p className="">Analytics dashboard coming soon</p></div>;
      case 'settings':
        return <div className="text-center py-12"><p className="">Settings panel coming soon</p></div>;
      case 'docs':
        return <DocsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl px-6 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-extralight mb-2">Admin Dashboard</h1>
          <p className="">Welcome back, {user?.firstName || 'Admin'}</p>
        </div>

        <Navigation />

        {/* Message Display */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 rounded-lg p-4 flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              {message.text}
              <button
                onClick={() => setMessage(null)}
                className="ml-auto text-current hover:opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {renderCurrentView()}
        
        <DragDropProductCreator
          isOpen={productModal === 'create' || productModal === 'edit'}
          onClose={() => setProductModal(null)}
          onSubmit={productModal === 'edit' ? handleUpdateProduct : handleCreateProduct}
          initialData={productModal === 'edit' && selectedProduct ? {
            ...selectedProduct,
            tags: selectedProduct.tags?.join(', ') || ''
          } : undefined}
        />
      </div>
    </div>
  );
}
