import React from 'react';
import Header from './Header';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 text-gray-900">
            <Header />
            <main className="container mx-auto p-4 md:p-6">
                {children}
            </main>
        </div>
    );
};

export default Layout;
