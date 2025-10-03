"use client";
const Header = ({ currentPage='' ,navigate}) => (
  <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sticky top-0 z-40">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cafe Zam Zam</h1>
          <p className="text-blue-100 text-sm">Chef Interface</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            
             onClick={() => navigate('/chef')}
            className={`backdrop-blur-sm rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${
              currentPage === 'orders' ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {/* <Clipboard className="w-5 h-5" /> */}
            <span>Orders</span>
          </button>
          <button
           onClick={() => navigate('/chef/menu')}
            className={`rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${
              currentPage === 'new-order' 
                ? 'bg-green-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {/* <Plus className="w-5 h-5" /> */}
            <span>Menu</span>
          </button>
                    <button
           onClick={() => navigate('/chef/history')}
            className={`rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${
              currentPage === 'new-order' 
                ? 'bg-green-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {/* <Plus className="w-5 h-5" /> */}
            <span>History</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default Header