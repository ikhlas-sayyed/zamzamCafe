import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { X, Trash2, Edit } from 'lucide-react';
import apis, { menuAPI } from '~/services/api';
import Header from './Header';
import { useNavigate } from 'react-router';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null); // for update
  const [IsAdding, SetAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    price: '',
    category: '',
    image: null as File | null,
  });

  const navigate = useNavigate();

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      const items = await menuAPI.getAdmin();
      setMenuItems(items);
      setFilteredItems(items);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Search
  useEffect(() => {
    if (!searchTerm) return setFilteredItems(menuItems);
    const term = searchTerm.toLowerCase();
    setFilteredItems(
      menuItems.filter(
        item =>
          item.name.toLowerCase().includes(term) ||
          item.id.toString().includes(term)
      )
    );
  }, [searchTerm, menuItems]);

  // Add / Update item
  const handleSubmitItem = async () => {
    if (!newItem.id || !newItem.name || !newItem.price || !newItem.category) {
      alert('Please fill all fields');
      return;
    }

    try {
      SetAdding(true);
      const formData = new FormData();
      formData.append('id', newItem.id);
      formData.append('name', newItem.name);
      formData.append('price', newItem.price);
      formData.append('category', newItem.category);
      if (newItem.image) formData.append('image', newItem.image);

      let updatedItem;
      if (editingItem) {
        updatedItem = await menuAPI.update(editingItem.id.toString(), formData);
        setMenuItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
        setFilteredItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
      } else {
        updatedItem = await menuAPI.create(formData);
        setMenuItems(prev => [...prev, updatedItem]);
        setFilteredItems(prev => [...prev, updatedItem]);
      }

      // Reset modal
      setNewItem({ id: '', name: '', price: '', category: '', image: null });
      setEditingItem(null);
      setShowModal(false);
      SetAdding(false);
    } catch (error) {
      console.error(error);
      SetAdding(false);
      alert('Failed to submit item');
    }
  };

  // Toggle stock
  const toggleStock = async (id: number) => {
    try {
      await menuAPI.toggleAvailability(id.toString());
      setMenuItems(prev =>
        prev.map(item => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
      );
      setFilteredItems(prev =>
        prev.map(item => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Delete item
  const confirmDelete = (id: number) => setDeleteId(id);
  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await menuAPI.delete(deleteId.toString());
      setMenuItems(prev => prev.filter(item => item.id !== deleteId));
      setFilteredItems(prev => prev.filter(item => item.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
  };

  // Edit item
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setNewItem({
      id: item.id.toString(),
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: null,
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Header navigate={navigate} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🍔 Menu Management</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or item number"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Button onClick={() => { setShowModal(true); setEditingItem(null); }}>Add Item</Button>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="relative">
              <CardContent>
                <img
                  src={apis.defaults.baseURL + item.image}
                  crossOrigin="anonymous"
                  alt={item.name}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-600">Category: {item.category}</p>
                <p className="text-sm text-gray-600">Price: ${item.price.toFixed(2)}</p>
                <p className={`text-sm font-medium ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => toggleStock(item.id)}>
                    {item.isAvailable ? 'Mark Out of Stock' : 'Mark In Stock'}
                  </Button>
                  <Button size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => confirmDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add / Update Item Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{editingItem ? 'Update Menu Item' : 'Add New Menu Item'}</h3>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Item Number"
                  type="number"
                  value={newItem.id}
                  onChange={e => setNewItem({ ...newItem, id: e.target.value })}
                />
                <Input
                  placeholder="Item Name"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                />
                <Input
                  placeholder="Price"
                  type="number"
                  value={newItem.price}
                  onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                />
                <Input type="file" onChange={e => setNewItem({ ...newItem, image: e.target.files?.[0] || null })} />
                <Select value={newItem.category} onValueChange={value => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Main">Main</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
                    <SelectItem value="Drink">Drink</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button disabled={IsAdding} onClick={handleSubmitItem}>
                    {IsAdding ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Update' : 'Add Item')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-6">
              <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
              <p className="mb-4">Are you sure you want to delete this item?</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
