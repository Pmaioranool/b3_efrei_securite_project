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

  const [viewMode, setViewMode] = useState<ViewMode>('day'); // 'day' shows the weekly strip detailed, 'month' shows the calendar
  const [selectedDate, setSelectedDate] = useState(new Date()); // The specific day selected
  const [displayDate, setDisplayDate] = useState(new Date()); // The reference date for the current view (Month or Week)
  // const [weekOffset, setWeekOffset] = useState(0); // REMOVED
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
  // cycleConfig is now just the total length "1".."4"
  // But we need to keep track of WHICH weeks are active.
  const [cycleLength, setCycleLength] = useState(1);
  const [activeWeeks, setActiveWeeks] = useState<number[]>([1]); // Array of active week indices (1-based)
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
  // Helpers for navigation
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  const weekDays = useMemo(() => {
    const monday = getStartOfWeek(displayDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [displayDate]);

  const monthStats = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0=Mon, 6=Sun

    return { year, month, daysInMonth, startingDayOfWeek };
  }, [displayDate]);

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

    try {
      if (recurrence === 'none') {
        // One-off session
        // Create standard JS Date from inputs
        const fullDate = new Date(`${planningDate}T${cronHour.padStart(2, '0')}:${cronMinute.padStart(2, '0')}:00`);

        const session = {
          ...selectedSeance,
          id: Math.random().toString(36).substr(2, 9),
          date: fullDate.toISOString(),
          status: 'planned' as const
        };
        addSession(session as any);
        // Note: Ideally we should POST to backend here if we want persistence of planned sessions without routines.
        // For now, consistent with existing logic.
      } else {
        // Recurring Routine
        if (customDays.length === 0) {
          alert("Veuillez sélectionner au moins un jour de la semaine.");
          return;
        }

        // Build CRON: min hour * * days
        const cronExpression = `${Number(cronMinute)} ${Number(cronHour)} * * ${customDays.join(',')}`;
        const workoutId = String((selectedSeance as any)?.id ?? (selectedSeance as any)?._id);

        await routineService.createRoutine({
          workoutId,
          cron: cronExpression,
          timezone,
          intervalWeeks: cycleLength,
          activeWeeks,
          startDate: planningDate // Pass selected start date
        });
      }

      setIsPlanningModalOpen(false);
      await loadPlanningData();
    } catch (error) {
      console.error('Erreur lors de la planification:', error);
      alert("Erreur lors de la planification");
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if it's a routine (virtual session)
    if (id.startsWith('routine-')) {
      // Format: routine-{id}-{timestamp}
      // Extract the real routine ID (middle part)
      const parts = id.split('-');
      // parts[0] = "routine"
      // parts[1] = id (MongoDB ObjectId)
      // parts[2] = timestamp
      const routineId = parts[1];

      if (!routineId) return;

      if (window.confirm("Voulez-vous supprimer cette routine récurrente ? Cela supprimera toutes les futures occurrences.")) {
        try {
          await routineService.deleteRoutine(routineId);
          await loadPlanningData(); // Refresh everything
        } catch (error) {
          console.error('Erreur lors de la suppression de la routine:', error);
          alert("Impossible de supprimer la routine.");
        }
      }
      return;
    }

    // Standard workout deletion
    try {
      await workoutService.deleteWorkout(id);
      removeSession(id);
      setApiWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      // Optimistic removal fallback
      removeSession(id);
    }
  };

  const sessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const realSessions = apiWorkouts.filter(s => s.date && s.date.startsWith(dateStr));

    // Generate virtual sessions from routines
    const virtualSessions = generateRecurringSessions(apiRoutines, date);
    // Filter virtual sessions for this specific day
    const dayVirtual = virtualSessions.filter(s => s.date.startsWith(dateStr));

    // Deduplicate? If a real session exists with same routineId and close timestamp?
    // For now simple concat.
    return [...realSessions, ...dayVirtual];
  };

  // --- HELPER: Generate Recurring Sessions ---
  const generateRecurringSessions = (
    routines: any[],
    viewDate: Date
  ): any[] => {
    // We want to generate sessions for the week surrounding viewDate
    // Let's find the Monday of that week
    const currentDay = viewDate.getDay();
    const diff = viewDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(viewDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const generatedSessions: any[] = [];

    routines.forEach(routine => {
      if (!routine.cron || !routine.startDate) return;

      const routineStart = new Date(routine.startDate);
      routineStart.setHours(0, 0, 0, 0);

      // Calculate week difference
      // We assume weeks start on Monday
      // Get routine start Monday
      const rDay = routineStart.getDay();
      const rDiff = routineStart.getDate() - rDay + (rDay === 0 ? -6 : 1);
      const rMonday = new Date(routineStart);
      rMonday.setDate(rDiff);
      rMonday.setHours(0, 0, 0, 0);

      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weekDiff = Math.floor((monday.getTime() - rMonday.getTime()) / msPerWeek);

      // If viewing a week before the routine starts, skip (or maybe show if within the start week?)
      if (weekDiff < 0) return;

      // Determine cycle index (1-based)
      const interval = routine.intervalWeeks || 1;
      const cycleIndex = (weekDiff % interval) + 1;

      // Check if this week is active
      const activeWeeks = routine.activeWeeks || [1];
      if (!activeWeeks.includes(cycleIndex)) return;

      // Parse CRON (simple parser for "min hour * * days")
      // We know our format: "min hour * * days"
      const parts = routine.cron.split(' ');
      if (parts.length < 5) return;

      const [min, hour, , , daysStr] = parts;
      const validDays = daysStr.split(',').map(Number); // 1=Mon, 7=Sun, 0=Sun (node-cron)

      // Our weekDays array (Mon to Sun)
      // Check each day of the current view week
      for (let i = 0; i < 7; i++) {
        // i=0 is Monday (cron 1)
        // i=6 is Sunday (cron 0 or 7)
        const currentCronDay = (i === 6) ? 0 : i + 1;

        if (validDays.includes(currentCronDay)) {
          // It's a match! Create a virtual session
          const sessionDate = new Date(monday);
          sessionDate.setDate(monday.getDate() + i);
          sessionDate.setHours(parseInt(hour), parseInt(min), 0, 0);

          // Check if a real session already exists at this time (deduplication)
          // Rough check: same day and workout ID? Or just display it as "Planned"?
          // For now, let's just add it as 'routine-planned'

          generatedSessions.push({
            id: `routine-${routine._id || routine.id}-${sessionDate.getTime()}`,
            name: routine.workoutId?.name || routine.name || 'Séance Planifiée',
            // If workoutId is populated, use it. If not, might be just ID.
            exercises: routine.workoutId?.exercises || [],
            durationMinutes: 60, // Default or estimate
            date: sessionDate.toISOString(),
            status: 'planned',
            isRoutine: true,
            routineId: routine._id || routine.id
          });
        }
      }
    });

    return generatedSessions;
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

  const handlePrev = () => {
    const newDate = new Date(displayDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setDisplayDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(displayDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setDisplayDate(newDate);
  };

  const handleToday = () => {
    const now = new Date();
    setDisplayDate(now);
    setSelectedDate(now);
  };

  const renderMonthGrid = () => {
    const { year, month, daysInMonth, startingDayOfWeek } = monthStats;
    const blanks = Array.from({ length: startingDayOfWeek }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_FR.map(d => <div key={d} className="text-center text-[10px] uppercase font-black text-zinc-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {blanks.map(i => <div key={`blank-${i}`} className="aspect-square"></div>)}
          {days.map(day => {
            const date = new Date(year, month, day);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const hasSession = sessionsForDate(date).length > 0;

            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDate(date);
                  // Switch to day view (week view) centered on this date
                  setDisplayDate(date);
                  setViewMode('day');
                }}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all
                  ${isSelected ? 'bg-primary text-black shadow-glow' : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-primary'}
                `}
              >
                <span className={`text-sm font-black ${isSelected ? 'text-black' : (isToday ? 'text-primary' : '')}`}>{day}</span>
                {hasSession && (
                  <div className={`mt-1 size-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-primary'}`}></div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    );
  };

  const renderWeeklyHeader = () => (
    <div className="mt-4 space-y-4">
      {/* Navigation Controls used for both views now, can be moved up if desired, genericizing here */}
      <div className="flex items-center justify-between">
        <button onClick={handlePrev} className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="text-center cursor-pointer" onClick={handleToday} title="Revenir à aujourd'hui">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            {viewMode === 'month' ? (
              `${MONTHS_FR[displayDate.getMonth()]} ${displayDate.getFullYear()}`
            ) : (
              `Semaine du ${weekDays[0].getDate().toString().padStart(2, '0')}/${(weekDays[0].getMonth() + 1).toString().padStart(2, '0')} au ${weekDays[6].getDate().toString().padStart(2, '0')}/${(weekDays[6].getMonth() + 1).toString().padStart(2, '0')}`
            )}
          </p>
          <h3 className="font-black text-sm">
            {viewMode === 'month' ? 'Vue Mensuelle' : (
              displayDate.toDateString() === new Date().toDateString() || (displayDate >= getStartOfWeek(new Date()) && displayDate < new Date(getStartOfWeek(new Date()).getTime() + 7 * 24 * 3600 * 1000))
                ? 'Semaine Actuelle'
                : `Semaine ${getWeekNumber(displayDate)}`
            )}
          </h3>
        </div>
        <button onClick={handleNext} className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {viewMode === 'day' && (
        <div className="flex gap-1.5 w-full">
          {weekDays.map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <button
                key={i}
                onClick={() => { setSelectedDate(date); }}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${isSelected ? 'bg-primary text-black shadow-glow' : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 text-zinc-400'}`}
              >
                <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-black' : (isToday ? 'text-primary' : 'text-zinc-500')}`}>{DAYS_FR[i]}</span>
                <span className="text-base font-black">{date.getDate()}</span>
                {sessionsForDate(date).length > 0 && <div className={`size-1 rounded-full ${isSelected ? 'bg-black' : 'bg-primary'}`}></div>}
              </button>
            )
          })}
        </div>
      )}
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
              onClick={() => {
                if (viewMode === 'day') {
                  setViewMode('month');
                } else {
                  setViewMode('day');
                  // Sync display date to selected date when switching back to day view to ensure we see the selection
                  setDisplayDate(selectedDate);
                }
              }}
              className="size-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full flex items-center justify-center shadow-soft hover:border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">{viewMode === 'day' ? 'calendar_month' : 'view_week'}</span>
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
            {renderWeeklyHeader()}

            {viewMode === 'month' && renderMonthGrid()}

            {/* Show sessions only in day/week mode, as requested by user ("retire le vue au mois...") */}
            {(viewMode === 'day') && (
              <div className="mt-6">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest px-2 mb-2">
                  {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                {renderRoadmap(selectedDate)}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL */}
      {
        isPlanningModalOpen && (
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

                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl flex mb-6">
                  <button
                    onClick={() => setRecurrence('none')}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${recurrence === 'none' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-zinc-400'}`}
                  >
                    Une seule fois
                  </button>
                  <button
                    onClick={() => setRecurrence('custom')}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${recurrence === 'custom' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'text-zinc-400'}`}
                  >
                    Répéter
                  </button>
                </div>

                {recurrence === 'none' ? (
                  <div>
                    <label className="block text-sm font-bold mb-2">Choisir la date et l'heure</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={planningDate}
                        onChange={(e) => setPlanningDate(e.target.value)}
                        className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 dark:bg-zinc-800 text-lg font-bold"
                      />
                      <input
                        type="time"
                        value={cronHour + ':' + cronMinute}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(':');
                          setCronHour(h);
                          setCronMinute(m);
                        }}
                        className="w-24 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 dark:bg-zinc-800 text-lg font-bold text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center">
                      <label className="text-xs font-bold uppercase text-zinc-400 mb-2">Heure de début</label>
                      <input
                        type="time"
                        value={cronHour + ':' + cronMinute}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(':');
                          setCronHour(h);
                          setCronMinute(m);
                        }}
                        className="text-5xl font-black bg-transparent border-none focus:ring-0 p-0 text-center w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-3">Jours de la semaine</label>
                      <div className="flex justify-between gap-1">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => {
                          // Conversion 0=Sunday to Cron (1=Mon...0/7=Sun) 
                          // App uses JS dates 0=Sun. Cron usually 0-6 or 1-7. Node-cron: 0-6 (Sun-Sat).
                          // Let's map visual button index 0(Mon)..6(Sun) to Cron.
                          // i=0(Mon) -> Cron 1
                          // i=6(Sun) -> Cron 0
                          const cronDay = i === 6 ? 0 : i + 1;
                          const isSelected = customDays.includes(cronDay);
                          return (
                            <button
                              key={i}
                              onClick={() => toggleCustomDay(cronDay)}
                              className={`size-10 rounded-full font-bold transition-all ${isSelected ? 'bg-primary text-black shadow-glow' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                            >
                              {d}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase text-zinc-400 mb-2">Commencer le cycle le</label>
                      <input
                        type="date"
                        value={planningDate} // Reuse planningDate as start date for recurrence
                        onChange={(e) => setPlanningDate(e.target.value)}
                        className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 dark:bg-zinc-800 font-bold"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">Sert de référence pour le "Cycle 1".</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold uppercase text-zinc-400">Configuration du Cycle</label>
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                          <span className="text-[10px] font-bold uppercase px-2 text-zinc-400">Durée du cycle</span>
                          <button onClick={() => {
                            if (cycleLength > 1) {
                              setCycleLength(l => l - 1);
                              // Remove active weeks that are out of bounds
                              setActiveWeeks(prev => prev.filter(w => w <= cycleLength - 1));
                            }
                          }} className="size-6 bg-white dark:bg-zinc-700 rounded-md shadow-sm font-bold flex items-center justify-center hover:bg-zinc-50">-</button>
                          <span className="text-sm font-black w-4 text-center">{cycleLength}</span>
                          <button onClick={() => {
                            if (cycleLength < 4) setCycleLength(l => l + 1);
                          }} className="size-6 bg-white dark:bg-zinc-700 rounded-md shadow-sm font-bold flex items-center justify-center hover:bg-zinc-50">+</button>
                        </div>
                      </div>

                      <div className="bg-zinc-100 dark:bg-zinc-800/30 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                        <div className="space-y-3">
                          {Array.from({ length: 4 }).map((_, i) => {
                            const weekNum = i + 1;
                            const isActive = activeWeeks.includes(weekNum);
                            const isPartOfCycle = weekNum <= cycleLength;
                            const isGhost = weekNum > cycleLength;

                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  if (isGhost) {
                                    // Extend cycle to this week
                                    setCycleLength(weekNum);
                                    // And toggle it active if it wasn't? Or just extend.
                                    // Let's just extend.
                                  } else {
                                    // Toggle active state
                                    setActiveWeeks(prev => {
                                      if (prev.includes(weekNum)) {
                                        // Prevent removing the last active week? No, user might want full rest weeks (unlikely but possible).
                                        // Let's allow empty for now, or maybe not.
                                        if (prev.length === 1 && prev[0] === weekNum) return prev; // Keep at least one
                                        return prev.filter(w => w !== weekNum);
                                      } else {
                                        return [...prev, weekNum].sort();
                                      }
                                    });
                                  }
                                }}
                                className={`flex items-center gap-2 transition-all cursor-pointer ${isGhost ? 'opacity-20 hover:opacity-100' : ''}`}
                              >
                                <span className={`text-[10px] font-bold uppercase w-12 ${isActive ? 'text-primary' : (isPartOfCycle ? 'text-zinc-400' : 'text-zinc-600')}`}>
                                  Sem. {weekNum}
                                </span>
                                <div className="flex-1 flex justify-between gap-1">
                                  {Array.from({ length: 7 }).map((_, d) => (
                                    <div
                                      key={d}
                                      className={`size-3 rounded-full transition-all ${isActive
                                        ? 'bg-primary shadow-[0_0_8px_rgba(255,200,0,0.6)]'
                                        : (isPartOfCycle
                                          ? 'border border-zinc-300 dark:border-zinc-700 bg-transparent'
                                          : 'bg-zinc-200 dark:bg-zinc-800'
                                        )
                                        }`}
                                    ></div>
                                  ))}
                                </div>
                                <div className="w-16 text-right">
                                  <span className={`text-[10px] font-black uppercase ${isActive ? 'text-primary' : (isPartOfCycle ? 'text-zinc-500' : 'text-zinc-700')}`}>
                                    {isActive ? 'Actif' : (isPartOfCycle ? 'Repos' : '-')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="mt-3 text-center text-xs text-zinc-400">
                        Cliquez sur une semaine pour l'activer/désactiver. Cliquez sur une zone grisée pour allonger le cycle.
                      </p>
                    </div>
                  </div>
                )}
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
        )
      }
    </div >
  );
};

export default Planning;
