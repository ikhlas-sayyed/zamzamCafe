
"use client";
const MenuItems = ({ item,additems }) => (
  <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    <img src={item.image} alt={item.name} className="w-full h-32 object-cover" />
    <div className="p-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">ID: {item.id}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-bold text-blue-600">₹{item.price}</span>
        <button
          onClick={() => additems(item.id,1,item.name,item.price,item.image)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  </div>
);

export default MenuItems