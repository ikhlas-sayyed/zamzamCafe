"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import api, { menuAPI, ordersAPI } from "~/services/api";
import type { MenuItem } from "~/types";
import MenuItems from "~/components/waiter/MenuItem";
import Header from "./Header";
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
  const [inputMethod, setInputMethod] = useState("id");
  const [current_itemId, setCurrentItemId] = useState<number>();
  const [itemQuantity, setItemQuantity] = useState(1);
  const [note,set_note] = useState("");
  const [orderItems, setOrderItems] = useState<orderItems[]>([]);
  const [placing, setPlacing] = useState(false);

  // 🔎 New state for search and category filter
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const socketRef = useRef<Socket | null>(null);
  const SOCKET_URL = (api.defaults.baseURL as string) || "http://localhost:3000";
  const { toasts, push, remove } = useToasts();

  // Refs for keyboard workflow
  const tableRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const noteRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tableRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && document.activeElement==itemRef.current &&current_itemId==null) {
      placeOrder();
      setTableNumber(undefined);
      setCurrentItemId(undefined);
      setItemQuantity(1);
      tableRef.current?.focus();
    } else if (e.key === "Enter") {
      if (document.activeElement === tableRef.current) {
        itemRef.current?.focus();
      } else if (document.activeElement === itemRef.current) {
        qtyRef.current?.focus();
      } else if (document.activeElement === qtyRef.current) {
        addItemById();
        itemRef.current?.focus()
      }
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuAPI.getAll();
        setMenu(data);

        const user = JSON.parse(localStorage.getItem("user") as string);
        setWaiterId(user.itemNumber);
      } catch (error) {
        console.error("Failed to load menu:", error);
      }
    };

    fetchMenu();
  }, []);

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
    return menu.find((obj) => obj.itemNumber === Number(current_itemId)) ?? null;
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
        previewItem.id,
        itemQuantity,
        previewItem.name,
        previewItem.price,
        previewItem.image,
      );
      // 🔄 Reset input after adding
      setCurrentItemId(undefined);
      setItemQuantity(1);
      itemRef.current!.value = "";
    }
  };

  const updateQty = (index: number, delta: number) => {
    setOrderItems((items) =>
      items
        .map((it, i) =>
          i === index ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
        )
        .filter((it) => it.quantity > 0)
    );
  };

  const removeFromCurrentOrder = (i: number) => {
    setOrderItems((items) => items.filter((_, index) => index !== i));
  };

  const clearOrder = () => {
    setOrderItems([]);
  };

  const placeOrder = async () => {
    if (!tableNumber || orderItems.length === 0) {
      setTableNumber(0);
    }
    setPlacing(true);
    try {
      await ordersAPI.create({ items: orderItems, tableNumber, notes: note });
      clearOrder();
      setCurrentItemId(null);
      setItemQuantity(1);
      set_note("")
      push("Order placed!");
    } catch (error) {
      console.error("Failed to place order:", error);
      push("Error placing order");
    } finally {
      setPlacing(false);
      setTableNumber(null);
    }
  };

  const navigate = useNavigate();

  // 🔎 Filtered menu
  const filteredMenu = useMemo(() => {
    return menu.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [menu, search, category]);

  return (
    <>
         <div className="min-h-screen flex bg-gray-100">
           <Header navigate={navigate} />
      <Toasts toasts={toasts} onClose={remove} />

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Order</h2>

          {/* Table input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
              <input
                ref={tableRef}
                type="number"
                value={tableNumber ?? ""}
                onChange={(e) => setTableNumber(parseInt(e.target.value))}
                onKeyDown={handleKeyDown}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Table #"
              />
            </div>
          </div>

          {/* Input method toggle */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInputMethod("menu")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${inputMethod === "menu"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              Menu Selection
            </button>
            <button
              onClick={() => setInputMethod("id")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${inputMethod === "id"
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
                    ref={itemRef}
                    type="text"   // <-- changed from number to text
                    value={current_itemId ?? ""}
                    onChange={(e) => {
                      // allow only digits
                      const val = e.target.value.replace(/\D/g, "");
                      itemchng(val);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ID"
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center border rounded-lg">
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-200 rounded-l-lg"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      -
                    </button>
                    <input
                      ref={qtyRef}
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value))}
                      onKeyDown={handleKeyDown}
                      className="w-full text-center p-3 border-0 focus:ring-0"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-200 rounded-r-lg"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                    >
                      +
                    </button>
                  </div>
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
                      src={api.defaults.baseURL + previewItem.image}
                      crossOrigin="anonymous"
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


          {/* Current order */}
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
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between border p-3 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-500">₹{item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="px-2 py-1 bg-gray-200 rounded"
                        onClick={() => updateQty(index, -1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="px-2 py-1 bg-gray-200 rounded"
                        onClick={() => updateQty(index, +1)}
                      >
                        +
                      </button>
                      <button
                        className="ml-2 text-red-500"
                        onClick={() => removeFromCurrentOrder(index)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
              <input
                ref={noteRef}
                value={note ?? ""}
                onChange={(e) => set_note((e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="enter note for Order"
              />
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
                  {placing ? "Submitting.. Order" : "Submit Order"}
                </button>
              </div>
            </div>
          )}

          {/* Menu selection */}
          {inputMethod === "menu" && (
            <div>
              {/* 🔎 Search and Category Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All</option>
                  {[...new Set(menu.map((m) => m.category))].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔲 Grid 2 per row on mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {filteredMenu.map((item) => (
                  <MenuItems key={item.id} item={item} additems={addOrderItem} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default Menu;
