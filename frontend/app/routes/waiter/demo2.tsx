'use client';
// import Header from "~/components/waiter/Header";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Plus, Minus, Clock, MapPin, ChefHat, CheckCircle, XCircle, Eye, ArrowLeft } from "lucide-react";

// Mock Header component
function Header() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900">Restaurant Manager</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              2 Active Orders
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}

// Mock data
const orders = [
  { id: 1, total: 550, status: "pending", table: 5, time: "15:30", items: 2 },
  { id: 2, total: 320, status: "pending", table: 8, time: "15:45", items: 2 },
];

const orderDetails = {
  1: [
    { id: 1, name: "Paneer Tikka", price: 150, qty: 2, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=100&h=100&fit=crop&crop=center", category: "Appetizer" },
    { id: 2, name: "Butter Naan", price: 50, qty: 5, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=100&h=100&fit=crop&crop=center", category: "Bread" },
  ],
  2: [
    { id: 3, name: "Chicken Biryani", price: 200, qty: 1, image: "https://images.unsplash.com/photo-1563379091339-03246963d25a?w=100&h=100&fit=crop&crop=center", category: "Main Course" },
    { id: 4, name: "Raita", price: 40, qty: 3, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100&h=100&fit=crop&crop=center", category: "Side Dish" },
  ],
};

// Status Badge Component
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    preparing: { color: "bg-blue-100 text-blue-800", icon: ChefHat },
    ready: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const IconComponent = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1 px-3 py-1`}>
      <IconComponent className="w-3 h-3" />
      <span className="capitalize font-medium">{status}</span>
    </Badge>
  );
}

// Orders List Page
export function OrdersPage({ onViewOrder }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Manage and track all restaurant orders</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Order #{order.id}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>Table {order.table}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{order.time}</span>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-3 border-t border-gray-100">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">₹{order.total}</p>
                    <p className="text-sm text-gray-500">{order.items} items</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => onViewOrder(order.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {orders.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Orders will appear here when customers place them.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Order Detail Page
export function OrderDetailPage({ orderId, onBack }) {
  const [items, setItems] = useState(orderDetails[orderId] || []);
  const [edited, setEdited] = useState(false);

  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      ).filter(item => item.qty > 0)
    );
    setEdited(true);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order = orders.find((o) => o.id === orderId);
  const tableNo = order?.table || "-";
  const orderTime = order?.time || "-";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{orderId}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Table {tableNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{orderTime}</span>
                </div>
              </div>
            </div>
            <StatusBadge status="pending" />
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-xl object-cover shadow-sm" 
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                      <p className="text-gray-700">
                        ₹{item.price} × {item.qty} = <span className="font-semibold">₹{item.price * item.qty}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => updateQty(item.id, -1)}
                      className="h-10 w-10 rounded-full hover:bg-red-50 hover:border-red-200"
                      disabled={item.qty <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 font-bold text-lg min-w-[3rem] text-center">
                      {item.qty}
                    </span>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => updateQty(item.id, 1)}
                      className="h-10 w-10 rounded-full hover:bg-green-50 hover:border-green-200"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">₹{totalAmount}</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 px-6"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
                <Button 
                  variant="outline" 
                  className="text-green-600 border-green-200 hover:bg-green-50 px-6"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Order
                </Button>
                {edited && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  >
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Root Wrapper Component
export default function OrdersWrapper() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return selectedOrder ? (
    <OrderDetailPage orderId={selectedOrder} onBack={() => setSelectedOrder(null)} />
  ) : (
    <OrdersPage onViewOrder={setSelectedOrder} />
  );
}
// import React, { useState } from "react";
// import { Card, CardHeader, CardContent } from "~/components/ui/card";
// import { Button } from "~/components/ui/button";
// import { ChevronDown, ChevronUp, XCircle, CheckCircle } from "lucide-react";

// type OrderItem = {
//   id: number;
//   name: string;
//   qty: number;
// };

// type Order = {
//   id: number;
//   tableNo: string;
//   amount: number;
//   items: OrderItem[];
// };

// const orders: Order[] = [
//   {
//     id: 101,
//     tableNo: "T1",
//     amount: 850,
//     items: [
//       { id: 1, name: "Paneer Butter Masala", qty: 2 },
//       { id: 2, name: "Garlic Naan", qty: 4 },
//       { id: 3, name: "Jeera Rice", qty: 1 },
//     ],
//   },
//   {
//     id: 102,
//     tableNo: "T2",
//     amount: 450,
//     items: [
//       { id: 1, name: "Chicken Biryani", qty: 1 },
//       { id: 2, name: "Raita", qty: 1 },
//     ],
//   },
//   {
//     id: 103,
//     tableNo: "T3",
//     amount: 1200,
//     items: [
//       { id: 1, name: "Mutton Rogan Josh", qty: 2 },
//       { id: 2, name: "Butter Naan", qty: 6 },
//     ],
//   },
// ];

// const ChefDashboard: React.FC = () => {
//   const [expandedOrder, setExpandedOrder] = useState<number | null>(
//     orders[0]?.id || null
//   );

//   const toggleExpand = (orderId: number) => {
//     setExpandedOrder(expandedOrder === orderId ? null : orderId);
//   };

//   return (
//     <div className="p-4 max-w-3xl mx-auto space-y-4">
//       <h1 className="text-2xl font-bold mb-4 text-center">Chef Dashboard</h1>

//       {orders.map((order) => (
//         <Card key={order.id} className="shadow-md rounded-2xl border">
//           <CardHeader
//             className="flex flex-row items-center justify-between cursor-pointer"
//             onClick={() => toggleExpand(order.id)}
//           >
//             <div>
//               <h2 className="text-lg font-semibold">
//                 Order #{order.id} - Table {order.tableNo}
//               </h2>
//               <p className="text-sm text-gray-500">Amount: ₹{order.amount}</p>
//             </div>
//             <div className="flex gap-2">
//               <Button variant="destructive" size="sm" className="flex items-center gap-1">
//                 <XCircle className="w-4 h-4" /> Cancel All
//               </Button>
//               <Button variant="default" size="sm" className="flex items-center gap-1">
//                 <CheckCircle className="w-4 h-4" /> Prepare All
//               </Button>
//               {expandedOrder === order.id ? (
//                 <ChevronUp className="w-5 h-5 mt-1" />
//               ) : (
//                 <ChevronDown className="w-5 h-5 mt-1" />
//               )}
//             </div>
//           </CardHeader>

//           {expandedOrder === order.id && (
//             <CardContent className="space-y-3">
//               {order.items.map((item) => (
//                 <div
//                   key={item.id}
//                   className="flex justify-between items-center border-b pb-2"
//                 >
//                   <div>
//                     <p className="font-medium">{item.name}</p>
//                     <p className="text-sm text-gray-500">Qty: {item.qty}</p>
//                   </div>
//                   <div className="flex gap-2">
//                     <Button
//                       variant="destructive"
//                       size="sm"
//                       className="flex items-center gap-1"
//                     >
//                       <XCircle className="w-4 h-4" /> Cancel
//                     </Button>
//                     <Button
//                       variant="default"
//                       size="sm"
//                       className="flex items-center gap-1"
//                     >
//                       <CheckCircle className="w-4 h-4" /> Prepare
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           )}
//         </Card>
//       ))}
//     </div>
//   );
// };

// export default ChefDashboard;

