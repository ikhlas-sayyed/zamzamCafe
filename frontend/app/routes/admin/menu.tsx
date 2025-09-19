import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { X, Trash2 } from 'lucide-react';
import apis,{ menuAPI } from '~/services/api';
import Header from './Header';
import { useNavigate } from 'react-router';
import { number } from 'zod';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [IsAdding,SetAdding] = useState(false)
  const [newItem, setNewItem] = useState({
    id:number,
    name: '',
    price: '',
    category: '',
    image: null as File | null,
  });

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      const items = await menuAPI.getAdmin();
      setMenuItems(items);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Add new item
  const handleAddItem = async () => {
    try {
      SetAdding(true)
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('price', newItem.price);
      formData.append('category', newItem.category);
      formData.append('id',newItem.id)
      if (newItem.image) {
        formData.append('image', newItem.image);
      }

      const added = await menuAPI.create(formData);
      setMenuItems(prev => [...prev, added]);
      setNewItem({ name: '', price: '', category: '', image: null ,id:null});
      SetAdding(false)
      setShowModal(false);
    } catch (error) {
      SetAdding(false)
      console.error(error);
    }
  };

  // Toggle availability
  const toggleStock = async (id: number) => {
    try {
      await menuAPI.toggleAvailability(id.toString());
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: !item.isAvailable } : item));
    } catch (error) {
      console.error(error);
    }
  };

  // Delete item
  const deleteItem = async (id: number) => {
    try {
      await menuAPI.delete(id.toString());
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };
  const navigate=useNavigate()
  return (
    <div className="min-h-screen flex bg-gray-100">
    <Header navigate={navigate}/>
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🍔 Menu Management</h1>
        <Button onClick={() => setShowModal(true)}>Add Item</Button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {menuItems.map(item => (
          <Card key={item.id} className="relative">
            <CardContent>
              <img src={apis.defaults.baseURL+item.image} crossOrigin="anonymous" alt={item.name} className="w-full h-40 object-cover rounded-md mb-4" />
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
                <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add New Menu Item</h3>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>

            <div className="space-y-4">
              <Input placeholder="Item Number" type="number" value={newItem.id} onChange={e => setNewItem({ ...newItem, id: e.target.value })} />
              <Input placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
              <Input placeholder="Price" type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
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
                <Button disabled={IsAdding} onClick={handleAddItem}>{IsAdding ? "Adding" : "Add Item"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
