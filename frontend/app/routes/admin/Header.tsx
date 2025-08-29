import React from 'react'
import { FileText, Printer, X, LayoutList, ShoppingCart, PlusCircle } from 'lucide-react';
export default function Header({navigate}:{navigate:(agr0:string)=>void}) {
  return (
     <>
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4" onClick={()=>{navigate('/admin')}}>Admin Panel</h2>
        <nav className="flex flex-col gap-4">
          <button
           onClick={()=>{navigate('/admin/menu')}}
           className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <LayoutList className="w-5 h-5" />
            Menu Management
          </button>
          <button
           onClick={()=>{navigate('/admin/orders')}}
           className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ShoppingCart className="w-5 h-5" />
            Orders
          </button>
          <button 
          onClick={()=>{navigate('/admin/addOrder')}}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <PlusCircle className="w-5 h-5" />
            Add Orders
          </button>
          <button 
          onClick={()=>{navigate('/admin/users')}}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <PlusCircle className="w-5 h-5" />
            Users
          </button>
        <button
        onClick={()=>{navigate('/admin/insights')}} 
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            {/* <PlusCircle className="w-5 h-5" /> */}
            Insights
          </button>
        </nav>
      </aside>
      </>
  )
}
