import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-inter">
            {/* Sidebar */}
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Header */}
                <Header collapsed={sidebarCollapsed} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="w-full animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
