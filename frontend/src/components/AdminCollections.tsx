import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAtom } from 'jotai';
import { showToastAtom } from '../store/ui';

interface Collection {
  _id: string;
  name: string;
  description: string;
  image: string;
  banner?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  products: string[];
}

interface CollectionFormData {
  name: string;
  description: string;
  image: string;
  banner?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

const AdminCollections: React.FC = () => {
  const [, showToast] = useAtom(showToastAtom);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    image: '',
    banner: '',
    isActive: true,
    isFeatured: false,
    displayOrder: 0
  });

  // Fetch collections
  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const collections = await api.get<Collection[]>('/collections');
      setCollections(collections);
    } catch (error) {
      showToast({ 
        message: 'Failed to fetch collections' + error, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await api.put(`/collections/${editingCollection._id}`, formData);
        showToast({ 
          message: 'Collection updated successfully', 
          type: 'success' 
        });
      } else {
        await api.post('/collections', formData);
        showToast({ 
          message: 'Collection created successfully', 
          type: 'success' 
        });
      }
      setEditingCollection(null);
      resetForm();
      fetchCollections();
    } catch (error) {
      showToast({ 
        message: 'Failed to save collection' + error, 
        type: 'error' 
      });
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description,
      image: collection.image,
      banner: collection.banner || '',
      isActive: collection.isActive,
      isFeatured: collection.isFeatured,
      displayOrder: collection.displayOrder
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    
    try {
      await api.delete(`/collections/${id}`);
      showToast({ 
        message: 'Collection deleted successfully', 
        type: 'success' 
      });
      fetchCollections();
    } catch (error) {
      showToast({ 
        message: 'Failed to delete collection' + error, 
        type: 'error' 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      banner: '',
      isActive: true,
      isFeatured: false,
      displayOrder: 0
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        {editingCollection ? 'Edit Collection' : 'Create New Collection'}
      </h1>

      <form onSubmit={handleSubmit} className="mb-8 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block mb-1">Image URL</label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Banner URL (Optional)</label>
            <input
              type="url"
              name="banner"
              value={formData.banner}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Display Order</label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              min={0}
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="mr-2"
              />
              Active
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="mr-2"
              />
              Featured
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            {editingCollection ? 'Update Collection' : 'Create Collection'}
          </button>

          {editingCollection && (
            <button
              type="button"
              onClick={() => {
                setEditingCollection(null);
                resetForm();
              }}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Collections</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map(collection => (
              <div
                key={collection._id}
                className="border rounded-lg overflow-hidden shadow-sm"
              >
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{collection.name}</h3>
                    <div className="flex gap-2">
                      {collection.isActive && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      )}
                      {collection.isFeatured && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{collection.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Order: {collection.displayOrder}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(collection)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(collection._id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCollections;