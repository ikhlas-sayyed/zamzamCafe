import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ChefHat,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertTriangle,
  Timer,
  Users,
  Filter,
  UserCheck,
} from "lucide-react";
import { ordersAPI } from "~/services/api"; // your axios wrapper file
import type { Order, OrderItem } from "~/types";

const SOCKET_URL = "http://localhost:3000"; // same as your API base

// ---- Helpers to manage NEW flags without changing your types ----
type Id = string;
function toId(x: string | number): string {
  return String(x);
}

export default function ChefDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<Id | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "ready">("all");

  // Track what we've already seen to label NEW items/orders
  const seenOrderIds = useRef<Set<Id>>(new Set());
  const seenItemIds = useRef<Set<Id>>(new Set());

  // Explicit "new" flags we control (independent of API types)
  const [newOrders, setNewOrders] = useState<Set<Id>>(new Set());
  const [newItems, setNewItems] = useState<Set<Id>>(new Set());

  // Singleton socket instance
  const socketRef = useRef<Socket | null>(null);

  // ---- Simple, dependency-free toast system (no external libs) ----
  type Toast = { id: string; title?: string; message: string; type: "info" | "success" | "error" };
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: Toast["type"], title: string | undefined, message: string, ttl = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t: Toast = { id, title, message, type };
    setToasts((s) => [t, ...s]);
    // auto-remove
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), ttl);
  };

  async function OrderStatusUpdate(orderId, status) {
    try {
      ordersAPI.updateStatus(orderId, status)
    } catch {
      (e: any) => {
        console.log(e);
      }
    }
  }

  // ---- Initial load ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await ordersAPI.getAll();
        if (!mounted) return;

        // Initialize seen trackers; mark nothing as new at first render
        const orderIds = new Set<Id>();
        const itemIds = new Set<Id>();
        data.forEach((o) => {
          orderIds.add(o.id);
          o.items.forEach((it: any) => itemIds.add(toId((it as any).id ?? `${o.id}:${it.name}`)));
        });
        seenOrderIds.current = orderIds;
        seenItemIds.current = itemIds;
        setNewOrders(new Set());
        setNewItems(new Set());

        // Sort newest first by updatedAt
        setOrders(sortOrders(data, new Set(), new Set()));
        setExpandedOrderId(data[0]?.id ?? null);
      } catch (e) {
        console.error("Failed to load orders:", e);
        showToast("error", "Load failed", "Unable to fetch orders");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- Helper: refresh orders while preserving new flags and detecting cancellations ----
  async function refreshOrdersPreservingNewFlags() {
    try {
      const { data } = await ordersAPI.getAll();

      // Copy current new-sets so we preserve user-cleared flags
      const nextNewOrders = new Set(newOrders);
      const nextNewItems = new Set(newItems);

      // Map existing orders (before refresh) to detect cancellations and other changes
      const prevMap = new Map(orders.map((o) => [o.id, o] as [string, Order]));
      const incomingMap = new Map(data.map((o) => [o.id, o] as [string, Order]));

      // Detect cancellations: an order that existed previously and now has status 'cancelled'
      const cancelledIds: Id[] = [];
      for (const [id, prev] of prevMap.entries()) {
        const incoming = incomingMap.get(id);
        if (incoming && prev.status !== "cancelled" && incoming.status === "cancelled") {
          cancelledIds.push(id);
        }
      }

      // Remove cancelled orders from local "new" flags and mark seen items as such
      for (const id of cancelledIds) {
        // remove order-level new flag
        nextNewOrders.delete(id);

        // remove item new flags for items that belonged to the cancelled order
        const prev = prevMap.get(id);
        prev?.items.forEach((it: any) => {
          const key = toId((it as any).id ?? `${id}:${it.name}:${it.quantity}:${it.price}`);
          nextNewItems.delete(key);
        });

        // Notify the kitchen about the cancellation
        showToast("error", "Order cancelled", `Order #${prev?.orderNumber ?? id} was cancelled`);
      }

      // Mark any completely new orders/items we haven't seen before (e.g., created while offline)
      data.forEach((o) => {
        if (!seenOrderIds.current.has(o.id)) {
          nextNewOrders.add(o.id);
          seenOrderIds.current.add(o.id);
        }
        o.items.forEach((it: any) => {
          const iid = toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${it.price}`);
          if (!seenItemIds.current.has(iid)) {
            nextNewItems.add(iid);
            seenItemIds.current.add(iid);
          }
        });
      });

      // Update state with preserved new flags
      setNewOrders(nextNewOrders);
      setNewItems(nextNewItems);

      // Remove cancelled orders from the UI entirely (user requested behavior)
      const filtered = data.filter((o) => o.status !== "cancelled");

      // Sort with the (possibly) updated new flags
      setOrders(sortOrders(filtered, nextNewOrders, nextNewItems));

      // If currently-expanded order was cancelled, close it
      if (expandedOrderId && cancelledIds.includes(expandedOrderId)) {
        setExpandedOrderId(null);
      }
    } catch (e) {
      console.error("Failed to refresh orders:", e);
      showToast("error", "Refresh failed", "Unable to refresh orders");
    }
  }

  // ---- Socket wiring ----
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    // A new order is created (payload contains { waiterId, order } from your backend)
    socket.on("newOrder", async ({ order }: { waiterId: number; order: any }) => {
      try {
        // Normalize with API (ensures types like string ids, items structure)

        // Mark as NEW
        const nid = toId(order.id);
        const newOrderSet = new Set(newOrders);
        newOrderSet.add(nid);

        // Item IDs may not be stable in your types; try to use item.id if exists else synthesize
        const newItemSet = new Set(newItems);
        order.items.forEach((it: any) => {
          const iid = toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`);
          newItemSet.add(iid);
        });

        // Update "seen" so further reloads won't relabel this as old
        seenOrderIds.current.add(nid);
        order.items.forEach((it: any) =>
          seenItemIds.current.add(toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`))
        );

        setNewOrders(newOrderSet);
        setNewItems(newItemSet);

        setOrders((prev) => sortOrders([order, ...dedupeOrders(prev, nid)], newOrderSet, newItemSet));
        setExpandedOrderId(nid);

        // show non-blocking toast
        showToast("success", "New order", `Order #${order.orderNumber ?? order.id} received`);
      } catch (e) {
        console.error("Failed to process newOrder:", e);
      }
    });

    // Order status updated somewhere (payload lacks ids → refetch)
    socket.on("OrderStatus", async () => {
      await refreshOrdersPreservingNewFlags();
    });

    // Item status updated somewhere (payload lacks ids → refetch)
    socket.on("ItemStatus", async () => {
      await refreshOrdersPreservingNewFlags();
    });

    // Items added to some order (payload lacks order id → refetch and diff)
    socket.on("newItemAddtoOrder", async () => {
      try {
        const { data } = await ordersAPI.getAll();
        // Compare with seenItemIds to mark NEW items and bubble that order to top
        const newOrderSet = new Set(newOrders);
        const newItemSet = new Set(newItems);
        let bumpedOrderId: Id | null = null;

        data.forEach((o) => {
          let anyNewInThisOrder = false;
          o.items.forEach((it: any) => {
            const iid = toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${it.price}`);
            if (!seenItemIds.current.has(iid)) {
              // mark new
              anyNewInThisOrder = true;
              newItemSet.add(iid);
              seenItemIds.current.add(iid);
            }
          });
          if (anyNewInThisOrder) {
            newOrderSet.add(o.id);
            bumpedOrderId = o.id;
          }
        });

        setNewOrders(newOrderSet);
        setNewItems(newItemSet);

        // Move bumped order to top by sorting (NEW first)
        setOrders(sortOrders(data, newOrderSet, newItemSet));
        if (bumpedOrderId) setExpandedOrderId(bumpedOrderId);

        // optional notification for new items
        if (bumpedOrderId) {
          showToast("info", "New items",
            `New items added to Order #${bumpedOrderId}`);
        }
      } catch (e) {
        console.error("Failed to process newItemAddtoOrder:", e);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOrders, newItems]);

  // ---- Actions: chef updates item status / cancels order ----
  const updateItemStatus = async (orderId: Id, itemId: number, status: "pending" | "preparing" | "ready") => {
    try {
      // optimistic UI
      setOrders((prev) =>
        sortOrders(
          prev.map((o) =>
            o.id !== orderId
              ? o
              : {
                ...o,
                items: o.items.map((it: any) => {
                  const iid = (it as any).id;
                  if (iid === itemId) {
                    const itemKey = toId(iid ?? `${o.id}:${it.name}:${it.quantity}:${it.price}`);
                    const ni = new Set(newItems);
                    ni.delete(itemKey); // action taken → clear NEW
                    setNewItems(ni);
                    return { ...it, status };
                  }
                  return it;
                }),
              }
          ),
          newOrders,
          newItems
        )
      );

      await ordersAPI.updateItemStatus(orderId, itemId, status);
      // server will emit ItemStatus; we refetch there too to stay consistent
    } catch (e) {
      console.error(e);
      // fallback: reload
      await refreshOrdersPreservingNewFlags();
    }
  };


  // When chef takes *any* action on an order, clear the order-level NEW flag.
  const clearOrderNewFlag = (orderId: Id) => {
    const no = new Set(newOrders);
    if (no.has(orderId)) {
      no.delete(orderId);
      setNewOrders(no);
    }
  };

  // ---- Derived counts and filtered list ----
  const counts = useMemo(() => {
    const newCount = orders.filter((o) => isOrderNew(o, newOrders, newItems)).length;
    const inProg = orders.filter((o) => o.status === "preparing").length;
    const ready = orders.filter((o) => o.status === "ready").length;
    return { newCount, inProg, ready, totalItems: orders.reduce((a, o) => a + o.items.length, 0) };
  }, [orders, newOrders, newItems]);

  const visibleOrders = useMemo(() => {
    const sorted = sortOrders(orders, newOrders, newItems);
    if (filter === "all") return sorted;
    if (filter === "new") return sorted.filter((o) => isOrderNew(o, newOrders, newItems));
    if (filter === "in-progress") return sorted.filter((o) => o.status === "preparing");
    if (filter === "ready") return sorted.filter((o) => o.status === "ready");
    return sorted;
  }, [orders, filter, newOrders, newItems]);

  // ---- UI Handlers ----
  const toggleExpand = (id: Id) => setExpandedOrderId((prev) => (prev === id ? null : id));

  // ---- Render ----
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toasts container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`max-w-sm w-full rounded-lg shadow-lg p-3 border flex flex-col gap-1 transition-transform transform-gpu ` +
              (t.type === "success"
                ? "bg-white border-green-200"
                : t.type === "error"
                  ? "bg-white border-red-200"
                  : "bg-white border-blue-200")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {t.title && <div className="font-semibold text-sm text-gray-900">{t.title}</div>}
                <div className="text-xs text-gray-600">{t.message}</div>
              </div>
              <button
                aria-label="dismiss"
                onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <ChefHat className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Chef Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Live Kitchen View</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: "all", label: "All Orders", count: orders.length, icon: Filter },
                { key: "new", label: "New Orders", count: counts.newCount, icon: Clock },
                { key: "in-progress", label: "In Progress", count: counts.inProg, icon: ChefHat },
                { key: "ready", label: "Ready", count: counts.ready, icon: Package },
              ].map((t) => {
                const Icon = t.icon as any;
                return (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key as any)}
                    className={`${filter === t.key
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 rounded-t-lg`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {t.count > 0 && (
                      <Badge
                        className={`ml-2 ${filter === t.key ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {t.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">New Orders</p>
                  <p className="text-2xl font-bold text-yellow-900">{counts.newCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">In Progress</p>
                  <p className="text-2xl font-bold text-blue-900">{counts.inProg}</p>
                </div>
                <ChefHat className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-r from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Ready</p>
                  <p className="text-2xl font-bold text-red-900">{counts.ready}</p>
                </div>
                <Package className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Total Items</p>
                  <p className="text-2xl font-bold text-green-900">{counts.totalItems}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        <div className="space-y-6">
          {visibleOrders.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            visibleOrders.map((order) => {
              const isNew = isOrderNew(order, newOrders, newItems);
              return (
                <Card
                  key={order.id}
                  className="shadow-lg rounded-2xl border-0 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <CardHeader
                    className="flex flex-row items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors duration-200 p-6"
                    onClick={() => {
                      toggleExpand(order.id);
                      clearOrderNewFlag(order.id);
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-bold text-gray-900">Order #{order.orderNumber || order.id}</h2>
                          <OrderStatusBadge order={order} />
                          {isNew && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 px-2 py-1 text-xs">NEW</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>Table {order.tableNumber ?? "—"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            <span>{order.waiter?.username ?? "Waiter"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">₹{order.totalAmount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{order.items.length} items</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            OrderStatusUpdate(order.id,'cancelled');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Order
                        </Button>
                      </div>
                      {expandedOrderId === order.id ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>

                  {expandedOrderId === order.id && (
                    <CardContent className="bg-gray-50 p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 pb-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-0 flex items-center gap-2">
                          <ChefHat className="w-5 h-5" />
                          Order Items
                        </h3>
                      </div>

                      {order.items.map((it) => {
                        const itemKey = toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`);
                        const isNewItem = newItems.has(itemKey);
                        return (
                          <div
                            key={itemKey}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-xl bg-white border shadow-sm gap-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-gray-900 text-lg">{it.name}</p>
                                <ItemStatusBadge status={it.status} />
                                {isNewItem && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 px-2 py-0.5 text-xs">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                Quantity: <span className="font-semibold">{it.quantity}</span>
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {/* Cancel item not exposed by your API; leaving only prepare/ready per API */}
                              {it.status === "pending" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                  onClick={() => updateItemStatus(order.id, (it as any).id, "preparing")}
                                >
                                  <ChefHat className="w-4 h-4" />
                                  Prepare
                                </Button>
                              )}

                              {it.status === "preparing" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
                                  onClick={() => updateItemStatus(order.id, (it as any).id, "ready")}
                                >
                                  <Package className="w-4 h-4" />
                                  Mark Ready
                                </Button>
                              )}

                              {it.status === "ready" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-200 cursor-not-allowed opacity-50"
                                  disabled
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Ready
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Mobile: cancel order button */}
                      <div className="sm:hidden flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => cancelOrder(order.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Order
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI bits ---------------- */

function ItemStatusBadge({ status }: { status: OrderItem["status"] }) {
  const map: Record<string, { cls: string; Icon: any; label?: string }> = {
    pending: { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", Icon: Clock },
    preparing: { cls: "bg-blue-100 text-blue-800 border-blue-200", Icon: ChefHat },
    ready: { cls: "bg-green-100 text-green-800 border-green-200", Icon: CheckCircle },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <Badge className={`${cfg.cls} border px-2 py-0.5 text-xs flex items-center gap-1 font-medium`}>
      <cfg.Icon className="w-3 h-3" />
      <span className="capitalize">{cfg.label ?? status}</span>
    </Badge>
  );
}

function OrderStatusBadge({ order }: { order: Order }) {
  const map: Record<string, { cls: string; Icon: any; label?: string }> = {
    pending: { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", Icon: Clock },
    preparing: { cls: "bg-blue-100 text-blue-800 border-blue-200", Icon: ChefHat, label: "In Progress" },
    ready: { cls: "bg-green-100 text-green-800 border-green-200", Icon: CheckCircle },
    completed: { cls: "bg-gray-100 text-gray-700 border-gray-200", Icon: Timer },
    cancelled: { cls: "bg-red-100 text-red-800 border-red-200", Icon: AlertTriangle },
  };
  const cfg = map[order.status] ?? map.pending;
  return (
    <Badge className={`${cfg.cls} border px-3 py-1 text-sm flex items-center gap-1 font-medium`}>
      <cfg.Icon className="w-4 h-4" />
      <span className="capitalize">{cfg.label ?? order.status}</span>
    </Badge>
  );
}

function EmptyState({ filter }: { filter: "all" | "new" | "in-progress" | "ready" }) {
  const copy: Record<typeof filter, { title: string; desc: string }> = {
    all: { title: "No orders in kitchen", desc: "New orders will appear here when customers place them." },
    new: { title: "No new orders", desc: "New orders will appear here when customers place them." },
    "in-progress": { title: "No orders in progress", desc: "Orders being prepared will appear here." },
    ready: { title: "No ready orders", desc: "Completed orders will appear here." },
  };
  return (
    <div className="text-center py-12">
      <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{copy[filter].title}</h3>
      <p className="text-gray-600">{copy[filter].desc}</p>
    </div>
  );
}

/* ---------------- Utilities ---------------- */

function isOrderNew(order: Order, newOrders: Set<string>, newItems: Set<string>) {
  if (newOrders.has(order.id)) return true;
  // If any item of this order is new, treat the order as new
  return order.items.some((it: any) => {
    const key = toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`);
    return newItems.has(key);
  });
}

function sortOrders(list: Order[], newOrders: Set<string>, newItems: Set<string>) {
  // NEW orders first, then by updatedAt (desc)
  const score = (o: Order) => (isOrderNew(o, newOrders, newItems) ? 1 : 0);
  return [...list].sort((a, b) => {
    const s = score(b) - score(a);
    if (s !== 0) return s;
    const at = new Date(a.updatedAt || a.createdAt).getTime();
    const bt = new Date(b.updatedAt || b.createdAt).getTime();
    return bt - at;
  });
}

function dedupeOrders(list: Order[], idToKeepFirst: string): Order[] {
  const seen = new Set<string>();
  const out: Order[] = [];
  // keep the provided id first if present in list
  for (const o of list) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    out.push(o);
  }
  // Pull the favored id to front
  out.sort((x, y) => (x.id === idToKeepFirst ? -1 : y.id === idToKeepFirst ? 1 : 0));
  return out;
}
