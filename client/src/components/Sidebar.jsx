import React, { useContext } from 'react';
import { LayoutDashboard, Calendar, PieChart, Settings, LogOut, Bot, BookOpen, CheckSquare, FileText, BarChart, BarChart2, Award, TrendingUp, Shield, Building2, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
    <Link
        to={path}
        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${active
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
    const { logout, user, loginAs } = useContext(AuthContext);

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
        // Parent gets a filtered view — no feedback, leaves, or marks
        parent: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/student" },
            { icon: TrendingUp, label: "Performance", path: "/student/performance" },
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
            { icon: BarChart, label: "Summary", path: "/teacher/summary" },
            { icon: MessageSquare, label: "Feedback", path: "/teacher/feedback" },
            { icon: MessageSquare, label: "Create Feedback", path: "/teacher/feedback/create" },
            { icon: Bot, label: "AI Advisor", path: "/ai-advisor" },
            { icon: FileText, label: "Question Paper", path: "/teacher/question-paper/create" }
        ],
        admin: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
            { icon: Settings, label: "System", path: "/admin/system" },
            { icon: MessageSquare, label: "Create Feedback", path: "/admin/feedback/create" },
            { icon: MessageSquare, label: "Feedback Summary", path: "/admin/feedback" }
        ],
        super_admin: [
            { icon: LayoutDashboard, label: "Overview", path: "/super-admin" },
            { icon: Building2, label: "Organizations", path: "/super-admin/organizations" },
            { icon: Shield, label: "Admins", path: "/super-admin/admins" },
            { icon: BarChart2, label: "Usage", path: "/super-admin/usage" }
        ]
    };

    // Use parent menu when logged in via parent portal, regardless of DB role
    const effectiveRole = loginAs === 'parent' ? 'parent' : role;
    const currentMenu = menuItems[effectiveRole] || menuItems.student;



    return (

        <div className="w-16 md:w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Header - Fixed at Top */}
            <div className="p-4 flex items-center space-x-3 pl-6 mb-2 flex-shrink-0">
                <img
                    src="/Gemini_Generated_Image_71kxcc71kxcc71kx.png"
                    alt="Attendify Logo"
                    className="w-8 h-8 rounded-lg object-cover"
                />
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hidden md:block">
                    Attendify
                </h1>
            </div>

            {/* Scrollable Navigation Area */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pb-4">
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

            {/* Logout - Fixed at Bottom */}
            <div className="p-4 border-t border-slate-800 flex-shrink-0">
                <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 p-3 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors rounded-lg hover:bg-slate-800/50"
                >
                    <LogOut size={20} />
                    <span className="font-medium hidden md:block">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
