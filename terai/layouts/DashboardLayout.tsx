import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout: React.FC = () => {
    // We'll manage collapsed state at the layout level
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex overflow-hidden">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            
            <motion.div 
                // Animate margin-left based on sidebar state
                initial={false}
                animate={{ 
                    marginLeft: collapsed ? '80px' : '280px', // 5rem vs 17.5rem
                    width: `calc(100% - ${collapsed ? '80px' : '280px'})`
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col min-h-screen relative"
            >
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {/* The Outlet renders the current page (e.g., Screening) */}
                    <Outlet />
                </main>
            </motion.div>
        </div>
    );
};

export default DashboardLayout;
