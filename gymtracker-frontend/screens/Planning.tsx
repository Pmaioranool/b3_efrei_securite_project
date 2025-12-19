import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, Session, RecurrenceType } from '../context/AppContext';
import workoutService, { Workout } from '../services/workoutService';
import routineService from '../services/routineService';
import userService from '../services/userService';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

type ViewMode = 'day' | 'week' | 'month' | 'year';

const Planning: React.FC = () => {
  const { sessions, addSession, removeSession } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [apiWorkouts, setApiWorkouts] = useState<any[]>([]);
  const [apiTemplates, setApiTemplates] = useState<any[]>([]);
  const [apiRoutines, setApiRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States Modal
  const [selectedSeance, setSelectedSeance] = useState<Workout | null>(null);
  const [selectedSeanceId, setSelectedSeanceId] = useState<string>("");
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  // Cron builder states
  const [useAdvancedCron, setUseAdvancedCron] = useState(false);
  const [cronMinute, setCronMinute] = useState('0');
  const [cronHour, setCronHour] = useState('6');
  const [cronDayOfMonth, setCronDayOfMonth] = useState('*');
  const [cronMonth, setCronMonth] = useState('*');
  const [cronDayOfWeek, setCronDayOfWeek] = useState('*');
  const [cronRaw, setCronRaw] = useState('0 6 * * *');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [cronValid, setCronValid] = useState(true);
  const [cronError, setCronError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Load API workouts and routines
  useEffect(() => {
    loadPlanningData();
  }, []);

  const loadPlanningData = async () => {
    try {
      const [workouts, routines] = await Promise.allSettled([
        workoutService.getWorkouts(),
        routineService.getMyRoutines()
      ]);
      if (workouts.status === 'fulfilled') setApiWorkouts(workouts.value);
      if (routines.status === 'fulfilled') setApiRoutines(routines.value);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

    // Calculer les jours de la semaine (Lundi au Dimanche) basés sur l'offset
    const weekDays = useMemo(() => {
      const now = new Date();
      // Trouver le lundi de la semaine actuelle
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));

      // Appliquer l'offset de semaine
      monday.setDate(monday.getDate() + (weekOffset * 7));

      const days: Date[] = [];
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

  const buildCron = () => {
    if (useAdvancedCron) return cronRaw.trim();
    return `${cronMinute} ${cronHour} ${cronDayOfMonth} ${cronMonth} ${cronDayOfWeek}`;
  };

  const validateCron = (expr: string) => {
    const re = /^\s*([0-9*/,-]+)\s+([0-9*/,-]+)\s+([0-9*/,-]+)\s+([0-9*/,-]+)\s+([0-9*/,-]+)\s*$/;
    const ok = re.test(expr);
    setCronValid(ok);
    setCronError(ok ? null : 'Expression CRON invalide. Format attendu: "min heure jour mois jourSemaine"');
  };

  useEffect(() => {
    validateCron(buildCron());
  }, [useAdvancedCron, cronRaw, cronMinute, cronHour, cronDayOfMonth, cronMonth, cronDayOfWeek]);

  const handlePlanSession = async () => {
    if (!selectedSeanceId || !selectedSeance) return;
    if (!cronValid) return;

    try {
      const cronExpression = buildCron();
      const workoutId = String((selectedSeance as any)?.id ?? (selectedSeance as any)?._id);
      // Create routine referencing the selected workout (séance)
      // userId comes from JWT token on backend
      const routine = await routineService.createRoutine({
        workoutId,
        cron: cronExpression,
        timezone,
      });
      // For immediate feedback, create first workout
      const firstWorkout = { 
        ...selectedSeance, 
        id: Math.random().toString(36).substr(2, 9), 
        date: new Date(planningDate).toISOString(), 
        status: 'planned' as const
      };
      addSession(firstWorkout as any);

      setIsPlanningModalOpen(false);
      // Reload planning data (workouts + routines)
      await loadPlanningData();
    } catch (error) {
      console.error('Erreur lors de la création de la routine:', error);
      // Fallback: create as single workout
      const session = { 
        ...selectedSeance, 
        id: Math.random().toString(36).substr(2, 9), 
        date: new Date(planningDate).toISOString(), 
        status: 'planned' as const
      };
      addSession(session as any);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Delete the workout
      await workoutService.deleteWorkout(id);
      removeSession(id);
      setApiWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      removeSession(id);
    }
  };

  const sessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return apiWorkouts.filter(s => s.date && s.date.startsWith(dateStr));
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
                   <button onClick={(e) => handleDeleteSession(s.id, e)} className="text-zinc-300 hover:text-red-500 p-1">
                     <span className="material-symbols-outlined">close</span>
                   </button>
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{s.exercises.length} exercices • {s.durationMinutes} min</p>
                {s.status === 'completed' && <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800 text-green-500 font-bold text-[10px] uppercase flex items-center gap-2"><span className="material-symbols-outlined text-sm filled">check_circle</span>Terminé</div>}
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
        <button onClick={() => {
          setWeekOffset(prev => {
            const next = prev - 1;
            if (next < -52) setCurrentYear(y => y - 1);
            return next;
          });
        }} className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="text-center">
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{weekDays[0].toLocaleDateString('fr-FR', { month: 'short' })} - {weekDays[6].toLocaleDateString('fr-FR', { month: 'short' })} • {currentYear}</p>
           <h3 className="font-black text-sm">Semaine {weekOffset === 0 ? 'Actuelle' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</h3>
        </div>
        <button onClick={() => {
          setWeekOffset(prev => {
            const next = prev + 1;
            if (next > 52) setCurrentYear(y => y + 1);
            return next;
          });
        }} className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-primary/10 transition-colors">
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

  // MAIN RETURN
  return (
    <div className="space-y-6 pb-20">
      <header className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black tracking-tight">Planning</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
              className="size-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full flex items-center justify-center shadow-soft hover:border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">{viewMode === 'day' ? 'calendar_view_day' : 'calendar_view_week'}</span>
            </button>
            <button 
              onClick={() => setIsPlanningModalOpen(true)}
              className="size-10 bg-primary text-black rounded-full flex items-center justify-center shadow-glow"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500">Organisez vos entraînements</p>
      </header>

      <main className="px-4">
        {/* Mes routines planifiées */}
        {apiRoutines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">Routines actives</h3>
            <div className="space-y-2">
              {apiRoutines.map((r: any) => (
                <div key={r.id ?? r._id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{r.name || 'Routine planifiée'}</p>
                    <p className="text-xs text-zinc-400">CRON: {r.cron} • {r.timezone || 'Europe/Paris'}</p>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await routineService.deleteRoutine(r.id ?? r._id);
                        await loadPlanningData();
                      } catch (error) {
                        console.error('Erreur suppression routine:', error);
                      }
                    }}
                    className="text-zinc-400 hover:text-red-500 p-2"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && viewMode === 'day' ? (
          <div className="text-center py-20 opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4 animate-pulse">calendar_today</span>
            <p className="font-bold">Chargement...</p>
          </div>
        ) : (
          <>
            {viewMode === 'day' && (
              <>
                {renderWeeklyHeader()}
                {renderRoadmap(selectedDate)}
              </>
            )}
          </>
        )}
      </main>

      {/* MODAL */}
      {isPlanningModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6">Planifier une séance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Choisir une séance</label>
                <select 
                  value={selectedSeanceId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSeanceId(val);
                    const found = apiWorkouts.find((w: any) => String(w.id ?? w._id) === val) || null;
                    setSelectedSeance(found as any);
                  }}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 dark:bg-zinc-800"
                >
                  <option value="" key="empty-workout">Sélectionner une séance</option>
                  {apiWorkouts.map((w: any) => (
                    <option key={String(w.id ?? w._id)} value={String(w.id ?? w._id)}>{w.name ?? w.title ?? 'Séance'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Date</label>
                <input 
                  type="date" 
                  value={planningDate}
                  onChange={(e) => setPlanningDate(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">CRON personnalisable</label>
                <div className="flex items-center gap-2 mb-2">
                  <input id="advancedCron" type="checkbox" checked={useAdvancedCron} onChange={(e) => setUseAdvancedCron(e.target.checked)} />
                  <label htmlFor="advancedCron" className="text-sm">Mode avancé (expression brute)</label>
                </div>
                {!useAdvancedCron ? (
                  <div className="grid grid-cols-5 gap-2">
                    <input value={cronMinute} onChange={(e) => setCronMinute(e.target.value)} placeholder="Min" className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 dark:bg-zinc-800" />
                    <input value={cronHour} onChange={(e) => setCronHour(e.target.value)} placeholder="Heure" className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 dark:bg-zinc-800" />
                    <input value={cronDayOfMonth} onChange={(e) => setCronDayOfMonth(e.target.value)} placeholder="Jour" className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 dark:bg-zinc-800" />
                    <input value={cronMonth} onChange={(e) => setCronMonth(e.target.value)} placeholder="Mois" className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 dark:bg-zinc-800" />
                    <input value={cronDayOfWeek} onChange={(e) => setCronDayOfWeek(e.target.value)} placeholder="Sem." className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 dark:bg-zinc-800" />
                  </div>
                ) : (
                  <input value={cronRaw} onChange={(e) => setCronRaw(e.target.value)} placeholder="0 6 * * *" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 dark:bg-zinc-800" />
                )}
                <p className={`mt-2 text-xs font-bold ${cronValid ? 'text-green-600' : 'text-red-500'}`}>{cronValid ? 'Expression CRON valide' : (cronError || 'Expression CRON invalide')}</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Timezone</label>
                <input 
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Europe/Paris"
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 dark:bg-zinc-800"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsPlanningModalOpen(false)}
                className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold"
              >
                Annuler
              </button>
              <button 
                onClick={handlePlanSession}
                disabled={!selectedSeanceId || !cronValid || !timezone}
                className={`flex-1 py-3 rounded-2xl font-bold ${(!selectedSeanceId || !cronValid || !timezone) ? 'bg-zinc-300 text-zinc-600 cursor-not-allowed' : 'bg-primary text-black'}`}
              >
                Planifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;
