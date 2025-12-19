import React from 'react';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white" style={{ fontSize: '24px' }}>arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-2">Notifications</h1>
          <button className="flex items-center justify-end">
            <p className="text-primary text-sm font-bold leading-normal tracking-wide hover:opacity-80 transition-opacity">Mark all read</p>
          </button>
        </div>
      </header>

      <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary pl-3 pr-4 shadow-sm shadow-primary/30 transition-transform active:scale-95">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>check</span>
          <span className="text-white text-sm font-semibold">All</span>
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 pl-3 pr-4 shadow-sm transition-transform active:scale-95">
          <span className="material-symbols-outlined text-slate-500 dark:text-slate-400" style={{ fontSize: '18px' }}>notifications</span>
          <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Reminders</span>
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 pl-3 pr-4 shadow-sm transition-transform active:scale-95">
          <span className="material-symbols-outlined text-slate-500 dark:text-slate-400" style={{ fontSize: '18px' }}>show_chart</span>
          <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Updates</span>
        </button>
      </div>

      <div className="flex flex-col flex-1 pb-8">
        <div className="px-4 py-2 mt-2">
          <h4 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Today</h4>
        </div>
        
        {/* Unread Item */}
        <div className="group relative flex items-start gap-4 px-4 py-4 hover:bg-white dark:hover:bg-surface-dark transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
          <div className="flex items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 shrink-0 size-12 text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>fitness_center</span>
          </div>
          <div className="flex flex-col justify-center flex-1 pr-4">
            <div className="flex justify-between items-baseline mb-0.5">
              <p className="text-slate-900 dark:text-white text-base font-semibold leading-tight line-clamp-1">Time for your Leg Day!</p>
              <span className="text-primary text-xs font-medium shrink-0 ml-2">2m ago</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed line-clamp-2">Stay consistent to see results. Your plan is waiting for you.</p>
          </div>
        </div>

        {/* Read Item */}
        <div className="group relative flex items-start gap-4 px-4 py-4 hover:bg-white dark:hover:bg-surface-dark transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0">
          <div className="flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0 size-12 text-amber-600 dark:text-amber-500">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>emoji_events</span>
          </div>
          <div className="flex flex-col justify-center flex-1">
            <div className="flex justify-between items-baseline mb-0.5">
              <p className="text-slate-900 dark:text-slate-200 text-base font-medium leading-tight line-clamp-1">New Personal Best: 5k Run</p>
              <span className="text-slate-400 text-xs font-normal shrink-0 ml-2">2h ago</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed line-clamp-2">You crushed your previous record! Check out your stats.</p>
          </div>
        </div>

        <div className="px-4 py-2 mt-4">
          <h4 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Yesterday</h4>
        </div>

        <div className="group relative flex items-start gap-4 px-4 py-4 hover:bg-white dark:hover:bg-surface-dark transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0">
          <div className="flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0 size-12 text-blue-600 dark:text-blue-500">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>insights</span>
          </div>
          <div className="flex flex-col justify-center flex-1">
            <div className="flex justify-between items-baseline mb-0.5">
              <p className="text-slate-900 dark:text-slate-200 text-base font-medium leading-tight line-clamp-1">Weekly Summary Available</p>
              <span className="text-slate-400 text-xs font-normal shrink-0 ml-2">10:30 AM</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed line-clamp-2">See how you performed this week compared to your goals.</p>
          </div>
        </div>
        
        <div className="group relative flex items-start gap-4 px-4 py-4 hover:bg-white dark:hover:bg-surface-dark transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
          <div className="flex items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0 size-12 text-orange-600 dark:text-orange-500">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>local_fire_department</span>
          </div>
          <div className="flex flex-col justify-center flex-1 pr-4">
            <div className="flex justify-between items-baseline mb-0.5">
              <p className="text-slate-900 dark:text-white text-base font-semibold leading-tight line-clamp-1">Don't break your streak!</p>
              <span className="text-primary text-xs font-medium shrink-0 ml-2">Yesterday</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed line-clamp-2">You're on a 5-day streak. Keep it up!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;