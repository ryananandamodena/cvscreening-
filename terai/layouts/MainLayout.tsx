import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatbot from '../components/AIChatbot';

const MainLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-900 dark:text-[var(--text-main)] overflow-hidden font-inter">
            {/* Sidebar */}
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            {/* Main Content Area */}
            <div
                className="flex-1 flex flex-col min-w-0 transition-all duration-300"
                style={{ marginLeft: sidebarCollapsed ? 88 : 280 }}
            >
                {/* Header */}
                <Header collapsed={sidebarCollapsed} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="w-full max-w-[1600px] mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
            <AIChatbot />
        </div>
    );
};

export default MainLayout;
