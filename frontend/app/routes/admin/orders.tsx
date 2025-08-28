import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "~/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { ordersAPI } from "~/services/api";
import Header from "./Header";
import { useNavigate } from "react-router";
import printBill from "./printBill";

export default function OrdersPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch orders dynamically
  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getOrdersByDate(startDate, endDate, status);
      setOrders(res);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

// Updated handleStatusUpdate
const handleStatusUpdate = async (orderId: number, newStatus: string) => {
  try {
    // Call API to update
    const updatedOrder = await ordersAPI.updateStatus(orderId.toString(), newStatus);

    // Ensure id is number
    const updatedId = typeof updatedOrder.id === 'string' ? parseInt(updatedOrder.id) : updatedOrder.id;

    // Update orders array
    setOrders(prev =>
      prev.map(order =>
        order.id === updatedId ? { ...order, status: updatedOrder.status } : order
      )
    );

    // Update modal if it's the same order
    setSelectedOrder(prev => {
      if (!prev) return prev;
      const prevId = typeof prev.id === 'string' ? parseInt(prev.id) : prev.id;
      return prevId === updatedId ? { ...prev, status: updatedOrder.status } : prev;
    });

  } catch (error) {
    console.error("Failed to update status:", error);
  }
};


  // Delete order
  const handleDeleteOrder = async (orderId: number | string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await ordersAPI.delete(orderId.toString());

      // Remove from table
      setOrders(prev => prev.filter(order => order.id !== parseInt(orderId.toString())));
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (status && order.status !== status) return false;
    return true;
  });
  const navigate=useNavigate();
  return (
    <div className="flex">
      {/* Sidebar */}
      <Header navigate={navigate}/>
      

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Filter Orders</h3>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchOrders}>Filter</Button>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Orders</h3>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Order ID</th>
                  <th className="border p-2 text-left">Total Items</th>
                  <th className="border p-2 text-left">Total Amount</th>
                  <th className="border p-2 text-left">Waiter</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="border p-2">{order.id}</td>
                    <td className="border p-2">{order.totalItems}</td>
                    <td className="border p-2">₹{order.totalAmount}</td>
                    <td className="border p-2">{order.waiter}</td>
                    <td className="border p-2 capitalize">{order.status}</td>
                    <td className="border p-2 space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>View</Button>
                      <Button size="sm" onClick={()=>{printBill(order)}}>Print Bill</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      {/* View Order Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <CardHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
          </CardHeader>

          <p><strong>Waiter:</strong> {selectedOrder?.waiter}</p>
          <p><strong>Status:</strong> {selectedOrder?.status}</p>
          <p><strong>Total Items:</strong> {selectedOrder?.totalItems}</p>
          <p><strong>Total Amount:</strong> ₹{selectedOrder?.totalAmount}</p>

          {/* List all items */}
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
              <Button
                onClick={() => handleStatusUpdate(selectedOrder.id, "completed")}
              >
                Mark as Completed
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
