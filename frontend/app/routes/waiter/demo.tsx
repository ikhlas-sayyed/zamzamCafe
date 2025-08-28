import React, { useState, useEffect } from 'react';
import { Plus, Clipboard, X, Minus, Trash2, Check, Eye } from 'lucide-react';

// Menu data
const menuItems = [
  { id: 1, name: "Chicken Biryani", price: 299, image: "https://images.unsplash.com/photo-1563379091339-03246963d7d3?w=300&h=200&fit=crop", category: "main" },
  { id: 2, name: "Mutton Biryani", price: 399, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&h=200&fit=crop", category: "main" },
  { id: 3, name: "Chicken Khima", price: 249, image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop", category: "main" },
  { id: 4, name: "Mutton Khima", price: 329, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop", category: "main" },
  { id: 5, name: "Chicken Tikka", price: 199, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop", category: "starters" },
  { id: 6, name: "Seekh Kebab", price: 179, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&h=200&fit=crop", category: "starters" },
  { id: 7, name: "Butter Chicken", price: 269, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop", category: "main" },
  { id: 8, name: "Tandoori Chicken", price: 229, image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=300&h=200&fit=crop", category: "main" },
  { id: 9, name: "Chicken 65", price: 189, image: "https://images.unsplash.com/photo-1606491956391-491cb0f2d24c?w=300&h=200&fit=crop", category: "starters" },
  { id: 10, name: "Mutton Curry", price: 349, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop", category: "main" },
  { id: 11, name: "Masala Chai", price: 25, image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300&h=200&fit=crop", category: "beverages" },
  { id: 12, name: "Lassi", price: 45, image: "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300&h=200&fit=crop", category: "beverages" }
];

// Toast Component
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade-in-down">
      {message}
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-5 right-5 z-50 space-y-2">
    {toasts.map(toast => (
      <Toast
        key={toast.id}
        message={toast.message}
        onClose={() => removeToast(toast.id)}
      />
    ))}
  </div>
);

// Header Component
const Header = ({ currentPage, setCurrentPage }) => (
  <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sticky top-0 z-40">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Zam Zam Cafe</h1>
          <p className="text-blue-100 text-sm">Waiter Interface</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage('orders')}
            className={`backdrop-blur-sm rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${
              currentPage === 'orders' ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Clipboard className="w-5 h-5" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setCurrentPage('new-order')}
            className={`rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${
              currentPage === 'new-order' 
                ? 'bg-green-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>New Order</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);

// Menu Item Component
const MenuItem = ({ item, onAddItem }) => (
  <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    <img src={item.image} alt={item.name} className="w-full h-32 object-cover" />
    <div className="p-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">ID: {item.id}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-bold text-blue-600">₹{item.price}</span>
        <button
          onClick={() => onAddItem(item.id)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  </div>
);

// Current Order Item Component
const CurrentOrderItem = ({ item, onRemove }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-3">
      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
      <div>
        <h4 className="font-semibold">{item.name}</h4>
        <p className="text-sm text-gray-600">₹{item.price} x {item.quantity}</p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <span className="font-bold">₹{item.price * item.quantity}</span>
      <button
        onClick={() => onRemove(item.id)}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// ID Reference Component
const IdReference = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <h3 className="text-lg font-bold text-gray-800 mb-4">Item ID Reference</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
      {menuItems.map(item => (
        <div key={item.id} className="bg-gray-50 p-2 rounded flex justify-between">
          <span className="font-medium">{item.id}.</span>
          <span className="text-gray-600 truncate ml-2">{item.name}</span>
        </div>
      ))}
    </div>
  </div>
);

// New Order Page Component
const NewOrderPage = ({ currentOrder, setCurrentOrder, showToast }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [inputMethod, setInputMethod] = useState('menu');
  const [itemId, setItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    const id = parseInt(itemId);
    const item = menuItems.find(i => i.id === id);
    setPreviewItem(item || null);
  }, [itemId]);

  const addItemFromMenu = (id) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    setCurrentOrder(prev => ({
      ...prev,
      [id]: prev[id] 
        ? { ...prev[id], quantity: prev[id].quantity + 1 }
        : { ...item, quantity: 1 }
    }));
  };

  const addItemById = () => {
    const id = parseInt(itemId);
    const quantity = parseInt(itemQuantity) || 1;
    const item = menuItems.find(i => i.id === id);

    if (!item) {
      showToast('Invalid item ID. Please enter a valid ID (1-12).');
      return;
    }

    setCurrentOrder(prev => ({
      ...prev,
      [id]: prev[id] 
        ? { ...prev[id], quantity: prev[id].quantity + quantity }
        : { ...item, quantity }
    }));

    setItemId('');
    setItemQuantity(1);
    setPreviewItem(null);
  };

  const removeFromCurrentOrder = (id) => {
    setCurrentOrder(prev => {
      const newOrder = { ...prev };
      delete newOrder[id];
      return newOrder;
    });
  };

  const clearCurrentOrder = () => {
    setCurrentOrder({});
  };

  const submitOrder = () => {
    if (!tableNumber.trim()) {
      showToast('Please enter table number.');
      return;
    }

    if (Object.keys(currentOrder).length === 0) {
      showToast('Please add items to the order.');
      return;
    }

    const orderId = Date.now();
    const total = Object.values(currentOrder).reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // This would normally save to parent component state
    setTableNumber('');
    setCurrentOrder({});
    showToast(`Order #${orderId} submitted successfully!`);
  };

  const currentOrderTotal = Object.values(currentOrder).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const hasItems = Object.keys(currentOrder).length > 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Order</h2>
        
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Table #"
            />
          </div>
        </div>

        {/* Input Method Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setInputMethod('menu')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              inputMethod === 'menu' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Menu Selection
          </button>
          <button
            onClick={() => setInputMethod('id')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              inputMethod === 'id' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ID Entry
          </button>
        </div>

        {/* ID Entry Method */}
        {inputMethod === 'id' && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Enter Item by ID</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item ID</label>
                <input
                  type="number"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter ID (1-12)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addItemById}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </div>
            {previewItem && (
              <div className="mt-4">
                <div className="bg-white border rounded-lg p-3 flex items-center space-x-3">
                  <img src={previewItem.image} alt={previewItem.name} className="w-16 h-16 object-cover rounded" />
                  <div>
                    <h4 className="font-semibold">{previewItem.name}</h4>
                    <p className="text-blue-600 font-bold">₹{previewItem.price}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menu Selection Method */}
        {inputMethod === 'menu' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {menuItems.map(item => (
              <MenuItem key={item.id} item={item} onAddItem={addItemFromMenu} />
            ))}
          </div>
        )}
      </div>

      {/* Current Order */}
      {hasItems && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Current Order</h3>
            <button
              onClick={clearCurrentOrder}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3">
            {Object.values(currentOrder).map(item => (
              <CurrentOrderItem
                key={item.id}
                item={item}
                onRemove={removeFromCurrentOrder}
              />
            ))}
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total</span>
              <span>₹{currentOrderTotal}</span>
            </div>
            <button
              onClick={submitOrder}
              className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Submit Order
            </button>
          </div>
        </div>
      )}

      <IdReference />
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onEdit, onComplete, onView }) => {
  const itemCount = Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0);
  const isCompleted = order.status === 'completed';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Order #{order.id}</h3>
          <p className="text-gray-600">Table {order.tableNumber}</p>
          <p className="text-sm text-gray-500">{order.orderTime}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            isCompleted 
              ? 'bg-green-100 text-green-600' 
              : 'bg-orange-100 text-orange-600'
          }`}>
            {isCompleted ? 'Completed' : 'In Process'}
          </span>
          <div className="text-2xl font-bold text-gray-800 mt-2">₹{order.total}</div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">{itemCount} items:</p>
        <div className="text-sm text-gray-600 space-y-1">
          {Object.values(order.items).map((item, index) => (
            <div key={index}>{item.name} x {item.quantity}</div>
          ))}
        </div>
      </div>
      
      <div className="flex space-x-3">
        {!isCompleted ? (
          <>
            <button
              onClick={() => onEdit(order.id)}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Edit Order</span>
            </button>
            <button
              onClick={() => onComplete(order.id)}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Complete</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => onView(order.id)}
            className="w-full bg-gray-500 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Edit Order Modal Component
const EditOrderModal = ({ order, onClose, onSave, showToast }) => {
  const [editedItems, setEditedItems] = useState(order ? { ...order.items } : {});

  const updateQuantity = (itemId, change) => {
    setEditedItems(prev => {
      const newItems = { ...prev };
      if (newItems[itemId]) {
        newItems[itemId].quantity += change;
        if (newItems[itemId].quantity <= 0) {
          delete newItems[itemId];
        }
      }
      return newItems;
    });
  };

  const removeItem = (itemId) => {
    if (confirm(`Remove ${editedItems[itemId].name} from the order?`)) {
      setEditedItems(prev => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });
    }
  };

  const handleSave = () => {
    if (Object.keys(editedItems).length === 0) {
      showToast('Cannot save order with no items.');
      return;
    }

    const newTotal = Object.values(editedItems).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    onSave(order.id, editedItems, newTotal);
    onClose();
  };

  const total = Object.values(editedItems).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Edit Order</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Order #{order.id}</h4>
              <p className="text-gray-600">Table {order.tableNumber}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Order Items:</h4>
              {Object.values(editedItems).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    <div>
                      <h5 className="font-medium">{item.name}</h5>
                      <p className="text-sm text-gray-600">₹{item.price} each</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Order Management Page Component
const OrderManagementPage = ({ orders, onEditOrder, onCompleteOrder, onViewOrder, showToast }) => {
  const [activeTab, setActiveTab] = useState('in-process');

  const inProcessOrders = Object.values(orders).filter(order => order.status === 'in-process');
  const completedOrders = Object.values(orders).filter(order => order.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('in-process')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'in-process'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>In Process Orders</span>
            <span className="bg-white text-orange-500 px-2 py-1 rounded-full text-xs font-bold">
              {inProcessOrders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>Completed Orders</span>
            <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-bold">
              {completedOrders.length}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === 'in-process' && (
          <>
            {inProcessOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No orders in process</div>
            ) : (
              inProcessOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onEdit={onEditOrder}
                  onComplete={onCompleteOrder}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'completed' && (
          <>
            {completedOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No completed orders</div>
            ) : (
              completedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={onViewOrder}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Main App Component
export default function ZamZamCafe() {
  const [currentPage, setCurrentPage] = useState('new-order');
  const [currentOrder, setCurrentOrder] = useState({});
  const [orders, setOrders] = useState({});
  const [toasts, setToasts] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleNewOrder = (orderData) => {
    const orderId = Date.now();
    const total = Object.values(currentOrder).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setOrders(prev => ({
      ...prev,
      [orderId]: {
        id: orderId,
        ...orderData,
        items: { ...currentOrder },
        total,
        status: 'in-process',
        orderTime: new Date().toLocaleString()
      }
    }));
    
    setCurrentOrder({});
    showToast(`Order #${orderId} created successfully!`);
  };

  const handleEditOrder = (orderId) => {
    setEditingOrder(orders[orderId]);
  };

  const handleCompleteOrder = (orderId) => {
    if (confirm(`Mark Order #${orderId} as completed?`)) {
      setOrders(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          status: 'completed',
          completedTime: new Date().toLocaleString()
        }
      }));
      showToast(`Order #${orderId} marked as completed!`);
    }
  };

  const handleViewOrder = (orderId) => {
    const order = orders[orderId];
    if (!order) return;
    
    const itemsList = Object.values(order.items).map(item => 
      `${item.name} x ${item.quantity} - ₹${item.price * item.quantity}`
    ).join('\n');
    
    showToast(`Order #${order.id} Details - Table ${order.tableNumber} - Total: ₹${order.total}`);
  };

  const handleSaveOrderEdit = (orderId, newItems, newTotal) => {
    setOrders(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        items: newItems,
        total: newTotal
      }
    }));
    showToast('Order updated successfully!');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; }
        .fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .bounce-in { animation: bounceIn 0.5s ease-out; }
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out;
        }
      `}</style>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      {currentPage === 'new-order' ? (
        <NewOrderPage
          currentOrder={currentOrder}
          setCurrentOrder={setCurrentOrder}
          showToast={showToast}
        />
      ) : (
        <OrderManagementPage
          orders={orders}
          onEditOrder={handleEditOrder}
          onCompleteOrder={handleCompleteOrder}
          onViewOrder={handleViewOrder}
          showToast={showToast}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleSaveOrderEdit}
          showToast={showToast}
        />
      )}
    </div>
  );
}