import React, { useContext } from 'react';
import { LayoutDashboard, Calendar, PieChart, Settings, LogOut, Bot } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
  <Link 
    to={path} 
    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
      active 
        ? 'bg-indigo-600 text-white' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium hidden md:block">{label}</span>
  </Link>
);

const Sidebar = () => {
    const location = useLocation();
    const { logout } = useContext(AuthContext);

    const isActive = (path) => location.pathname === path;

    return (
        <div className="w-16 md:w-64 h-screen bg-slate-900 border-r border-slate-800 p-4 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-10 pl-2">
                <img 
                    src="/Gemini_Generated_Image_71kxcc71kxcc71kx.png" 
                    alt="Attendify Logo" 
                    className="w-8 h-8 rounded-lg object-cover"
                />
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hidden md:block">
                    Attendify
                </h1>
            </div>

            <nav className="flex-1 space-y-2">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={isActive('/')} />

                <SidebarItem icon={Calendar} label="Timetable" path="/timetable" active={isActive('/timetable')} />
                <SidebarItem icon={PieChart} label="Analytics" path="/analytics" active={isActive('/analytics')} />
                <SidebarItem icon={Bot} label="AI Advisor" path="/ai-advisor" active={isActive('/ai-advisor')} />
                <SidebarItem icon={Settings} label="Settings" path="/settings" active={isActive('/settings')} />
            </nav>

            <div className="pt-6 border-t border-slate-800">
                <button 
                    onClick={logout}
                    className="w-full flex items-center space-x-3 p-3 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium hidden md:block">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
