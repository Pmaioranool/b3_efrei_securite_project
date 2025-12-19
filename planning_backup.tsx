
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, Session, RecurrenceType } from '../context/AppContext';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'F├®vrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Ao├╗t', 'Septembre', 'Octobre', 'Novembre', 'D├®cembre'];

type ViewMode = 'day' | 'week' | 'month' | 'year';

const Planning: React.FC = () => {
  const { sessions, templates, addSession, removeSession } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // Offset en semaines par rapport ├á aujourd'hui
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  
  // States Modal
  const [selectedTemplate, setSelectedTemplate] = useState<Session | null>(null);
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  // Synchroniser la date du planning modal avec la date s├®lectionn├®e
  useEffect(() => {
    setPlanningDate(selectedDate.toISOString().split('T')[0]);
  }, [selectedDate]);

  // Calculer les jours de la semaine (Lundi au Dimanche) bas├®s sur l'offset
  const weekDays = useMemo(() => {
    const now = new Date();
    // Trouver le lundi de la semaine actuelle
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(now.setDate(diff));
    
    // Appliquer l'offset de semaine
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekOffset]);

  const toggleCustomDay = (day: number) => {
    setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handlePlanSession = () => {
    if (!selectedTemplate) return;
    const baseDate = new Date(planningDate);
    const results: Session[] = [];

    if (recurrence === 'none') {
      results.push({ ...selectedTemplate, id: Math.random().toString(36).substr(2, 9), date: baseDate.toISOString(), status: 'planned' });
    } else if (recurrence === 'daily') {
      for (let i = 0; i < recurrenceCount; i++) {
        const d = new Date(baseDate); d.setDate(baseDate.getDate() + i);
        results.push({ ...selectedTemplate, id: Math.random().toString(36).substr(2, 9), date: d.toISOString(), status: 'planned' });
      }
    } else if (recurrence === 'weekly') {
      for (let i = 0; i < recurrenceCount; i++) {
        const d = new Date(baseDate); d.setDate(baseDate.getDate() + (i * 7));
        results.push({ ...selectedTemplate, id: Math.random().toString(36).substr(2, 9), date: d.toISOString(), status: 'planned' });
      }
    }
    results.forEach(s => addSession(s));
    setIsPlanningModalOpen(false);
  };

  const sessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.filter(s => s.date.startsWith(dateStr));
  };

  // --- RENDERS ---

  const renderRoadmap = (date: Date) => {
    const daySessions = sessionsForDate(date);
    return (
      <div className="relative pl-8 space-y-10 animate-in fade-in duration-500 pb-20 mt-4">
        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>
        {daySessions.length === 0 ? (
          <div className="flex flex-col items-start">
             <div className="absolute left-0 size-6 rounded-full bg-zinc-100 dark:bg-zinc-900 border-4 border-zinc-200 dark:border-zinc-800 z-10"></div>
             <div className="bg-zinc-50 dark:bg-zinc-900/40 p-10 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800 w-full text-center">
                <span className="material-symbols-outlined text-4xl text-zinc-300 mb-3">bedtime</span>
                <p className="text-zinc-400 font-black text-sm uppercase tracking-widest">Repos</p>
             </div>
          </div>
        ) : (
          daySessions.map((s) => (
            <div key={s.id} className="relative group">
              <div className={`absolute left-[-32px] top-6 size-6 rounded-full border-4 z-10 ${s.status === 'completed' ? 'bg-green-500 border-green-100 dark:border-green-900 shadow-glow shadow-green-500/30' : 'bg-primary border-red-100 dark:border-red-900 shadow-glow shadow-primary/30'}`}></div>
              <div onClick={() => navigate(`/active-session/${s.id}`)} className="bg-white dark:bg-zinc-900 p-6 rounded-[35px] border border-zinc-100 dark:border-zinc-800 shadow-soft hover:border-primary transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                   <h4 className={`font-black text-xl ${s.status === 'completed' ? 'text-zinc-400 line-through' : ''}`}>{s.name}</h4>
                   <button onClick={(e) => { e.stopPropagation(); removeSession(s.id); }} className="text-zinc-300 hover:text-red-500 p-1">
                     <span className="material-symbols-outlined">close</span>
                   </button>
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{s.exercises.length} exercices ÔÇó {s.durationMinutes} min</p>
                {s.status === 'completed' && <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800 text-green-500 font-bold text-[10px] uppercase flex items-center gap-2"><span className="material-symbols-outlined text-sm filled">check_circle</span>Termin├®</div>}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderWeeklyHeader = () => (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(prev => prev - 1)} className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="text-center">
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{weekDays[0].toLocaleDateString('fr-FR', { month: 'short' })} - {weekDays[6].toLocaleDateString('fr-FR', { month: 'short' })}</p>
           <h3 className="font-black text-sm">Semaine {weekOffset === 0 ? 'Actuelle' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</h3>
        </div>
        <button onClick={() => setWeekOffset(prev => prev + 1)} className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <div className="flex gap-1.5 w-full">
        {weekDays.map((date, i) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <button 
              key={i} 
              onClick={() => { setSelectedDate(date); setViewMode('day'); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${isSelected ? 'bg-primary text-black shadow-glow' : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 text-zinc-400'}`}
            >
              <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-black' : (isToday ? 'text-primary' : 'text-zinc-500')}`}>{DAYS_FR[i]}</span>
              <span className="text-base font-black">{date.getDate()}</span>
              {sessionsForDate(date).length > 0 && <div className={`size-1 rounded-full ${isSelected ? 'bg-black' : 'bg-primary'}`}></div>}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderMonthCarousel = () => (
    <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar max-h-[60vh] snap-y pt-4">
      {MONTHS_FR.map((m, i) => {
        const isCurrent = i === selectedDate.getMonth();
        const sessCount = sessions.filter(s => new Date(s.date).getMonth() === i && new Date(s.date).getFullYear() === selectedDate.getFullYear()).length;
        return (
          <div 
            key={m} 
            onClick={() => { setSelectedDate(new Date(selectedDate.getFullYear(), i, 1)); setViewMode('day'); }}
            className={`snap-center shrink-0 w-full p-8 rounded-[40px] border transition-all cursor-pointer flex items-center justify-between ${isCurrent ? 'bg-primary text-black border-primary shadow-glow scale-[1.02]' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100'}`}
          >
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isCurrent ? 'text-black/60' : 'text-zinc-500'}`}>{selectedDate.getFullYear()}</p>
              <h3 className="text-3xl font-black">{m}</h3>
            </div>
            <div className={`size-16 rounded-3xl flex flex-col items-center justify-center ${isCurrent ? 'bg-black/10' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              <span className="text-xl font-black">{sessCount}</span>
              <span className="text-[8px] font-bold uppercase tracking-tighter">S├®ances</span>
            </div>
          </div>
        )
      })}
    </div>
  );

  const renderYearGrid = () => (
    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom duration-500">
      <div className="bg-zinc-900 text-white p-10 rounded-[50px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-40 bg-primary/20 rounded-full -mr-10 -mt-10 blur-3xl"></div>
        <h3 className="text-4xl font-black tracking-tighter mb-2">{selectedDate.getFullYear()}</h3>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Aper├ºu Annuel</p>
        <div className="mt-8 flex gap-4">
           <div className="bg-white/10 p-4 rounded-3xl flex-1 text-center backdrop-blur-md">
              <span className="block text-2xl font-black">{sessions.filter(s => new Date(s.date).getFullYear() === selectedDate.getFullYear()).length}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">S├®ances</span>
           </div>
           <div className="bg-white/10 p-4 rounded-3xl flex-1 text-center backdrop-blur-md">
              <span className="block text-2xl font-black">12</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Mois suivis</span>
           </div>
        </div>
      </div>
      <button onClick={() => setViewMode('month')} className="w-full py-6 bg-white dark:bg-zinc-900 rounded-[35px] border border-zinc-100 dark:border-zinc-800 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3">
        <span className="material-symbols-outlined">calendar_view_month</span>
        Voir les mois
      </button>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-40">
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-40 border-b border-zinc-100 dark:border-zinc-800/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
           <div>
              <h1 className="text-3xl font-black tracking-tighter capitalize">
                {viewMode === 'day' ? selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : viewMode === 'month' ? 'Calendrier' : 'Ann├®e'}
              </h1>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1">{selectedDate.getFullYear()}</p>
           </div>
           <button onClick={() => { setSelectedDate(new Date()); setWeekOffset(0); setViewMode('day'); }} className="size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:text-primary transition-all active:scale-90">
             <span className="material-symbols-outlined text-2xl font-black">today</span>
           </button>
        </div>

        <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-[22px]">
          {(['day', 'month', 'year'] as ViewMode[]).map(mode => (
            <button 
              key={mode} 
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all ${viewMode === mode ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm' : 'text-zinc-400'}`}
            >
              {mode === 'day' ? 'Jour' : mode === 'month' ? 'Mois' : 'An'}
            </button>
          ))}
        </div>

        {viewMode === 'day' && renderWeeklyHeader()}
      </header>

      <main className="px-6 mt-6 max-w-2xl mx-auto">
        {viewMode === 'day' && renderRoadmap(selectedDate)}
        {viewMode === 'month' && renderMonthCarousel()}
        {viewMode === 'year' && renderYearGrid()}
      </main>

      <div className="fixed bottom-24 left-0 right-0 z-40 px-6 flex justify-center">
        <button onClick={() => setIsPlanningModalOpen(true)} className="w-full max-w-sm bg-zinc-900 dark:bg-white text-white dark:text-black shadow-2xl rounded-[35px] h-16 flex items-center justify-center gap-3 font-black text-base uppercase tracking-wider transition-all hover:scale-105 active:scale-95">
          <span className="material-symbols-outlined font-black">calendar_add_on</span>
          Placer une s├®ance
        </button>
      </div>

      {isPlanningModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#150a0a] w-full max-w-md rounded-t-[50px] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black tracking-tighter">Planification</h2>
              <button onClick={() => setIsPlanningModalOpen(false)} className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">Mod├¿le</label>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => setSelectedTemplate(t)} className={`shrink-0 px-8 py-6 rounded-[35px] border-2 transition-all text-left min-w-[180px] ${selectedTemplate?.id === t.id ? 'bg-primary text-black border-primary' : 'bg-zinc-50 dark:bg-zinc-900 border-transparent'}`}>
                      <p className="font-black text-base truncate">{t.name}</p>
                      <p className="text-[10px] font-black uppercase mt-1 opacity-60">{t.exercises.length} ex.</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">Date</label>
                <input type="date" value={planningDate} onChange={e => setPlanningDate(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-[25px] p-5 font-black text-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">R├®p├®tition</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'daily', 'weekly'] as RecurrenceType[]).map(r => (
                    <button key={r} onClick={() => setRecurrence(r)} className={`py-4 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all ${recurrence === r ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                      {r === 'none' ? 'Unique' : r === 'daily' ? 'Jour' : 'Sem'}
                    </button>
                  ))}
                </div>
                {recurrence !== 'none' && (
                  <div className="mt-4 p-5 bg-zinc-50 dark:bg-zinc-900 rounded-[25px] flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-400 uppercase">Occurrences</span>
                    <input type="number" value={recurrenceCount} onChange={e => setRecurrenceCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 bg-transparent border-none text-right font-black text-primary focus:ring-0" />
                  </div>
                )}
              </div>
              <button onClick={handlePlanSession} disabled={!selectedTemplate} className="w-full py-6 bg-primary text-black font-black text-xl rounded-[35px] shadow-glow active:scale-95 disabled:opacity-30 mt-6">CONFIRMER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;
