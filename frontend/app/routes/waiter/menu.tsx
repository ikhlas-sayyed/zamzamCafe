"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import api, { menuAPI, ordersAPI } from "~/services/api";
import type { MenuItem } from "~/types";
import MenuItems from "~/components/waiter/MenuItem";
import Header from "~/components/waiter/Header";
import CurrentOrderItem from "~/components/waiter/CurrentOrderItem";
import { io, type Socket } from "socket.io-client";
import { useNavigate } from "react-router";

interface orderItems {
  menuItemId: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
}

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
      // auto-dismiss
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
          role="status"
          aria-live="polite"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

const Menu: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [waiterId, setWaiterId] = useState<number>();
  const [selected, setSelected] = useState<{ [id: string]: number }>({});
  const [tableNumber, setTableNumber] = useState<number>();
  const [inputMethod, setInputMethod] = useState("menu");
  const [current_itemId, setCurrentItemId] = useState<number>();
  const [itemQuantity, setItemQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<orderItems[]>([]);
  const [placing, setPlacing] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const SOCKET_URL = (api.defaults.baseURL as string) || "http://localhost:3000";
  const { toasts, push, remove } = useToasts();



  // Load menu when component mounts
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuAPI.getAll();
        setMenu(data);

        const user = JSON.parse(localStorage.getItem("user") as string);
        setWaiterId(user.id);
      } catch (error) {
        console.error("Failed to load menu:", error);
      }
    };

    fetchMenu();
  }, []);

  // Toast when waiterId is available
  useEffect(() => {
    if (waiterId !== undefined) {
      console.log(waiterId)
    }
  }, [waiterId]);

  // Socket connection
  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("OrderStatus", (payload: { waiterId: number; status: string; orderNumber: string }) => {
      if (payload.waiterId === waiterId) {
        push(`Order #${payload.orderNumber} is ${payload.status}`);
      }
    });

    s.on(
      "ItemStatus",
      (payload: { waiterId: number; status: string; orderNumber: string; name: string }) => {
        if (payload.waiterId === waiterId) {
          push(`Order #${payload.orderNumber} - ${payload.name} is ${payload.status}`);
        }
      }
    );

    return () => {
      s.disconnect();
    };
  }, [SOCKET_URL, waiterId, push]);

  const addOrderItem = useCallback(
    (itemId: string, itemQty: number, name?: string, price?: number, image?: string) => {
      setOrderItems((prevItems) => {
        const index = prevItems.findIndex((item) => item.menuItemId === itemId);

        if (index !== -1) {
          const updatedItems = [...prevItems];
          updatedItems[index] = {
            ...updatedItems[index],
            quantity: updatedItems[index].quantity + itemQty,
          };
          return updatedItems;
        } else {
          return [...prevItems, { menuItemId: itemId, quantity: itemQty, name, price, image }];
        }
      });
    },
    []
  );

  const previewItem = useMemo(() => {
    if (!current_itemId) return null;
    return menu.find((obj) => obj.id === Number(current_itemId)) ?? null;
  }, [menu, current_itemId]);

  const currentOrderTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),
    [orderItems]
  );

  const itemchng = (itemId: string) => {
    setCurrentItemId(Number(itemId));
  };

  const addItemById = () => {
    if (previewItem) {
      addOrderItem(
        previewItem.id.toString(),
        itemQuantity,
        previewItem.name,
        previewItem.price,
        previewItem.image
      );
    }
  };

  const removeFromCurrentOrder = (i: number) => {
    setOrderItems((items) => items.filter((_, index) => index !== i));
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const placeOrder = async () => {
    setPlacing(true);

    try {
      await ordersAPI.create({ items: orderItems, tableNumber, notes: "" });
      clearOrder();
      push("Order placed!");
    } catch (error) {
      console.error("Failed to place order:", error);
      push("Error placing order");
    } finally {
      setPlacing(false);
    }
  };

  const navigate=useNavigate()

  return (
    <>
      <Header navigate={navigate}/>
      <Toasts toasts={toasts} onClose={remove} />

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Order</h2>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
              <input
                type="number"
                value={tableNumber ?? ""}
                onChange={(e) => setTableNumber(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Table #"
              />
            </div>
          </div>

          {/* Input Method Toggle */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInputMethod("menu")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                inputMethod === "menu"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Menu Selection
            </button>
            <button
              onClick={() => setInputMethod("id")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                inputMethod === "id"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ID Entry
            </button>
          </div>

          {/* ID Entry Method */}
          {inputMethod === "id" && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Enter Item by ID</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item ID</label>
                  <input
                    type="number"
                    value={current_itemId ?? ""}
                    onChange={(e) => itemchng(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ID (1-12)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addItemById}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </div>
              {previewItem && (
                <div className="mt-4">
                  <div className="bg-white border rounded-lg p-3 flex items-center space-x-3">
                    <img
                      src={previewItem.image}
                      alt={previewItem.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-semibold">{previewItem.name}</h4>
                      <p className="text-blue-600 font-bold">₹{previewItem.price}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Order */}
          {orderItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Current Order</h3>
                <button onClick={clearOrder} className="text-red-500 hover:text-red-700 font-medium">
                  Clear All
                </button>
              </div>
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <CurrentOrderItem
                    key={item.menuItemId}
                    item={item}
                    index={index}
                    onRemove={removeFromCurrentOrder}
                  />
                ))}
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total</span>
                  <span>₹{currentOrderTotal}</span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  Submit Order
                </button>
              </div>
            </div>
          )}

          {/* Menu Selection */}
          {inputMethod === "menu" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {menu.map((item) => (
                <MenuItems key={item.id} item={item} additems={addOrderItem} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Menu;
