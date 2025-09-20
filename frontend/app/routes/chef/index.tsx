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
  MoreHorizontal,
} from "lucide-react";
import api, { ordersAPI } from "~/services/api";
import type { Order, OrderItem } from "~/types";
import Header from "./header";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = api.defaults.baseURL;

type Id = string;
function toId(x: string | number): string {
  return String(x);
}

/**
 * Dense KOT-like Chef Dashboard
 * - Compact table top for scanning many orders
 * - Right-side KOT ticket / details (bold)
 * - Preserves NEW flags and real-time socket updates
 */
export default function ChefDashboard() {
  // --- state
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<Id | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "ready">("all");

  // NEW flags and seen tracking (like your original)
  const seenOrderIds = useRef<Set<Id>>(new Set());
  const seenItemIds = useRef<Set<Id>>(new Set());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);


  const [newOrders, _setNewOrders] = useState<Set<Id>>(new Set());
  const [newItems, _setNewItems] = useState<Set<Id>>(new Set());
  const newOrdersRef = useRef<Set<Id>>(new Set());
  const newItemsRef = useRef<Set<Id>>(new Set());
  const setNewOrders = (s: Set<Id>) => {
    newOrdersRef.current = s;
    _setNewOrders(s);
  };
  const setNewItems = (s: Set<Id>) => {
    newItemsRef.current = s;
    _setNewItems(s);
  };

  // socket singleton
  const socketRef = useRef<Socket | null>(null);

  // lightweight toast system
  type Toast = { id: string; title?: string; message: string; type: "info" | "success" | "error" };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (type: Toast["type"], title: string | undefined, message: string, ttl = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t: Toast = { id, title, message, type };
    setToasts((s) => [t, ...s]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), ttl);
  };

  // --- initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await ordersAPI.getAll();
        if (!mounted) return;

        // mark seen sets from initial load (we don't mark anything NEW on first load)
        const orderIds = new Set<Id>();
        const itemIds = new Set<Id>();
        data.forEach((o) => {
          orderIds.add(o.id);
          o.items.forEach((it: any) =>
            itemIds.add(toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`))
          );
        });
        seenOrderIds.current = orderIds;
        seenItemIds.current = itemIds;

        setNewOrders(new Set());
        setNewItems(new Set());

        // sort and set
        setOrders(sortOrders(data, new Set(), new Set()));
        setSelectedOrderId(data[0]?.id ?? null);
      } catch (e) {
        console.error("Failed to load orders:", e);
        showToast("error", "Load failed", "Unable to fetch orders");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // --- helper: preserve flags when refetching
  async function refreshOrdersPreservingNewFlags() {
    try {
      const { data } = await ordersAPI.getAll();
      const nextNewOrders = new Set(newOrdersRef.current);
      const nextNewItems = new Set(newItemsRef.current);

      const prevMap = new Map(orders.map((o) => [o.id, o] as [string, Order]));
      const incomingMap = new Map(data.map((o) => [o.id, o] as [string, Order]));

      // cancellations
      const cancelledIds: Id[] = [];
      for (const [id, prev] of prevMap.entries()) {
        const incoming = incomingMap.get(id);
        if (incoming && prev.status !== "cancelled" && incoming.status === "cancelled") {
          cancelledIds.push(id);
        }
      }

      for (const id of cancelledIds) {
        nextNewOrders.delete(id);
        const prev = prevMap.get(id);
        prev?.items.forEach((it: any) => {
          const key = toId((it as any).id ?? `${id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
          nextNewItems.delete(key);
        });
        showToast("error", "Order cancelled", `Order #${prev?.orderNumber ?? id} was cancelled`);
      }

      // detect newly-seen orders & items
      data.forEach((o) => {
        if (!seenOrderIds.current.has(o.id)) {
          nextNewOrders.add(o.id);
          seenOrderIds.current.add(o.id);
        }
        o.items.forEach((it: any) => {
          const iid = toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
          if (!seenItemIds.current.has(iid)) {
            nextNewItems.add(iid);
            seenItemIds.current.add(iid);
          }
        });
      });

      setNewOrders(nextNewOrders);
      setNewItems(nextNewItems);

      const filtered = data.filter((o) => o.status !== "cancelled");
      setOrders(sortOrders(filtered, nextNewOrders, nextNewItems));

      if (selectedOrderId && cancelledIds.includes(selectedOrderId)) {
        setSelectedOrderId(null);
      }
    } catch (e) {
      console.error("Failed to refresh orders:", e);
      showToast("error", "Refresh failed", "Unable to refresh orders");
    }
  }

  // --- socket wiring (once)
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("newOrder", ({ order }: { waiterId?: number; order: any }) => {
      try {
        const nid = toId(order.id);
        const newOrderSet = new Set(newOrdersRef.current);
        newOrderSet.add(nid);

        const newItemSet = new Set(newItemsRef.current);
        order.items.forEach((it: any) => {
          const iid = toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
          newItemSet.add(iid);
          seenItemIds.current.add(iid);
        });

        seenOrderIds.current.add(nid);

        setNewOrders(newOrderSet);
        setNewItems(newItemSet);

        setOrders((prev) => sortOrders([order, ...dedupeOrders(prev, nid)], newOrderSet, newItemSet));
        setSelectedOrderId(nid);

        showToast("success", "New order", `Order #${order.orderNumber ?? order.id} received`);
      } catch (e) {
        console.error("Failed to process newOrder:", e);
      }
    });

    socket.on("OrderStatus", async () => {
      await refreshOrdersPreservingNewFlags();
    });

    socket.on("ItemStatus", async () => {
      await refreshOrdersPreservingNewFlags();
    });

    socket.on("newItemAddtoOrder", async () => {
      try {
        const { data } = await ordersAPI.getAll();
        const newOrderSet = new Set(newOrdersRef.current);
        const newItemSet = new Set(newItemsRef.current);
        let bumpedOrderId: Id | null = null;

        data.forEach((o) => {
          let anyNewInThisOrder = false;
          o.items.forEach((it: any) => {
            const iid = toId((it as any).id ?? `${o.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
            if (!seenItemIds.current.has(iid)) {
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

        setOrders(sortOrders(data, newOrderSet, newItemSet));
        if (bumpedOrderId) setSelectedOrderId(bumpedOrderId);

        if (bumpedOrderId) showToast("info", "New items", `New items added to Order #${bumpedOrderId}`);
      } catch (e) {
        console.error("Failed to process newItemAddtoOrder:", e);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // intentionally mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- API actions
  async function OrderStatusUpdate(orderId: Id, status: Order["status"]) {
    try {
      await ordersAPI.updateStatus(orderId, status);
      // optimistic UI adjustments for cancel
      if (status === "cancelled") {
        setNewOrders((prev) => {
          const copy = new Set(prev);
          copy.delete(orderId);
          newOrdersRef.current = copy;
          return copy;
        });
        setNewItems((prev) => {
          const copy = new Set(prev);
          for (const itKey of Array.from(copy)) {
            if (itKey.startsWith(`${orderId}:`) || itKey === orderId) copy.delete(itKey);
          }
          newItemsRef.current = copy;
          return copy;
        });
      }
      // server will emit and refresh; but we can also refresh proactively
      await refreshOrdersPreservingNewFlags();
    } catch (e) {
      console.error("OrderStatusUpdate failed:", e);
      showToast("error", "Action failed", "Unable to update order status");
    }
  }

  const updateItemStatus = async (orderId: Id, itemId: number | string, status: "pending" | "preparing" | "ready") => {
    try {
      // optimistic small update
      setOrders((prev) =>
        sortOrders(
          prev.map((o) =>
            o.id !== orderId
              ? o
              : {
                  ...o,
                  items: o.items.map((it: any) =>
                    toId((it as any).id) === toId(itemId) ? { ...it, status } : it
                  ),
                }
          ),
          newOrdersRef.current,
          newItemsRef.current
        )
      );

      // clear new item flag if any
      setNewItems((prev) => {
        const next = new Set(prev);
        // delete matching keys (numeric id or synthesized)
        next.forEach((k) => {
          if (k === toId(itemId)) next.delete(k);
          if (k.startsWith(`${orderId}:`) && k.includes(String(itemId))) next.delete(k);
        });
        newItemsRef.current = next;
        return next;
      });

      // call server
      await ordersAPI.updateItemStatus(orderId, itemId, status);
      // server emits to keep canonical state
    } catch (e) {
      console.error("updateItemStatus failed:", e);
      showToast("error", "Update failed", "Unable to update item status");
      await refreshOrdersPreservingNewFlags();
    }
  };

  // bulk helpers for speed (Prep All / Ready All)
  const bulkUpdateItems = async (orderId: Id, fromStatuses: string[], toStatus: "preparing" | "ready") => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const targets = order.items.filter((it: any) => fromStatuses.includes(it.status));
    // optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id !== orderId
          ? o
          : { ...o, items: o.items.map((it: any) => (fromStatuses.includes(it.status) ? { ...it, status: toStatus } : it)) }
      )
    );
    // fire API updates in parallel
    await Promise.all(
      targets.map((it: any) => ordersAPI.updateItemStatus(orderId, (it as any).id, toStatus).catch((e) => console.error(e)))
    );
    // refresh canonical state
    await refreshOrdersPreservingNewFlags();
  };

  // clear order-level NEW flag
  const clearOrderNewFlag = (orderId: Id) => {
    setNewOrders((prev) => {
      const copy = new Set(prev);
      copy.delete(orderId);
      newOrdersRef.current = copy;
      return copy;
    });
  };

  // Helper function to check if order can be cancelled
  const canCancelOrder = (order: Order) => {
    return !['ready', 'completed', 'cancelled'].includes(order.status);
  };

  // --- UI derived data
  const counts = useMemo(() => {
    const newCount = orders.filter((o) => isOrderNew(o, newOrders, newItems)).length;
    const inProg = orders.filter((o) => o.status === "preparing").length;
    const ready = orders.filter((o) => o.status === "ready").length;
    return { newCount, inProg, ready, totalItems: orders.reduce((a, o) => a + o.items.length, 0) };
  }, [orders, newOrders, newItems]);

  const visibleOrders = useMemo(() => {
    const sorted = sortOrders(orders, newOrders, newItems);
    if (selectedTable) {
      return  sorted.filter((o) => (o.tableNumber ?? "—") === selectedTable);
    }
    if (filter === "all") return sorted;
    if (filter === "new") return sorted.filter((o) => isOrderNew(o, newOrders, newItems));
    if (filter === "in-progress") return sorted.filter((o) => o.status === "preparing");
    if (filter === "ready") return sorted.filter((o) => o.status === "ready");
    return sorted;
  }, [orders, filter, newOrders, newItems]);

  const navigate = useNavigate();

  // small helper: friendly age (e.g., 5m, 34s)
  function formatAge(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h`;
  }

  // --- render
  return (
    <div className="min-h-screen bg-gray-50">
      <Header navigate={navigate} />
      {/* toasts */}
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {/* Top: compact stats & filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Kitchen (KOT) — Compact View</h1>
            <Badge className="px-2 py-1">Orders: {orders.length}</Badge>
            <Badge className="px-2 py-1">New: {counts.newCount}</Badge>
            <Badge className="px-2 py-1">In Prog: {counts.inProg}</Badge>
            <Badge className="px-2 py-1">Ready: {counts.ready}</Badge>
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "All", icon: Filter },
              { key: "new", label: "New", icon: Clock },
              { key: "in-progress", label: "In Progress", icon: ChefHat },
              { key: "ready", label: "Ready", icon: Package },
            ].map((t) => {
              const Icon = t.icon as any;
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key as any)}
                  className={`text-sm px-3 py-1 rounded-md font-medium ${filter === t.key ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>


<div className="mb-4 flex flex-wrap gap-3">
  {Array.from(new Set(orders.map((o) => o.tableNumber ?? "—"))).map((table) => {
    const isSelected = selectedTable === table;
    return (
      <button
        key={table}
        onClick={
          ()=>{
             setSelectedTable((prev) => (prev === table ? null : table));
             setFilter('');
          }}
        className={`px-6 py-3 rounded-2xl font-bold border text-lg transition-all duration-200 ${
          isSelected
            ? "bg-green-500 text-white border-green-500 shadow-lg"
            : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 hover:scale-105"
        }`}
      >
        Table {table}
      </button>
    );
  })}
</div>



        {/* Two-column layout: table (left) + ticket/details (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: compact table/list (span 2/3) */}
          <div className="lg:col-span-2 overflow-auto">
            <table className="w-full text-sm table-fixed border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left">
                  <th className="px-2 py-2 w-16 font-semibold">Order No</th>
                  <th className="px-2 py-2 font-semibold">Items (bold)</th>
                  <th className="px-2 py-2 w-28 font-semibold">Status</th>
                  <th className="px-2 py-2 w-24 font-semibold">Age</th>
                  <th className="px-2 py-2 w-36 font-semibold">Quick</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  if(order.status!=='cancelled'){
                  const isNew = isOrderNew(order, newOrders, newItems);
                  const selected = selectedOrderId === order.id;
                  const canCancel = canCancelOrder(order);
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`align-top cursor-pointer border-b text-sm ${selected ? "bg-white" : "bg-transparent"} hover:bg-gray-50`}
                        onClick={() => {
                          setSelectedOrderId((prev) => (prev === order.id ? null : order.id));
                          clearOrderNewFlag(order.id);
                        }}
                      >
                        <td className="px-2 py-2 align-middle">
                          <div className="text-lg font-bold">#{order.orderNumber ?? "—"}</div>
                          {isNew && <div className="mt-1"><Badge className="bg-red-100 text-red-700">NEW</Badge></div>}
                        </td>

                        <td className="px-2 py-2 align-middle">
                          {/* compact item summary: show first two bold, then +N */}
                          <div className="text-sm">
                            {order.items.slice(0, 2).map((it, idx) => (
                              <span key={idx} className="block">
                                <span className="font-semibold">{it.quantity}x {it.name}</span>
                              </span>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-gray-500">+{order.items.length - 2} more</div>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-2 align-middle">
                          <OrderStatusBadge order={order} compact />
                        </td>

                        <td className="px-2 py-2 align-middle">
                          <div className="text-sm font-medium">{formatAge(order.createdAt)}</div>
                          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                        </td>

                        <td className="px-2 py-2 align-middle">
                          <div className="flex gap-1">
                          {canCancel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                bulkUpdateItems(order.id, ["pending"], "preparing");
                                clearOrderNewFlag(order.id);
                              }}
                              className="px-2 py-1 rounded text-xs bg-yellow-500 text-white font-semibold"
                            >
                              Prep All
                            </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                bulkUpdateItems(order.id, ["preparing"], "ready");
                                clearOrderNewFlag(order.id);
                              }}
                              className="px-2 py-1 rounded text-xs bg-green-600 text-white font-semibold"
                            >
                              Ready All
                            </button>

                            {canCancel && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  OrderStatusUpdate(order.id, "cancelled");
                                }}
                                className="px-2 py-1 rounded text-xs bg-red-600 text-white font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-2 align-middle text-right">
                          {selected ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </td>
                      </tr>

                      {/* expanded compact detail row (dense) */}
                      {selected && (
                        <tr className="bg-white">
                          <td colSpan={6} className="px-2 py-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Left: items (bold) */}
                              <div>
                                <div className="text-sm font-semibold mb-2">Items (KOT)</div>
                                <div className="space-y-2">
                                  {order.items.map((it: any) => {
                                    const itemKey = toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
                                    const isNewItem = newItems.has(itemKey);
                                    return (
                                      <div key={itemKey} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <div>
                                          <div className="font-semibold">{it.quantity} × {it.name}</div>
                                          <div className="text-xs text-gray-600">{it.notes ?? ""}</div>
                                          {isNewItem && <div className="text-xs mt-1"><Badge className="bg-red-100 text-red-700">NEW</Badge></div>}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                          {it.status === "pending" && (
                                            <button
                                              onClick={() => updateItemStatus(order.id, (it as any).id, "preparing")}
                                              className="px-2 py-1 rounded text-xs bg-blue-600 text-white font-semibold"
                                            >
                                              Prepare
                                            </button>
                                          )}
                                          {it.status === "preparing" && (
                                            <button
                                              onClick={() => updateItemStatus(order.id, (it as any).id, "ready")}
                                              className="px-2 py-1 rounded text-xs bg-green-600 text-white font-semibold"
                                            >
                                              Mark Ready
                                            </button>
                                          )}
                                          {it.status === "ready" && (
                                            <div className="text-xs text-green-700 font-semibold flex items-center gap-1">
                                              <CheckCircle className="w-4 h-4" /> READY
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Right: order meta & actions (bold) */}
                              <div>
                                <div className="text-sm font-semibold mb-2">Order Info</div>
                                <div className="bg-gray-50 p-3 rounded space-y-2">
                                  <div className="font-semibold">Order #{order.orderNumber ?? order.id}</div>
                                  <div className="text-sm"><span className="font-semibold">Table:</span> {order.tableNumber ?? "—"}</div>
                                  <div className="text-sm"><span className="font-semibold">Waiter:</span> {order.waiter?.username ?? "—"}</div>
                                  <div className="text-sm"><span className="font-semibold">Total Items:</span> {order.items.length}</div>
                                  <div className="text-sm"><span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleString()}</div>
                                  <div className="pt-2 flex gap-2">
                                    {canCancel && (
                                      <button
                                        onClick={() => OrderStatusUpdate(order.id, "cancelled")}
                                        className="flex-1 px-2 py-1 rounded bg-red-600 text-white font-semibold"
                                      >
                                        <XCircle className="inline-block w-4 h-4 mr-1" /> Cancel
                                      </button>
                                    )}
                                  {canCancel && (
                                    <button
                                      onClick={() => bulkUpdateItems(order.id, ["pending"], "preparing")}
                                      className="px-3 py-1 rounded bg-yellow-500 text-white font-semibold"
                                    >
                                      Prep All
                                    </button>
                                  )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                  }})}
                {visibleOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-600">
                      No orders matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Right: compact KOT ticket / details for selected order (also visible on small screens below) */}
          <div className="h-full">
            {selectedOrderId ? (
              (() => {
                const order = orders.find((o) => o.id === selectedOrderId);
                if (!order) return <div className="p-4 bg-white rounded shadow">Order not found</div>;
                const canCancel = canCancelOrder(order);
                return (
                  <Card className="shadow-md">
                    <CardHeader className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold">KOT — Table {order.tableNumber ?? "—"}</div>
                        <div className="text-sm text-gray-600">Order #{order.orderNumber ?? order.id}</div>
                      </div>
                      <div>
                        <OrderStatusBadge order={order} />
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      <div className="space-y-2">
                        {order.items.map((it: any) => {
                          const itemKey = toId((it as any).id ?? `${order.id}:${it.name}:${it.quantity}:${(it as any).price ?? ""}`);
                          const isNewItem = newItems.has(itemKey);
                          return (
                            <div key={itemKey} className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-sm">{it.quantity} × {it.name}</div>
                                <div className="text-xs text-gray-500">{it.notes ?? ""}</div>
                                {isNewItem && <div className="text-xs mt-1"><Badge className="bg-red-100 text-red-700">NEW</Badge></div>}
                              </div>
                              <div className="text-right">
                                {it.status === "pending" && (
                                  <button
                                    onClick={() => updateItemStatus(order.id, (it as any).id, "preparing")}
                                    className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
                                  >
                                    Prepare
                                  </button>
                                )}
                                {it.status === "preparing" && (
                                  <button
                                    onClick={() => updateItemStatus(order.id, (it as any).id, "ready")}
                                    className="px-2 py-1 rounded bg-green-600 text-white text-xs font-semibold"
                                  >
                                    Mark Ready
                                  </button>
                                )}
                                {it.status === "ready" && <div className="text-xs text-green-700 font-semibold">READY</div>}
                              </div>
                            </div>
                          );
                        })}

                                              </div>

                      {/* Order-level actions */}
                      <div className="pt-3 flex gap-2">
                        {canCancel && (
                          <button
                            onClick={() => OrderStatusUpdate(order.id, "cancelled")}
                            className="flex-1 px-2 py-1 rounded bg-red-600 text-white font-semibold flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Cancel Order
                          </button>
                        )}
                      {canCancel && (
                        <button
                          onClick={() => bulkUpdateItems(order.id, ["pending"], "preparing")}
                          className="flex-1 px-2 py-1 rounded bg-yellow-500 text-white font-semibold"
                        >
                          Prep All
                        </button>
                      )}
                          {canCancel && (
                        <button
                          onClick={() => bulkUpdateItems(order.id, ["preparing"], "ready")}
                          className="flex-1 px-2 py-1 rounded bg-green-600 text-white font-semibold"
                        >
                          Ready All
                        </button>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()
            ) : (
              <div className="p-4 bg-white rounded shadow text-center text-gray-500">Select an order to view details</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------- Helper Components / Functions -----------------

function OrderStatusBadge({ order, compact }: { order: Order; compact?: boolean }) {
  let color = "gray";
  let label = order.status.toUpperCase();
  if (order.status === "pending") color = "yellow";
  else if (order.status === "preparing") color = "blue";
  else if (order.status === "ready") color = "green";
  else if (order.status === "completed") color = "purple";
  else if (order.status === "cancelled") color = "red";

  return (
    <Badge
      className={`px-2 py-1 text-xs font-semibold ${
        color === "yellow"
          ? "bg-yellow-100 text-yellow-800"
          : color === "blue"
          ? "bg-blue-100 text-blue-800"
          : color === "green"
          ? "bg-green-100 text-green-800"
          : color === "purple"
          ? "bg-purple-100 text-purple-800"
          : color === "red"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {compact ? label[0] : label}
    </Badge>
  );
}

function isOrderNew(order: Order, newOrders: Set<Id>, newItems: Set<Id>) {
  if (newOrders.has(order.id)) return true;
  for (const it of order.items) {
    const key = toId(it.id ?? `${order.id}:${it.name}:${it.quantity}:${it.price ?? ""}`);
    if (newItems.has(key)) return true;
  }
  return false;
}

function sortOrders(orders: Order[], newOrders: Set<Id>, newItems: Set<Id>) {
  return [...orders].sort((a, b) => {
    // new orders first
    const aNew = isOrderNew(a, newOrders, newItems);
    const bNew = isOrderNew(b, newOrders, newItems);
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;

    // then by createdAt descending
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function dedupeOrders(orders: Order[], newId: Id) {
  const seen = new Set<Id>();
  const res: Order[] = [];
  for (const o of orders) {
    if (o.id === newId) continue; // skip duplicate of newly added order
    if (!seen.has(o.id)) {
      seen.add(o.id);
      res.push(o);
    }
  }
  return res;
}
