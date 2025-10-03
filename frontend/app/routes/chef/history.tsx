import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { MapPin, X } from "lucide-react";
import api, { ordersAPI } from "~/services/api";
import type { Order } from "~/types";
import Header from "./header";
import { useNavigate } from "react-router-dom";

type Id = string;
function toId(x: string | number | undefined | null) {
    if (x === undefined || x === null) return "";
    return String(x);
}

export default function ChefHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [openedOrderIds, setOpenedOrderIds] = useState<Set<Id>>(new Set());
    const [newItemsForOrder, setNewItemsForOrder] = useState<Record<Id, boolean>>({});
    const seenOrderIds = useRef<Set<Id>>(new Set());
    const seenItemIds = useRef<Set<Id>>(new Set());
    const socketRef = useRef<Socket | null>(null);
    const navigate = useNavigate();

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

                setOrders(data.filter((o) => o.status === "ready"));
            } catch (e) {
                console.error("Failed to load orders:", e);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);
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
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${allItemsReady ? "bg-green-500 text-white" : "bg-yellow-400 text-gray-900"
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
                            statusStyles = "bg-red-500 text-white shadow-md";
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
                            </div>
                        );
                    })}

                    <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3 mb-4">
                        <p className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                            {order.items.length} items
                        </p>
                    </div>
                    <p><b>note :</b>{order.notes}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
            <Header navigate={navigate} />
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Kitchen Dashboard — History</h1>                </div>

                {orders.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Active Orders</h2>
                        <div className="flex flex-wrap -mx-2">
                            {orders
                                .map((o) => (
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