import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Printer } from 'lucide-react';
import api, { ordersAPI } from '~/services/api';
import { CardHeader, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import Header from './Header';
import { useNavigate } from 'react-router';
import { io, type Socket } from "socket.io-client";
import printBill from "./printBill";

type Toast = { id: string; message: string };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const push = useCallback(
    (message: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [{ id, message }, ...t]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );
  return { toasts, push, remove };
}

function Toasts({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 w-[90vw] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700/50 cursor-pointer"
          onClick={() => onClose(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

const AdminDashboard = () => {
  const socketRef = useRef<Socket | null>(null);
  const SOCKET_URL = (api.defaults.baseURL as string) || "http://localhost:3000";
  const { toasts, push, remove } = useToasts();

  const [stats, setStats] = useState({
    totalOrders: 0, pending: 0, preparing: 0, completed: 0, cancelled: 0
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<number | null>(null); // New: selected table

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getAll();
      const normalized = res.data.map((o: any) => ({ ...o, items: o.items || [] }));
      setOrders(normalized);
      updateStats(normalized);
    } catch (error) {
      console.error(error);
    }
  };

  const updateStats = (orders: any[]) => {
    setStats({
      totalOrders: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    });
  };

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("OrderStatus", (payload: { waiterId: number; status: string; orderNumber: string }) => {
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.orderNumber === payload.orderNumber ? { ...o, status: payload.status } : o
        )
      );
    });

    s.on("newOrder", (payload: { waiterId: number; order: any }) => {
      const order = { ...payload.order, items: payload.order.items || [] };
      setOrders(prev => {
        const updated = [...prev, order];
        updateStats(updated);
        return updated;
      });
    });

    fetchOrders();
    return () => s.disconnect();
  }, [SOCKET_URL]);

  const getStatusBadge = (status: string) => {
    const base = 'px-2 py-1 rounded text-xs font-medium capitalize';
    switch (status) {
      case 'pending': return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
      case 'preparing': return <span className={`${base} bg-blue-100 text-blue-700`}>Preparing</span>;
      case 'completed': return <span className={`${base} bg-green-100 text-green-700`}>Completed</span>;
      case 'cancelled': return <span className={`${base} bg-red-100 text-red-700`}>Cancelled</span>;
      default: return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
    }
  };

  const calculateTotal = (items: any[]) => items.reduce((total, item) => total + item.totalPrice, 0).toFixed(2);

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const updated = await ordersAPI.updateStatus(orderId.toString(), newStatus);
      setOrders(prev => {
        const updatedOrders = prev.map(o => (o.id === orderId ? { ...o, status: updated.status } : o));
        updateStats(updatedOrders);
        return updatedOrders;
      });
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (error) { console.error(error); }
  };

  const UpdateCash = async (orderId: string) => {
    try {
      const updated = await ordersAPI.submitCash(orderId);
      setOrders(prev => {
        const updatedOrders = prev.map(o => (o.id === orderId ? { ...o, cashCollected: true } : o));
        updateStats(updatedOrders);
        return updatedOrders;
      });
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (error) { console.error(error); }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await ordersAPI.delete(orderId.toString());
      setOrders(prev => {
        const updated = prev.filter(o => o.id !== orderId);
        updateStats(updated);
        return updated;
      });
      setSelectedOrder(null);
    } catch (error) { console.error(error); }
  };

  const navigate = useNavigate();

  // Filter orders based on selected status and table
  const filteredOrders = orders.filter(o => 
    (filterStatus ? o.status === filterStatus : true) &&
    (selectedTable !== null ? o.tableNumber === selectedTable : true)
  );

  // Get unique table numbers
  const tableNumbers = Array.from(new Set(orders.map(o => o.tableNumber))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Header navigate={navigate} />

      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600">Preparing</p>
            <p className="text-3xl font-bold">{stats.preparing}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-3xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-3xl font-bold">{stats.cancelled}</p>
          </div>
        </div>

        {/* Table Boxes */}
        <div className="flex flex-wrap gap-3 mb-4">
          {tableNumbers.map(table => (
            <button
              key={table}
              onClick={() => setSelectedTable(selectedTable === table ? null : table)}
              className={`px-4 py-2 rounded-lg font-semibold border shadow-md ${
                selectedTable === table ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              Table {table}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
            <div>
              <label className="mr-2 font-medium">Filter by status:</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Order ID</th>
                <th className="border p-2 text-left">Waiter</th>
                <th className="border p-2 text-left">Total Items</th>
                <th className="border p-2 text-left">Total Amount</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="border p-2">#{order.orderNumber} T:{order.tableNumber}</td>
                  <td className="border p-2">{order.waiterId}</td>
                  <td className="border p-2">{order.items.length}</td>
                  <td className="border p-2">₹{calculateTotal(order.items)}</td>
                  <td className="border p-2">{getStatusBadge(order.status)}</td>
                  <td className="border p-2 flex gap-2">
                    <button
                      onClick={() => { setSelectedOrder(order); }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <FileText className="w-4 h-4" /> View
                    </button>
                    <button
                     onClick={()=>{printBill(order)}}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Order Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <CardHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
          </CardHeader>
          <p><strong>Waiter:</strong> {selectedOrder?.waiter}</p>
          <p><strong>Status:</strong> {selectedOrder?.status}</p>
          <p><strong>Total Items:</strong> {selectedOrder?.totalItems}</p>
          <p><strong>Total Amount:</strong> ₹{selectedOrder?.totalAmount}</p>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Items:</h4>
            <ul className="space-y-1">
              {selectedOrder?.items?.map((item: any, index: number) => (
                <li key={index} className="flex justify-between border p-2 rounded-md">
                  <span>{item.name} ({item.quantity})</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={() => handleDeleteOrder(selectedOrder.id)}
            >
              Delete Order
            </Button>

            {selectedOrder?.status !== "completed" && (
              <Button onClick={() => handleStatusUpdate(selectedOrder.id, "completed")}>
                Mark as Completed
              </Button>
            )}

            {selectedOrder?.cashCollected===false && (
              <Button onClick={() => UpdateCash(selectedOrder.id)}>
                Mark Cash Collected
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
