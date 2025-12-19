import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark transition-colors duration-300">
      {/* Container principal responsive */}
      <div className="flex-1 w-full max-w-screen-xl mx-auto pb-24 md:pb-0 md:pl-20 lg:pl-24">
        <main className="w-full h-full p-0 md:p-6 lg:p-10">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;