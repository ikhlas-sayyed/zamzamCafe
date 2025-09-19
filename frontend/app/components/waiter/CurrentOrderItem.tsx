"use client";

import api from "~/services/api";

const CurrentOrderItem = ({ item, onRemove,index:number }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-3">
      <img src={api.defaults.baseURL+item.image} crossOrigin="anonymous" alt={item.name} className="w-12 h-12 object-cover rounded" />
      <div>
        <h4 className="font-semibold">{item.name}</h4>
        <p className="text-sm text-gray-600">₹{item.price} x {item.quantity}</p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <span className="font-bold">₹{item.price * item.quantity}</span>
      <button
        onClick={() => onRemove(index)}
        className="text-red-500 hover:text-red-700"
      >
        {/* <Trash2 className="w-5 h-5" /> */}
      </button>
    </div>
  </div>
);

export default CurrentOrderItem;