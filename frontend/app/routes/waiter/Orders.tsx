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
} from "lucide-react";
import { type Order } from "~/types";
import { menuAPI, ordersAPI } from "~/services/api";
import api from "~/services/api"; // axios instance, used to get baseURL
import { io, type Socket } from "socket.io-client";
import type { MenuItem } from "~/types";
import Header from "~/components/waiter/Header";
import { useNavigate } from "react-router";

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

/* ---------------- ORDERS PAGE ---------------- */
export function OrdersPage({
  onViewOrder,
  orders,
  setIndex,
  setOrderId,
  updateOrder
}: {
  onViewOrder: (order: Order) => void;
  orders: Order[];
  setIndex: (i: number) => void;
  setOrderId:(arg0:number) =>void;
  updateOrder: ()=>void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header2 activeOrders={orders.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Management
          </h1>
          <p className="text-gray-600">Manage and track all restaurant orders</p>
        </div>

        {orders.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order, index) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>Table {order.tableNumber}</span>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-t border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{order.totalAmount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} items
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={order.status==='cancelled' || order.status==='completed'}
                      onClick={()=>{updateOrder(order.id,'cancelled')}}
                      size="sm"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      variant="outline"
                      disabled={order.status==='cancelled' || order.status==='completed'}
                      size="sm"
                      onClick={()=>{updateOrder(order.id,'completed')}}
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
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
  onAdded?: (addedItem: any) => void; // optional callback to let parent update UI
}

/**
 * AddItemToOrderModal
 * - Adds an item to an existing order by ITEM ID (no selection list).
 * - Uses ordersAPI.addItem(orderId, items: MenuItem) to add the item.
 * - Attempts to preview the MenuItem by checking menuAPI.getById (if available) or falling back to menuAPI.getAll().
 *
 * Props:
 *  - orderId: the existing order's id (string) — required
 *  - isOpen: whether modal is visible
 *  - onClose: close handler
 *  - onAdded: optional callback invoked with the payload that was sent after success
 */

const AddItemToOrderModal: React.FC<Props> = ({ orderId, isOpen, onClose, onAdded }) => {
  const [itemId, setItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [preview, setPreview] = useState<MenuItem | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
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
    try {
      let found: any = null;

      // Try single-item endpoint if available
      // (some projects expose menuAPI.getById or menuAPI.get)
      // we'll attempt to call getById if it exists, otherwise fallback to getAll
      // @ts-ignore
      if (typeof menuAPI.getById === "function") {
        try {
          // @ts-ignore
          found = await menuAPI.getById(itemId);
        } catch (err) {
          // ignore and fallback
          found = null;
        }
      }

      if (!found) {
        // fallback to fetching all and searching locally
        const list = await menuAPI.getAll();
        found = list.find((m: any) => String(m.id) === String(itemId) || String(m._id) === String(itemId));
      }
       
      if (found) {
        setPreview(found as MenuItem);
      } else {
        setPreview(null);
        setError("Item not found in menu.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch item preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAdd = async () => {
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
      // Build payload: prefer preview fields if we have them; otherwise send minimal payload
      // The backend signature you gave was: ordersAPI.addItem(id: string, items: MenuItem)
      // We'll attach `quantity` to the object so backend can use it.
      const payload: any = preview
        ? { ...preview, quantity }
        : { id: Number(itemId), menuItemId: itemId, quantity };

        console.log(payload)

      await ordersAPI.addItem(orderId, payload as MenuItem);

      if (onAdded) onAdded(payload);

      // Reset and close modal
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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <input readOnly value={orderId} className="w-full p-3 border rounded bg-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
              <input value={itemId} onChange={(e: any) => setItemId(e.target.value)} placeholder="Enter item ID" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min={1} value={quantity} onChange={(e: any) => setQuantity(Number(e.target.value) || 1)} />
            </div>

            <div className="flex space-x-2">
              <Button onClick={fetchPreview} disabled={loadingPreview}>{loadingPreview ? "Loading..." : "Preview"}</Button>
              <Button onClick={handleAdd} disabled={adding}>{adding ? "Adding..." : "Add to order"}</Button>
              <Button onClick={onClose} variant="ghost">Cancel</Button>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {preview && (
              <div className="mt-4 bg-gray-50 p-3 rounded">
                <div className="flex items-center space-x-3">
                  {preview.image && <img src={preview.image} alt={preview.name} className="w-14 h-14 object-cover rounded" />}
                  <div>
                    <div className="font-semibold">{preview.name}</div>
                    <div className="text-sm">₹{preview.price} • ID: {preview.id ?? preview._id ?? itemId}</div>
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

// export default AddItemToOrderModal;


/* ---------------- ORDER DETAILS ---------------- */
interface EditedItem {
  id: number;
  quantity: number;
}

export function OrderDetailPage({
  order,
  onBack,
  OpenModel,
  orderIndex,
  orders,
  updateOrder,
}: {
  order: Order;
  orderIndex:number
  onBack: () => void;
  orders:Order[];
  OpenModel:(arg0:boolean)=>void;
  updateOrder:()=>void;
}) {
  const [items, setItems] = useState(order.items as any[]);
  const [editedItems, setEditedItems] = useState<EditedItem[]>([]);
  const [totalDelta, setTotalDelta] = useState(0);

  // Keep items in sync if order prop changes (e.g., from socket refresh)
  useEffect(() => {
    setItems(order.items as any[]);
  }, [order.items]);

  const updateQty = useCallback(
    (id: number, delta: number, index: number) => {
      if (items[index].status !== "pending") {
        return alert("You can only update unprepared items");
      }

      setEditedItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === id);
        let updated = [...prev];

        if (existingIndex >= 0) {
          const newQty = Math.max(
            1,
            updated[existingIndex].quantity + delta
          );
          setTotalDelta(
            (curr) =>
              curr +
              (newQty - updated[existingIndex].quantity) *
                (items[index].price || 0)
          );
          updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        } else {
          setTotalDelta((curr) => curr + delta * (items[index].price || 0));
          updated.push({ id, quantity: (items[index].quantity || 0) + delta });
        }

        return updated;
      });
    },
    [items]
  );

  const handleSave = async () => {
    try {
      await ordersAPI.updateItems(order.id as string, editedItems);
      onBack();
    } catch (err) {
      console.error("Failed to save changes:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header2 />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order #{order.orderNumber}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Table {order.tableNumber}</span>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-4 mb-8">
          {orders[orderIndex].items.map((item: any, i: number) => {
            const edited = editedItems.find((e) => e.id === (item.id as number));
            const qty = edited?.quantity ?? item.quantity;
            return (
              <Card
                key={item.id ?? `${item.name}-${i}`}
                className="border-0 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {item.name}
                    </h3>
                    <p className="text-gray-700">
                      ₹{item.price} × {qty} ={" "}
                      <span className="font-semibold">
                        ₹{(item.price || 0) * (qty || 0)}
                      </span>
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQty(item.id as number, -1, i)}
                      className="h-10 w-10 rounded-full hover:bg-red-50 hover:border-red-200"
                      disabled={((qty ?? 1) <= 1)&&(order.status==='cancelled' || order.status==='completed')}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 font-bold text-lg min-w-[3rem] text-center">
                      {qty}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={order.status==='cancelled' || order.status==='completed'}
                      onClick={() => updateQty(item.id as number, 1, i)}
                      className="h-10 w-10 rounded-full hover:bg-green-50 hover:border-green-200"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{(order.totalAmount || 0) + (totalDelta || 0)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={()=>{updateOrder(order.id,'cancelled')}}
                disabled={order.status==='cancelled' || order.status==='completed'}
                className="text-red-600 border-red-200 hover:bg-red-50 px-6"
              >
                <XCircle className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button
                variant="outline"
                disabled={order.status==='cancelled' || order.status==='completed'}
                onClick={()=>{updateOrder(order.id,'completed')}}
                className="text-green-600 border-green-200 hover:bg-green-50 px-6"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Complete
              </Button>
              {editedItems.length > 0 && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              )}
                            <Button
                variant="outline"
                onClick={()=>{OpenModel(true)}}
                disabled={order.status==='cancelled' || order.status==='completed'}
                className="text-green-600 border-green-200 hover:bg-green-50 px-6"
              >
           add new item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- ROOT WITH SOCKET + TOASTS ---------------- */
export default function OrdersWrapper() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderIndex, setOrderIndex] = useState<number>();
  const prevOrdersRef = useRef<Order[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const [orderId,setOrderId] = useState<number>();
  const [isOpen, setIsOpen] = useState(false);

  // Optional callback: update your UI after adding an item
  const handleItemAdded = (item: any) => {
    orders[orderIndex].items.push(item)
  };


  const { toasts, push, remove } = useToasts();

  const SOCKET_URL = (api.defaults.baseURL as string) || "http://localhost:3000";

  // initial load
  useEffect(() => {
    ordersAPI
      .getAll()
      .then((res) => {
        setOrders(res.data);
        console.log(res.data)
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
    async function OrderStatusUpdate(orderId,status){
      try{
        ordersAPI.updateStatus(orderId,status)
      }catch{(e:any)=>{
        console.log(e);
        push('Order '+status+' failed');
      }}
    }
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
    // you can enable these too. Not required for “status updates” so keeping off.
    // s.on("newOrder", async () => await refreshAndDiff());
    // s.on("newItemAddtoOrder", async () => await refreshAndDiff());

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_URL, refreshAndDiff]);

  const navigate=useNavigate()
  return (
    <>
    <Header navigate={navigate}/>
      <Toasts toasts={toasts} onClose={remove} />

      <AddItemToOrderModal
        orderId={orderId }
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdded={handleItemAdded}
      />

      {selectedOrder ? (
        <OrderDetailPage
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          OpenModel={setIsOpen}
          updateOrder={OrderStatusUpdate}
          orderIndex={orderIndex as number}
          orders={orders}
        />
      ) : (
        <OrdersPage
          onViewOrder={setSelectedOrder}
          updateOrder={OrderStatusUpdate}
          orders={orders}
          setIndex={(i) => setOrderIndex(i)}
          setOrderId={setOrderId}
        />
      )}
    </>
  );
}
