
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getLinkClass = (path: string) => {
    const isActive = currentPath === path;
    return `flex flex-col md:flex-row items-center gap-1 md:gap-4 p-3 md:p-4 rounded-xl transition-all ${
      isActive 
        ? 'text-primary bg-primary/5 font-bold' 
        : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
    }`;
  };

  const getIconClass = (path: string) => {
    const isActive = currentPath === path;
    return `material-symbols-outlined ${isActive ? 'filled' : ''}`;
  };

  const navItems = [
    { path: '/', label: 'Accueil', icon: 'home' },
    { path: '/stats', label: 'Stats', icon: 'bar_chart' },
    { path: '/workouts', label: 'Séances', icon: 'fitness_center' },
    { path: '/planning', label: 'Planning', icon: 'calendar_month' },
    { path: '/profile', label: 'Profil', icon: 'person' },
  ];

  return (
    <>
      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 pb-6 pt-2 z-50 px-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={getLinkClass(item.path)}>
              <span className={getIconClass(item.path)}>{item.icon}</span>
              <span className="text-[9px] font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* PC/Tablet Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-64 flex-col bg-white dark:bg-[#150a0a] border-r border-gray-100 dark:border-white/5 p-4 z-50">
        <div className="flex items-center gap-3 mb-10 px-2 lg:px-4 pt-4">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <span className="material-symbols-outlined text-white">fitness_center</span>
          </div>
          <h1 className="hidden lg:block font-bold text-xl tracking-tighter">GymTracker</h1>
        </div>
        
        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={getLinkClass(item.path)}>
              <span className={getIconClass(item.path)} style={{ fontSize: '28px' }}>{item.icon}</span>
              <span className="hidden lg:block text-sm">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto">
          <Link to="/profile" className="flex items-center gap-3 p-3 lg:p-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <div className="size-10 rounded-full bg-primary/20 border border-primary/20 overflow-hidden">
               <img src="https://picsum.photos/seed/alex/100/100" alt="Avatar" />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-bold truncate">Alexandre</span>
              <span className="text-xs text-gray-500">Premium</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
