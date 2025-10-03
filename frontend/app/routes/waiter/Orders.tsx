"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Plus,
  Minus,
  Clock,
  MapPin,
  ChefHat,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Edit3,
  Save,
  Trash2,
} from "lucide-react";
import { type Order } from "~/types";
import { menuAPI, ordersAPI } from "~/services/api";
import api from "~/services/api"; // axios instance, used to get baseURL
import { io, type Socket } from "socket.io-client";
import type { MenuItem } from "~/types";
import Header from "~/components/waiter/Header";
import { useNavigate } from "react-router";
import { set } from "zod";

/* =============== Tiny Toasts (no library) =============== */
type Toast = { id: string; message: string };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const push = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [{ id, message }, ...t]);
    // auto-dismiss
    setTimeout(() => remove(id), 4000);
  }, [remove]);
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
          role="status"
          aria-live="polite"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ---------------- CONFIRMATION MODAL ---------------- */
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmColor?: string;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor = "bg-red-600 hover:bg-red-700"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                className={`px-6 text-white ${confirmColor}`}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- HEADER ---------------- */
function Header2({ activeOrders = 0 }: { activeOrders?: number }) {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900">
            Restaurant Manager
          </h1>
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800"
          >
            {activeOrders} Active Orders
          </Badge>
        </div>
      </div>
    </header>
  );
}

