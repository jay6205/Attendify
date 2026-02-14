import React, { useContext } from 'react';
import { LayoutDashboard, Calendar, PieChart, Settings, LogOut, Bot, BookOpen, CheckSquare, FileText, BarChart, Award, TrendingUp } from 'lucide-react';
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
    const { logout, user } = useContext(AuthContext);

    const isActive = (path) => location.pathname === path;
    const role = user?.role || 'student';

    const menuItems = {
        student: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/student" },
            { icon: Award, label: "My Marks", path: "/student/marks" },
            { icon: TrendingUp, label: "Performance", path: "/student/performance" },
            { icon: FileText, label: "My Leaves", path: "/student/leaves" },
            { icon: Bot, label: "AI Advisor", path: "/ai-advisor" },
            { icon: Settings, label: "Settings", path: "/settings" }
        ],
        teacher: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/teacher" },
            { icon: BookOpen, label: "Courses", path: "/teacher/courses" },
            { icon: CheckSquare, label: "Attendance", path: "/teacher/attendance" },
            { icon: Award, label: "Marks", path: "/teacher/marks" },
            { icon: PieChart, label: "Analytics", path: "/teacher/marks/analytics" },
            { icon: TrendingUp, label: "Student Trends", path: "/teacher/student-performance" },
            { icon: FileText, label: "Leaves", path: "/teacher/leaves" },
            { icon: BarChart, label: "Summary", path: "/teacher/summary" }
        ],
        admin: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
            { icon: Settings, label: "System", path: "/admin/system" }
        ]
    };

    const currentMenu = menuItems[role] || menuItems.student;

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
                {currentMenu.map((item) => (
                    <SidebarItem 
                        key={item.path} 
                        icon={item.icon} 
                        label={item.label} 
                        path={item.path} 
                        active={isActive(item.path)} 
                    />
                ))}
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
