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
  Timer,
  Filter,
} from "lucide-react";
import api, { ordersAPI } from "~/services/api";
import type { Order, OrderItem } from "~/types";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = api.defaults.baseURL;
type Id = string;
function toId(x: string | number): string {
  return String(x);
}

/**
 * ChefDashboardV2
 * - Always show 30 tables in a grid
 * - Table colors: Yellow (pending), Red (expired), Green (ready)
 * - Timer counts since order.createdAt up to 15:00. If >15:00 and not ready -> expired.
 * - Clicking table shows order(s) for that table on right-hand panel (like your second image)
 * - Keeps socket and API wiring from original component
 */
export default function ChefDashboard() {
  // --- state & refs (kept similar to original to preserve behavior)
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<Id | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "ready">("all");

  const seenOrderIds = useRef<Set<Id>>(new Set());
  const seenItemIds = useRef<Set<Id>>(new Set());

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

  const socketRef = useRef<Socket | null>(null);

  // toasts
  type Toast = { id: string; title?: string; message: string; type: "info" | "success" | "error" };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (type: Toast["type"], title: string | undefined, message: string, ttl = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t: Toast = { id, title, message, type };
    setToasts((s) => [t, ...s]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), ttl);
  };

  // fetch initial orders
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await ordersAPI.getAll();
        if (!mounted) return;

        // mark seen sets from initial load
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

  // preserve flags on refresh
  async function refreshOrdersPreservingNewFlags() {
    try {
      const { data } = await ordersAPI.getAll();
      const nextNewOrders = new Set(newOrdersRef.current);
      const nextNewItems = new Set(newItemsRef.current);

      const prevMap = new Map(orders.map((o) => [o.id, o] as [string, Order]));
      const incomingMap = new Map(data.map((o) => [o.id, o] as [string, Order]));

      // cancellations detection
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

  // socket wiring (keeps existing events)
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
        setSelectedTable(String(order.tableNumber ?? "—"));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- actions (unchanged)
  async function OrderStatusUpdate(orderId: Id, status: Order["status"]) {
    try {
      await ordersAPI.updateStatus(orderId, status);
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
      await refreshOrdersPreservingNewFlags();
    } catch (e) {
      console.error("OrderStatusUpdate failed:", e);
      showToast("error", "Action failed", "Unable to update order status");
    }
  }

  const updateItemStatus = async (orderId: Id, itemId: number | string, status: "pending" | "preparing" | "ready") => {
    try {
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

      setNewItems((prev) => {
        const next = new Set(prev);
        next.forEach((k) => {
          if (k === toId(itemId)) next.delete(k);
          if (k.startsWith(`${orderId}:`) && k.includes(String(itemId))) next.delete(k);
        });
        newItemsRef.current = next;
        return next;
      });

      await ordersAPI.updateItemStatus(orderId, itemId, status);
    } catch (e) {
      console.error("updateItemStatus failed:", e);
      showToast("error", "Update failed", "Unable to update item status");
      await refreshOrdersPreservingNewFlags();
    }
  };

  const bulkUpdateItems = async (orderId: Id, fromStatuses: string[], toStatus: "preparing" | "ready") => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const targets = order.items.filter((it: any) => fromStatuses.includes(it.status));
    setOrders((prev) =>
      prev.map((o) =>
        o.id !== orderId
          ? o
          : { ...o, items: o.items.map((it: any) => (fromStatuses.includes(it.status) ? { ...it, status: toStatus } : it)) }
      )
    );
    await Promise.all(
      targets.map((it: any) => ordersAPI.updateItemStatus(orderId, (it as any).id, toStatus).catch((e) => console.error(e)))
    );
    await refreshOrdersPreservingNewFlags();
  };

  const clearOrderNewFlag = (orderId: Id) => {
    setNewOrders((prev) => {
      const copy = new Set(prev);
      copy.delete(orderId);
      newOrdersRef.current = copy;
      return copy;
    });
  };

  const canCancelOrder = (order: Order) => {
    return !["ready", "completed", "cancelled"].includes(order.status);
  };

  // --- Timer logic: internal clock tick to update UI for timers (1s)
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Helper: compute remaining/elapsed for 15min window
  function getElapsedMs(createdAt: string) {
    return Date.now() - new Date(createdAt).getTime();
  }
  function formatRemaining(createdAt: string) {
    const elapsed = getElapsedMs(createdAt);
    const limit = 15 * 60 * 1000; // 15 minutes
    const rem = Math.max(limit - elapsed, 0);
    const s = Math.floor(rem / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(1, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  // maps table number (string) -> orders[]
  const ordersByTable = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of orders) {
      const table = String(o.tableNumber ?? "—");
      if (!map.has(table)) map.set(table, []);
      map.get(table)!.push(o);
    }
    // ensure orders for each table are sorted by createdAt descending (latest first)
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return map;
  }, [orders]);

  // derive table status for table grid
  function getTableStatus(tableNumber: number): { color: "none" | "yellow" | "red" | "green"; order?: Order; expired?: boolean; remaining?: string } {
    const key = String(tableNumber);
    const tableOrders = ordersByTable.get(key) ?? [];
    if (tableOrders.length === 0) return { color: "none" };
    // pick the latest order that isn't cancelled
    const order = tableOrders.find((o) => o.status !== "cancelled") ?? tableOrders[0];
    // determine color
    if (order.status === "ready") {
      return { color: "green", order, remaining: "00:00" };
    }
    // pending or preparing => we consider timer
    const elapsed = getElapsedMs(order.updatedAt);
    const limit = 15 * 60 * 1000;
    const expired = elapsed > limit && order.status !== "ready";
    if (expired) return { color: "red", order, expired: true, remaining: "00:00" };
    return { color: "yellow", order, remaining: formatRemaining(order.updatedAt) };
  }

  // priorities: all tables with expired orders
  const priorityTables = useMemo(() => {
    const res: { table: string; order: Order }[] = [];
    for (let i = 1; i <= 30; i++) {
      const key = String(i);
      const tableOrders = ordersByTable.get(key) ?? [];
      if (tableOrders.length === 0) continue;
      const order = tableOrders.find((o) => o.status !== "cancelled") ?? tableOrders[0];
      const expired = getElapsedMs(order.createdAt) > 15 * 60 * 1000 && order.status !== "ready";
      if (expired) res.push({ table: key, order });
    }
    return res;
  }, [ordersByTable, now]);

  // table numbers fixed 1..30
  const TABLES = Array.from({ length: 30 }, (_, i) => i);

  const navigate = useNavigate();

  // derived counts
  const counts = useMemo(() => {
    const newCount = orders.filter((o) => isOrderNew(o, newOrders, newItems)).length;
    const inProg = orders.filter((o) => o.status === "preparing").length;
    const ready = orders.filter((o) => o.status === "ready").length;
    return { newCount, inProg, ready, totalOrders: orders.length };
  }, [orders, newOrders, newItems]);

  // visibleOrders for list (respect filter and selectedTable)
  const visibleOrders = useMemo(() => {
    const sorted = sortOrders(orders, newOrders, newItems);
    if (selectedTable) {
      return sorted.filter((o) => String(o.tableNumber ?? "—") === selectedTable);
    }
    if (filter === "all") return sorted;
    if (filter === "new") return sorted.filter((o) => isOrderNew(o, newOrders, newItems));
    if (filter === "in-progress") return sorted.filter((o) => o.status === "preparing");
    if (filter === "ready") return sorted.filter((o) => o.status === "ready");
    return sorted;
  }, [orders, filter, newOrders, newItems, selectedTable]);

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

  // UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* toasts */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`max-w-sm w-full rounded-lg shadow-lg p-3 border flex flex-col gap-1 transition-transform transform-gpu ` +
              (t.type === "success" ? "bg-white border-green-200" : t.type === "error" ? "bg-white border-red-200" : "bg-white border-blue-200")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {t.title && <div className="font-semibold text-sm text-gray-900">{t.title}</div>}
                <div className="text-xs text-gray-600">{t.message}</div>
              </div>
              <button aria-label="dismiss" onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Kitchen Dashboard — Table Grid</h1>
            <Badge className="px-2 py-1">Orders: {counts.totalOrders}</Badge>
            <Badge className="px-2 py-1">New: {counts.newCount}</Badge>
            <Badge className="px-2 py-1">In Prog: {counts.inProg}</Badge>
            <Badge className="px-2 py-1">Ready: {counts.ready}</Badge>
          </div>

          <div className="flex items-center gap-2">
            {[{ key: "all", label: "All", icon: Filter }, { key: "new", label: "New", icon: Clock }, { key: "in-progress", label: "In Progress", icon: ChefHat }, { key: "ready", label: "Ready", icon: Package }].map((t) => {
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

        {/* Main layout: left = table grid + priority column, right = details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left two-thirds: Grid + orders list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-4">
              {/* Table grid */}
              <div className="flex-1 bg-white p-5 rounded-lg shadow">
                <div className="mb-3 font-semibold text-lg">Tables</div>
                <div className="grid grid-cols-6 gap-3">
                  {TABLES.map((num) => {
                    const status = getTableStatus(num);
                    const isSelected = selectedTable === String(num);
                    const base = "p-4 rounded-lg text-center font-bold text-base cursor-pointer select-none transition transform";
                    const cls =
                      status.color === "yellow"
                        ? `${base} bg-yellow-400 text-yellow-900 shadow`
                        : status.color === "red"
                          ? `${base} bg-red-500 text-white shadow`
                          : status.color === "green"
                            ? `${base} bg-green-600 text-white shadow`
                            : `${base} bg-white text-gray-700 border border-gray-200`;
                    return (
                      <div
                        key={num}
                        onClick={() => {
                          setSelectedTable(String(num));
                          const tableOrders = ordersByTable.get(String(num)) ?? [];
                          setSelectedOrderId(tableOrders[0]?.id ?? null);
                        }}
                        className={`${cls} ${isSelected ? "ring-4 ring-blue-200 scale-105" : "hover:scale-105"}`}
                      >
                        <div>Table {num}</div>
                        {status.color === "yellow" && <div className="text-xs mt-1">{status.remaining ?? "15:00"}</div>}
                        {status.color === "red" && <div className="text-xs mt-1">! priority</div>}
                        {status.color === "green" && <div className="text-xs mt-1">Ready</div>}
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Priorities + New order preview */}
            </div>

          </div>

          {/* Right column: details for selected table / order */}
          {selectedTable ? (
            (() => {
              const tableOrders = ordersByTable.get(selectedTable) ?? [];
              if (tableOrders.length === 0) {
                return <div className="text-center text-gray-500">No orders for Table {selectedTable}</div>;
              }

              // Sort orders by createdAt descending (latest first)
              const sortedOrders = [...tableOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              return (
                <div className="space-y-4">
                  {sortedOrders.map((order) => {
                    const canCancel = canCancelOrder(order);
                    const elapsed = getElapsedMs(order.createdAt);
                    const expired = elapsed > 15 * 60 * 1000 && order.status !== "ready";

                    return (
                      <Card key={order.id} className="shadow-md">
                        <CardHeader className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold">
                              Table {selectedTable} — Order #{order.orderNumber ?? order.id}
                            </div>
                            <div className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.status === "ready" ? (
                              <Badge className="bg-green-100 text-green-800 px-3 py-1">READY</Badge>
                            ) : expired ? (
                              <Badge className="bg-red-100 text-red-800 px-3 py-1">priority</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">{formatRemaining(order.createdAt)}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3">
                          <div className="space-y-2">
                            {order.items.map((it) => {
                              const itemKey = toId(it.id ?? `${order.id}:${it.name}:${it.quantity}:${it.price ?? ""}`);
                              const isNewItem = (newItems instanceof Set) && newItems.has(itemKey);
                              return (
                                <div key={itemKey} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                  <div>
                                    <div className="font-semibold">{it.quantity} × {it.name}</div>
                                    <div className="text-xs text-gray-500">{it.notes ?? ""}</div>
                                    {isNewItem && <div className="text-xs text-red-600">NEW</div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            <div className="text-center text-gray-500">Select a table to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function OrderStatusBadge({ order, compact }: { order: any; compact?: boolean }) {
  let color = "gray";
  let label = order.status?.toUpperCase?.() ?? "—";
  if (order.status === "pending") color = "yellow";
  else if (order.status === "preparing") color = "blue";
  else if (order.status === "ready") color = "green";
  else if (order.status === "completed") color = "purple";
  else if (order.status === "cancelled") color = "red";

  return (
    <Badge
      className={`px-2 py-1 text-xs font-semibold ${color === "yellow" ? "bg-yellow-100 text-yellow-800" : color === "blue" ? "bg-blue-100 text-blue-800" : color === "green" ? "bg-green-100 text-green-800" : color === "purple" ? "bg-purple-100 text-purple-800" : color === "red" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
        }`}
    >
      {compact ? label?.[0] ?? label : label}
    </Badge>
  );
}

function isOrderNew(order: Order, newOrders: Set<Id>, newItems: Set<Id>) {
  if (newOrders.has(order.id)) return true;
  for (const it of order.items) {
    const key = toId(it.id ?? `${order.id}:${it.name}:${it.quantity}:${it.price ?? ""}`);
    if ((newItems instanceof Set) && newItems.has(key)) return true;
  }
  return false;
}

function sortOrders(orders: Order[], newOrders: Set<Id>, newItems: Set<Id>) {
  return [...orders].sort((a, b) => {
    const aNew = isOrderNew(a, newOrders, newItems);
    const bNew = isOrderNew(b, newOrders, newItems);
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function dedupeOrders(orders: Order[], newId: Id) {
  const seen = new Set<Id>();
  const res: Order[] = [];
  for (const o of orders) {
    if (o.id === newId) continue;
    if (!seen.has(o.id)) {
      seen.add(o.id);
      res.push(o);
    }
  }
  return res;
}
