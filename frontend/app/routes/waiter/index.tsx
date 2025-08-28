// import { Menu } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Menu from "./menu";
// import Menu from 'menu.tsx';


export default function App() {
  return (
    <Router>
      <div className="p-4">
        <nav className="flex gap-4 mb-6">
          <Link to="/menu" className="text-blue-600 hover:underline">
            Menu
          </Link>
          <Link to="/orders" className="text-blue-600 hover:underline">
            Orders
          </Link>
        </nav>

        <Routes>
          <Route path="/menu" element={< Menu/>} />
          {/* <Route path="/orders" element={<OrdersPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}