/* ---------------- STATUS BADGE ---------------- */
function StatusBadge({ status }: { status: string }) {
  const config = useMemo(() => {
    const statusConfig: Record<
      string,
      { color: string; icon: React.ElementType }
    > = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      preparing: { color: "bg-blue-100 text-blue-800", icon: ChefHat },
      ready: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    return statusConfig[status] ?? statusConfig.pending;
  }, [status]);

  const Icon = config.icon;
  return (
    <Badge className={`${config.color} flex items-center gap-1 px-3 py-1`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize font-medium">{status}</span>
    </Badge>
  );
}

/* ---------------- EDITED ITEM INTERFACE ---------------- */
interface EditedItem {
  id: number;
  quantity: number;
}

/* ---------------- ORDERS PAGE ---------------- */
export function OrdersPage({
  onViewOrder,
  orders,
  setIndex,
  setOrderId,
  updateOrder,
  updateItems,
  push
}: {
  onViewOrder: (order: Order) => void;
  orders: Order[];
  setIndex: (i: number) => void;
  setOrderId: (arg0: number) => void;
  updateOrder: (orderId: number, status: string) => void;
  updateItems: (orderId: string,  items: EditedItem[],tableNumber: any) => Promise<void>;
  push: (message: string) => void;
}) {
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [editedItems, setEditedItems] = useState<{ [key: string]: number }>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    orderId?: number;
    action?: 'complete' | 'cancel';
  }>({ isOpen: false });

  const handleEditToggle = (orderId: number) => {
    if (editingOrderId === orderId) {
      // Cancel editing
      setEditingOrderId(null);
      setEditedItems({});
    } else {
      // Start editing
      setEditingOrderId(orderId);
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const initial: { [key: string]: number } = {};
        order.items.forEach((item: any) => {
          const key = `${orderId}-${item.id || item.name}`;
          initial[key] = item.quantity;
        });
        setEditedItems(initial);
      }
    }
  };

  const handleQuantityChange = (orderId: number, itemId: string, newQuantity: number) => {
    const key = `${orderId}-${itemId}`;
    setEditedItems(prev => ({
      ...prev,
      [key]: Math.max(0, newQuantity)
    }));
  };

  const handleSaveChanges = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updates: EditedItem[] = [];

      order.items.forEach((item: any) => {
        const key = `${orderId}-${item.id || item.name}`;
        const newQuantity = editedItems[key];
        if (newQuantity !== undefined) {
          updates.push({
            id: item.id || item.menuItemId,
            quantity: newQuantity
          });
        }
      });

      await updateItems(orderId.toString(), updates, tableNumber);
      setEditingOrderId(null);
      setEditedItems({});
      push("Order items updated successfully!");
    } catch (error) {
      console.error("Failed to update items:", error);
      push("Failed to update order items");
    }
  };

  const handleOrderAction = (orderId: number, action: 'complete' | 'cancel') => {
    setConfirmModal({
      isOpen: true,
      orderId,
      action
    });
  };

  const handleConfirmAction = () => {
    if (confirmModal.orderId && confirmModal.action) {
      const status = confirmModal.action === 'complete' ? 'completed' : 'cancelled';
      updateOrder(confirmModal.orderId, status);
    }
    setConfirmModal({ isOpen: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header2 activeOrders={orders.length} />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={handleConfirmAction}
        title={`${confirmModal.action === 'complete' ? 'Complete' : 'Cancel'} Order`}
        message={`Are you sure you want to ${confirmModal.action} this order? This action cannot be undone.`}
        confirmText={confirmModal.action === 'complete' ? 'Complete Order' : 'Cancel Order'}
        confirmColor={confirmModal.action === 'complete' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Management
          </h1>
          <p className="text-gray-600">Manage and track all restaurant orders</p>
        </div>

        {orders.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order, index) => {
              const isEditing = editingOrderId === order.id;

              return (
                <Card
                  key={order.id}
                  className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">
                          Table #{order.tableNumber}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>Order {order.orderNumber}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditToggle(order.id)}
                          disabled={order.status === 'cancelled' || order.status === 'completed'}
                          className="p-2"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <ul className="space-y-2 px-4">
                    {order.items.map((o: any, i) => {
                      const key = `${order.id}-${o.id || o.name}`;
                      const currentQuantity = isEditing ? editedItems[key] || o.quantity : o.quantity;

                      let statusStyles = "bg-red-400 text-white"; // default pending
                      let statusLetter = "P";

                      if (o.status === "ready") {
                        statusStyles = "bg-green-500 text-white";
                        statusLetter = "R";
                      } else if (o.status === "preparing") {
                        statusStyles = "bg-red-500 text-white";
                        statusLetter = "P"; // still P but yellow
                      }
                      return (
                        <li key={i} className="flex items-center gap-2 font-semibold text-gray-800">
                          {/* Status Circle */}
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${statusStyles}`}
                          >
                            {statusLetter}
                          </span>

                          {/* Item name */}
                          <span className="flex-1">{o.name}</span>

                          {/* Quantity controls or display */}
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuantityChange(order.id, o.id || o.name, currentQuantity - 1)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 text-sm"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm">{currentQuantity}</span>
                              <button
                                onClick={() => handleQuantityChange(order.id, o.id || o.name, currentQuantity + 1)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 text-sm"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              {currentQuantity === 0 && (
                                <Trash2 className="w-4 h-4 text-red-500 ml-1" />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm">x {currentQuantity}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-t border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{order.totalAmount}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items.length} items
                      </p>
                    </div>

                    <p><b>Note:</b> {order.notes}</p>

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <label className="text-sm font-medium">Table No:</label>
                            <input
                              type="text"
                              value={tableNumber ?? order.tableNumber} // use fallback if tableNumber is null/undefined
                              onChange={(e) => {
                                let val = e.target.value.toString()
                                val = val.replace(/\D/g, "");
                                setTableNumber(Number(val));
                              }}
                              className="border border-gray-300 rounded-md p-1 w-16"
                            />
                          </div>

                          <Button
                            onClick={() => handleSaveChanges(order.id)}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleEditToggle(order.id)}
                            size="sm"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            disabled={order.status === 'cancelled' || order.status === 'completed' || order.status === 'ready' || order.status === 'preparing'}
                            onClick={() => handleOrderAction(order.id, 'cancel')}
                            size="sm"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Cancel
                          </Button>
                          <Button
                            variant="outline"
                            disabled={order.status === 'cancelled' || order.status === 'completed'}
                            size="sm"
                            onClick={() => handleOrderAction(order.id, 'complete')}
                            className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Complete
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              onViewOrder(order);
                              setIndex(index);
                              setOrderId(order.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" /> add item
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-500">
              Orders will appear here when customers place them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (addedItem: any) => void;
  menu: MenuItem[];
}

const AddItemToOrderModal: React.FC<Props> = ({ orderId, isOpen, onClose, onAdded, menu }) => {
  const [itemId, setItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [preview, setPreview] = useState<MenuItem | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus on Item ID input when modal opens
      setTimeout(() => itemInputRef.current?.focus(), 100);
    } else {
      setItemId("");
      setQuantity(1);
      setPreview(null);
      setError(null);
      setLoadingPreview(false);
      setAdding(false);
    }
  }, [isOpen]);

  const fetchPreview = async () => {
    setError(null);
    if (!itemId) {
      setError("Please enter an item id");
      return;
    }

    setLoadingPreview(true);
    let p = menu.find((obj) => obj.itemNumber === Number(itemId)) ?? null;
    setPreview(p);
    setLoadingPreview(false);
    return;
  };

  const handleAdd = async () => {
    await fetchPreview();
    setError(null);

    if (!itemId) {
      setError("Enter item id.");
      return;
    }
    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setAdding(true);
    try {
      const payload: any = preview
        ? { ...preview, quantity }
        : { id: Number(itemId), menuItemId: itemId, quantity };

      console.log(payload);

      await ordersAPI.addItem(orderId, payload as MenuItem);

      if (onAdded) onAdded(payload);

      setItemId("");
      setQuantity(1);
      setPreview(null);
      onClose();
    } catch (err) {
      console.error("Failed to add item to order", err);
      setError("Failed to add item to order.");
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add Item to Order</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <input readOnly value={orderId} className="w-full p-3 border rounded bg-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
              <input
                ref={itemInputRef}
                value={itemId}
                onChange={(e: any) => {
                  setItemId(e.target.value);
                  fetchPreview();
                }}
                placeholder="Enter item ID"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e: any) => setQuantity(Number(e.target.value) || 1)}
                  className="w-16 text-center border rounded p-1"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={fetchPreview} disabled={loadingPreview}>
                {loadingPreview ? "Loading..." : "Preview"}
              </Button>
              <Button onClick={handleAdd} disabled={adding}>
                {adding ? "Adding..." : "Add to order"}
              </Button>
              <Button onClick={onClose} variant="ghost">
                Cancel
              </Button>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {preview && (
              <div className="mt-4 bg-gray-50 p-3 rounded">
                <div className="flex items-center space-x-3">
                  {preview.image && (
                    <img src={preview.image} alt={preview.name} className="w-14 h-14 object-cover rounded" />
                  )}
                  <div>
                    <div className="font-semibold">{preview.name}</div>
                    <div className="text-sm">
                      ₹{preview.price} • ID: {preview.id ?? preview._id ?? itemId}
                    </div>
                    <div className="text-sm text-gray-600">Subtotal: ₹{(preview.price || 0) * quantity}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ---------------- ROOT WITH SOCKET + TOASTS ---------------- */
export default function OrdersWrapper() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderIndex, setOrderIndex] = useState<number>();
  const prevOrdersRef = useRef<Order[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  const [orderId, setOrderId] = useState<number>();
  const [isOpen, setIsOpen] = useState(false);

  // Optional callback: update your UI after adding an item
  const handleItemAdded = (item: any) => {
    if (orderIndex !== undefined) {
      orders[orderIndex].items.push(item);
    }
  };

  const { toasts, push, remove } = useToasts();

  const SOCKET_URL = (api.defaults.baseURL as string);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuAPI.getAll();
        setMenu(data);
      } catch (error) {
        console.error("Failed to load menu:", error);
      }
    };

    fetchMenu();
  }, []);

  // initial load
  useEffect(() => {
    ordersAPI
      .getAll()
      .then((res) => {
        setOrders(res.data);
        console.log(res.data);
        prevOrdersRef.current = res.data;
      })
      .catch((err) => console.error("Failed to load orders:", err));
  }, []);

  // helper: refresh + diff to identify what changed
  const refreshAndDiff = useCallback(
    async (hintStatus?: string, isItemEvent?: boolean) => {
      try {
        const res = await ordersAPI.getAll();
        const next = res.data;
        const prev = prevOrdersRef.current;

        // update UI states
        setOrders(next);
        prevOrdersRef.current = next;

        // update selected order details if open
        if (selectedOrder) {
          const updatedSelected = next.find((o) => o.id === selectedOrder.id);
          if (updatedSelected) {
            setSelectedOrder(updatedSelected);
          }
        }

        // --- Diff to produce toast message (best-effort) ---
        // Find order status change
        let orderMsg: string | null = null;
        let itemMsg: string | null = null;

        // Build prev map by id
        const prevMap = new Map<string, Order>();
        for (const o of prev) prevMap.set(o.id as string, o);

        // Find changed order first (status)
        for (const o of next) {
          const p = prevMap.get(o.id as string);
          if (p && p.status !== o.status) {
            if (!hintStatus || o.status === hintStatus) {
              orderMsg = `Order #${o.orderNumber} status is ${o.status}`;
              break;
            }
          }
        }

        // If item event or no order status change found, check item changes
        if (isItemEvent || !orderMsg) {
          for (const o of next) {
            const p = prevMap.get(o.id as string);
            if (!p) continue;

            // Map items by id (fallback to name if id missing)
            const pItemsByKey = new Map<string, any>();
            (p.items as any[]).forEach((it: any, idx: number) => {
              const key = (it?.id ?? `${it?.name}-${idx}`) as string;
              pItemsByKey.set(String(key), it);
            });

            for (let idx = 0; idx < (o.items as any[]).length; idx++) {
              const it = (o.items as any[])[idx] as any;
              const key = String(it?.id ?? `${it?.name}-${idx}`);
              const prevIt = pItemsByKey.get(key);
              if (prevIt && prevIt.status !== it.status) {
                if (!hintStatus || it.status === hintStatus) {
                  itemMsg = `Order #${o.orderNumber} → "${it.name}" is ${it.status}`;
                  break;
                }
              }
            }
            if (itemMsg) break;
          }
        }

        if (itemMsg) push(itemMsg);
        else if (orderMsg) push(orderMsg);

      } catch (err) {
        console.error("Refresh after socket event failed:", err);
      }
    },
    [push, selectedOrder]
  );

  // socket setup
  async function OrderStatusUpdate(orderId: number, status: string) {
    try {
      await ordersAPI.updateStatus(orderId, status);
    } catch (e: any) {
      console.log(e);
      push('Order ' + status + ' failed');
    }
  }

  // Update items function
  const updateItems = async (orderId: string, items: EditedItem[], tableNumber: any) => {
    try {
      await ordersAPI.updateItems(orderId, items, tableNumber );
      // Refresh orders after update
      const res = await ordersAPI.getAll();
      setOrders(res.data);
      prevOrdersRef.current = res.data;
    } catch (error) {
      console.error("Failed to update items:", error);
      throw error;
    }
  };

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      // If you later add auth, pass token here:
      // auth: { token: typeof window !== "undefined" ? localStorage.getItem("token") : undefined }
    });
    socketRef.current = s;

    // === Listen to backend events exactly as emitted ===
    // Order status updated
    s.on("OrderStatus", async (payload: { waiterId: number; status: string }) => {
      // Payload has no order id → refresh & diff
      await refreshAndDiff(payload?.status, false);
    });

    // Item status updated
    s.on("ItemStatus", async (payload: { waiterId: number; status: string }) => {
      await refreshAndDiff(payload?.status, true);
    });

    // Optional: if you want to react to new order or item-added events in waiter UI,
    // you can enable these too. Not required for "status updates" so keeping off.
    // s.on("newOrder", async () => await refreshAndDiff());
    // s.on("newItemAddtoOrder", async () => await refreshAndDiff());

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_URL, refreshAndDiff]);

  const navigate = useNavigate();
  return (
    <>
      <Header navigate={navigate} />
      <Toasts toasts={toasts} onClose={remove} />

      <AddItemToOrderModal
        orderId={orderId?.toString() || ""}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdded={handleItemAdded}
        menu={menu}
      />

      <OrdersPage
        onViewOrder={() => setIsOpen(true)}
        updateOrder={OrderStatusUpdate}
        updateItems={updateItems}
        orders={orders}
        setIndex={(i) => setOrderIndex(i)}
        setOrderId={setOrderId}
        push={push}
      />
    </>
  );
}