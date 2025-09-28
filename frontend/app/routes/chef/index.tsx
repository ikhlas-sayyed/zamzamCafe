import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CheckCircle, XCircle, Eye, MapPin, X } from "lucide-react";
import api, { ordersAPI } from "~/services/api";
import type { Order } from "~/types";
import Header from "./header";
import { useNavigate } from "react-router-dom";


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

type Id = string;
function toId(x: string | number | undefined | null) {
    if (x === undefined || x === null) return "";
    return String(x);
}

const OrderCircle: React.FC<{ o: any; onClick: () => void }> = ({ o, onClick }) => {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (completed) return; // stop timer if completed

    const updateProgress = () => {
      const updatedAt = new Date(o.updatedAt).getTime();
      const now = Date.now();
      const diffMinutes = (now - updatedAt) / 1000 / 60;
      if(diffMinutes>10){
        setCompleted(true)
      }
      const p = Math.min(diffMinutes / 5, 1); // 0 → 1 in 5 mins
      setProgress(p);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [o.updatedAt, completed]);

  const size = 64;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const handleClick = () => {
    setCompleted(true);
    setProgress(1); // instantly full
    onClick(); // still trigger parent action
  };

  return (
    <button
      onClick={handleClick}
      title={`Order #${o.orderNumber ?? o.id} — Table ${o.tableNumber}`}
      className={`w-16 h-16 border border-white rounded-full relative flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors duration-300 ${
        completed ? "bg-red-600 text-white" : (!completed? '' :"bg-green-200")
      }`}
    >
      {/* Progress ring */}
      {!completed && (
        <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="red"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="relative z-10 text-black">{o.orderNumber ?? o.id}</span>
    </button>
  );
};

export default function ChefDashboardNewUI() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [openedOrderIds, setOpenedOrderIds] = useState<Set<Id>>(new Set());
    const [newItemsForOrder, setNewItemsForOrder] = useState<Record<Id, boolean>>({});
    const seenOrderIds = useRef<Set<Id>>(new Set());
    const seenItemIds = useRef<Set<Id>>(new Set());
    const socketRef = useRef<Socket | null>(null);
    const navigate = useNavigate();
    
    const { toasts, push, remove } = useToasts();

    // --- load initial orders
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data } = await ordersAPI.getAll();
                if (!mounted) return;

                const orderIds = new Set<Id>();
                const itemIds = new Set<Id>();
                data.forEach((o) => {
                    orderIds.add(o.id);
                    o.items.forEach((it: any) => {
                        const iid = toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
                        itemIds.add(iid);
                    });
                });
                seenOrderIds.current = orderIds;
                seenItemIds.current = itemIds;

                const ni: Record<Id, boolean> = {};
                data.forEach((o) => (ni[o.id] = false));
                setNewItemsForOrder(ni);

                setOrders(data.filter((o) => o.status !== "ready"));
            } catch (e) {
                console.error("Failed to load orders:", e);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);
    
    const SOCKET_URL = api.defaults.baseURL

    async function refreshOrdersAndSyncFlags() {
        try {
            const { data } = await ordersAPI.getAll();
            data.forEach((o) => o.items.forEach((it: any) => seenItemIds.current.add(toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`))));
            const visible = data.filter((o) => o.status !== "ready");
            setOrders(visible);
            
            // Remove orders that are now ready from opened list
            setOpenedOrderIds((prev) => {
                const newSet = new Set(prev);
                Array.from(prev).forEach((id) => {
                    const order = data.find((d) => d.id === id);
                    if (!order || order.status === "ready") {
                        newSet.delete(id);
                    }
                });
                return newSet;
            });
        } catch (e) {
            console.error("Failed refreshOrdersAndSyncFlags:", e);
        }
    }

    // --- socket wiring
    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("newOrder", ({ order }: { order: any }) => {
            if (order.status !== "ready") {
                setOrders((prev) => {
                    // keep unique by id and add new orders at the beginning
                    const filtered = prev.filter((p) => p.id !== order.id);
                    return [order, ...filtered]; // prepend at the beginning
                });

                setNewItemsForOrder((prev) => ({ ...prev, [order.id]: false }));
            }
            seenOrderIds.current.add(toId(order.id));
            order.items.forEach((it: any) => seenItemIds.current.add(toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`)));
        });

        socket.on("OrderStatus", refreshOrdersAndSyncFlags);
        socket.on("ItemStatus", refreshOrdersAndSyncFlags);
        
        socket.on("updateItem", async (e) => {
            await refreshOrdersAndSyncFlags();
            push("Order #" + e.orderNumber + " qty change");
        });
        
        socket.on("newItemAddtoOrder", async () => {
            const { data } = await ordersAPI.getAll();
            const nextNewFlags: Record<Id, boolean> = { ...newItemsForOrder };
            data.forEach((o) => {
                let anyNew = false;
                o.items.forEach((it: any) => {
                    const iid = toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
                    if (!seenItemIds.current.has(iid)) {
                        anyNew = true;
                        seenItemIds.current.add(iid);
                    }
                });
                if (anyNew) nextNewFlags[o.id] = true;
            });
            setOrders(data.filter((o) => o.status !== "ready"));
            setNewItemsForOrder(nextNewFlags);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [push]);

    // Get opened orders from current orders data (always fresh)
    const openedOrders = useMemo(() => {
        return orders.filter((o) => openedOrderIds.has(o.id));
    }, [orders, openedOrderIds]);

    const queueOrders = useMemo(() => {
        return orders.filter((o) => o.status !== "ready" && !openedOrderIds.has(o.id));
    }, [orders, openedOrderIds]);

    const openOrderCard = async (orderId: Id) => {
        const order = orders.find((o) => o.id === orderId);
        if (!order) return;

        // Add to opened set
        setOpenedOrderIds((prev) => new Set([...prev, orderId]));
        setNewItemsForOrder((prev) => ({ ...prev, [orderId]: false }));

        // Update items to preparing status
        const toUpdate = order.items.filter((it) => it.status !== "ready" && it.status !== "preparing");
        await Promise.all(toUpdate.map((it) => ordersAPI.updateItemStatus(orderId, (it as any).id, "preparing").catch(console.error)));
        await refreshOrdersAndSyncFlags();
    };

    const closeOrderCard = (orderId: Id) => {
        setOpenedOrderIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(orderId);
            return newSet;
        });
    };

    const handleMarkItemReady = async (orderId: Id, itemId: number | string) => {
        try {
            await ordersAPI.updateItemStatus(orderId, itemId, "ready");
            await refreshOrdersAndSyncFlags();
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkAllReady = async (orderId: Id) => {
        const order = orders.find((o) => o.id === orderId);
        if (!order) return;
        const targets = order.items.filter((it: any) => it.status !== "ready");
        await Promise.all(targets.map((it) => ordersAPI.updateItemStatus(orderId, (it as any).id, "ready").catch(console.error)));
        await refreshOrdersAndSyncFlags();
        setOpenedOrderIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(orderId);
            return newSet;
        });
    };

    function getCircleClassForOrder(o: Order) {
        if (o.status === "ready") return "hidden";
        if (newItemsForOrder[o.id]) return "bg-blue-500 text-white shadow-lg ring-2 ring-blue-200";
        if ((o as any).tableNumber && Number((o as any).tableNumber) !== 0) return "bg-emerald-500 text-white shadow-lg";
        return "bg-slate-400 text-white shadow-md";
    }

    function OrderCard({ order }: { order: Order }) {
        const itemsReadyCount = order.items.filter((it: any) => it.status === "ready").length;
        const allItemsReady = itemsReadyCount === order.items.length;

        // --- New state for progress ---
        const [progress, setProgress] = useState(0); // 0 → 1

        useEffect(() => {
            if (allItemsReady) return; // stop timer if all ready

            const updateProgress = () => {
                const updatedAt = new Date(order.updatedAt).getTime();
                const now = Date.now();
                const minutes = (now - updatedAt) / 1000 / 60;
                const p = Math.min(minutes / 10, 1); // 0 → 1 in 10 minutes
                setProgress(p);
            };

            updateProgress();
            const interval = setInterval(updateProgress, 1000); // update every second
            return () => clearInterval(interval);
        }, [order.updatedAt, allItemsReady]);

        return (
            <Card className="w-80 hover:shadow-2xl mx-6 transition-all duration-300 border-0 shadow-lg bg-white rounded-xl overflow-hidden">
                <CardHeader className="pb-3 text-black relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => closeOrderCard(order.id)}
                        className="absolute top-2 right-2 p-1 h-8 w-8 hover:bg-white/20 text-black rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <div className="flex justify-between items-start w-full pr-10">
                        <div>
                            <CardTitle className="text-lg font-bold tracking-wide">
                                Table #{order.tableNumber}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>order {order.orderNumber}</span>
                            </div>
                        </div>
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                allItemsReady ? "bg-green-500 text-white" : "bg-yellow-400 text-gray-900"
                            } shadow-sm`}
                        >
                            {itemsReadyCount}/{order.items.length} ready
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                    {order.items.map((o, i) => {
                        let statusStyles = "bg-gray-400 text-white";
                        let statusIcon = "P";
                        if (o.status === "ready") {
                            statusStyles = "bg-emerald-500 text-white shadow-md";
                            statusIcon = "✓";
                        } else if (o.status === "preparing") {
                            statusStyles = "bg-amber-500 text-white shadow-md";
                            statusIcon = "⏱";
                        }

                        return (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${statusStyles}`}
                                    >
                                        {statusIcon}
                                    </div>
                                    <div className="text-gray-800 font-medium text-sm">
                                        {o.name} <span className="text-gray-500 font-normal">x{o.quantity}</span>
                                    </div>
                                </div>
                                {o.status !== "ready" && (
                                    <Button
                                        size="sm"
                                        onClick={() => handleMarkItemReady(order.id, (o as any).id)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md rounded-md transition-colors duration-200 text-xs"
                                    >
                                        Mark Ready
                                    </Button>
                                )}
                            </div>
                        );
                    })}

                    <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3 mb-4">
                        <p className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                            {order.items.length} items
                        </p>
                    </div>
                    <p><b>note :</b>{order.notes}</p>

                    {/* --- Mark All Ready Button with dynamic red fill --- */}
                    <Button
                        size="lg"
                        onClick={() => handleMarkAllReady(order.id)}
                        disabled={allItemsReady}
                        className={`w-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl relative overflow-hidden`}
                        style={{
                            background: allItemsReady
                                ? "gray"
                                : `linear-gradient(to right, red ${progress * 100}%, #10b981 ${progress * 100}%)`,
                        }}
                    >
                        <span className="relative z-10">
                            {allItemsReady ? "All Items Ready ✓" : "Mark All Ready"}
                        </span>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
            <Toasts toasts={toasts} onClose={remove} />
            <Header navigate={navigate} />
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Kitchen Dashboard — Queue</h1>
                    <Badge variant="secondary" className="text-sm">
                        {queueOrders.length} in queue
                    </Badge>
                </div>

                {/* Top queue */}
                <div className="bg-white p-3 rounded-xl shadow-md mb-3 border border-gray-200">
                    <h2 className="text-base font-semibold text-gray-700 mb-2">Order Queue</h2>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {queueOrders.length === 0 && (
                            <div className="text-gray-500 py-4 text-center w-full text-sm">
                                🎉 No queued orders - Great job!
                            </div>
                        )}
                        {queueOrders.map((o) => (
                            <OrderCircle key={o.id} o={o} onClick={() => openOrderCard(o.id)} />
                        ))}
                    </div>
                </div>

                {/* Opened cards grid */}
                {openedOrders.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Active Orders</h2>
                        <div className="flex flex-wrap -mx-2">
                            {openedOrders.map((o) => (
                                <div key={o.id} className="px-2 mb-4">
                                    <OrderCard order={o} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}