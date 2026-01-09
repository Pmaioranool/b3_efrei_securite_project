
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, Exercise, Set as SetType, Session } from '../context/AppContext';
import workoutService from '../services/workoutService';

type UIState = 'START_UI' | 'ACTIVE_SET_UI' | 'REST_UI' | 'SUMMARY_UI';

interface ExerciseMetric {
  name: string;
  muscle: string;
  totalTime: number; // Temps cumulé sous tension (en secondes)
  totalVolume: number;
  totalReps: number;
  peakLoad: number;
  sets: { weight: number; reps: number; duration: number }[];
}

const ActiveSession: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessions, templates, completeSession } = useApp();
  const [fetchedSession, setFetchedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      // 1. Try to find in context first (fastest)
      const contextSession = sessions.find(s => s.id === sessionId) || templates.find(t => t.id === sessionId);
      if (contextSession) {
        setFetchedSession(contextSession);
        setLoading(false);
        return;
      }

      // 2. Fetch from API if not in context
      try {
        setLoading(true);
        const apiSession = await workoutService.getWorkoutById(sessionId) as any;
        
        if (apiSession) {
          // Map API response to Session type
          const mappedSession: Session = {
            id: apiSession._id || apiSession.id,
            name: apiSession.name,
            date: apiSession.updated_at || new Date().toISOString(),
            durationMinutes: 45,
            status: 'planned',
            exercises: (apiSession.exercises || []).map((ex: any) => ({
              id: ex.exercise?._id || ex._id || 'unknown',
              name: ex.exercise?.Title || ex.exercise?.name || 'Unknown Exercise',
              muscle: ex.exercise?.BodyPart || 'General',
              type: ex.exercise?.Equipment || 'bodyweight',
              sets: (ex.sets || []).map((s: any) => ({
                id: s._id || Math.random().toString(),
                reps: s.rep || 0,
                weight: s.weight || 0,
                durationSeconds: s.duration || 0,
                restSeconds: s.rest || 60,
                completed: false
              }))
            }))
          };
          setFetchedSession(mappedSession);
        }
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, sessions, templates]);

  // Robust session lookup: use fetchedSession
  const session = useMemo(() => {
    return fetchedSession;
  }, [fetchedSession]);

  // Logic States
  const [uiState, setUiState] = useState<UIState>('START_UI');
  const [countdown, setCountdown] = useState(3);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [initialRestTime, setInitialRestTime] = useState(90);

  // Timers
  const [globalSeconds, setGlobalSeconds] = useState(0);
  const [setStartTimestamp, setSetStartTimestamp] = useState(0);

  // Performance Data Storage
  const [metrics, setMetrics] = useState<Record<string, ExerciseMetric>>({});

  // Constants - Safe Access
  const currentEx = session?.exercises?.[currentExIdx];
  const currentSet = currentEx?.sets?.[currentSetIdx];
  const nextSet = currentEx?.sets?.[currentSetIdx + 1];
  const nextEx = session?.exercises?.[currentExIdx + 1];

  const isLastSetOfEx = currentSetIdx === (currentEx?.sets?.length || 0) - 1;
  const isLastExOfSession = currentExIdx === (session?.exercises?.length || 0) - 1;

  // 1. GLOBAL TIMER
  useEffect(() => {
    let interval: any;
    if (uiState !== 'START_UI' && uiState !== 'SUMMARY_UI') {
      interval = setInterval(() => setGlobalSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [uiState]);

  // 2. COUNTDOWN LOGIC (START_UI)
  useEffect(() => {
    if (uiState === 'START_UI') {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            setUiState('ACTIVE_SET_UI');
            setSetStartTimestamp(Date.now());
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [uiState]);

  // 3. REST TIMER LOGIC
  useEffect(() => {
    let timer: any;
    if (uiState === 'REST_UI') {
      timer = setInterval(() => {
        setRestTimer(t => {
          if (t <= 1) {
            clearInterval(timer);
            skipRest();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [uiState]);

  const skipRest = () => {
    setUiState('ACTIVE_SET_UI');
    setSetStartTimestamp(Date.now());
    setRestTimer(0);
  };

  const adjustRest = (seconds: number) => {
    setRestTimer(prev => Math.max(0, prev + seconds));
    setInitialRestTime(prev => Math.max(1, prev + seconds));
  };

  // 4. TRANSITION LOGIC
  const handleFinishSet = () => {
    if (!currentEx || !currentSet) return; // Guard against undefined access

    const setDuration = Math.floor((Date.now() - setStartTimestamp) / 1000);

    // Update Metrics
    setMetrics(prev => {
      const exKey = currentEx.name;
      const currentExMetrics = prev[exKey] || {
        name: currentEx.name,
        muscle: currentEx.muscle,
        totalTime: 0,
        totalVolume: 0,
        totalReps: 0,
        peakLoad: 0,
        sets: []
      };

      return {
        ...prev,
        [exKey]: {
          ...currentExMetrics,
          totalTime: currentExMetrics.totalTime + setDuration,
          totalVolume: currentExMetrics.totalVolume + (currentSet.weight * currentSet.reps),
          totalReps: currentExMetrics.totalReps + currentSet.reps,
          peakLoad: Math.max(currentExMetrics.peakLoad, currentSet.weight),
          sets: [...currentExMetrics.sets, { weight: currentSet.weight, reps: currentSet.reps, duration: setDuration }]
        }
      };
    });

    const nextRest = currentSet.restSeconds || 90;
    setInitialRestTime(nextRest);
    setRestTimer(nextRest);

    if (isLastSetOfEx) {
      if (isLastExOfSession) {
        setUiState('SUMMARY_UI');
      } else {
        setUiState('REST_UI');
        setCurrentExIdx(prev => prev + 1);
        setCurrentSetIdx(0);
      }
    } else {
      setUiState('REST_UI');
      setCurrentSetIdx(prev => prev + 1);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sessionProgress = useMemo(() => {
    if (!session || !session.exercises) return 0;
    const totalSets = session.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
    if (totalSets === 0) return 0;
    let completedSets = 0;
    for (let i = 0; i < currentExIdx; i++) completedSets += session.exercises[i].sets?.length || 0;
    completedSets += currentSetIdx;
    return Math.round((completedSets / totalSets) * 100);
  }, [currentExIdx, currentSetIdx, session]);

  // Loading State
  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-zinc-500">Chargement de la séance...</p>
      </div>
    );
  }

  // Session not found fallback
  if (!session) {
    return (
      <div className="bg-background-light dark:bg-background-dark h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-zinc-300 mb-4">error</span>
        <h1 className="text-xl font-bold mb-2">Séance non trouvée</h1>
        <p className="text-zinc-500 mb-8">Nous n'avons pas pu charger les données de cette séance.</p>
        <button onClick={() => navigate('/workouts')} className="bg-primary text-black px-8 py-3 rounded-full font-bold">Retour à la bibliothèque</button>
      </div>
    );
  }

  // --- START UI ---
  if (uiState === 'START_UI') {
    return (
      <div className="bg-background-dark h-screen text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 overflow-hidden">
        <div className="mb-12">
          <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs">Première étape</span>
          <h1 className="text-4xl font-black mt-2 leading-tight">{currentEx?.name}</h1>
          <p className="text-gray-400 mt-2 font-medium">{currentEx?.sets?.length} Séries • {currentEx?.muscle}</p>
        </div>
        <div className="size-56 rounded-full border-4 border-primary/20 flex items-center justify-center relative shadow-glow shadow-primary/40">
          <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20"></div>
          <span className="text-9xl font-black text-primary tabular-nums">{countdown}</span>
        </div>
        <p className="mt-12 text-gray-500 font-bold uppercase text-xs tracking-widest">Respirez, ça commence</p>
      </div>
    );
  }

  // --- SUMMARY UI ---
  if (uiState === 'SUMMARY_UI') {
    const metricsArray = Object.values(metrics) as ExerciseMetric[];
    const totalVolume = metricsArray.reduce((acc, m) => acc + m.totalVolume, 0);
    return (
      <div className="bg-background-light dark:bg-background-dark h-screen flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-700">
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
          <div className="max-w-md mx-auto space-y-6">
            <header className="text-center py-4">
              <div className="size-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow shadow-primary/30">
                <span className="material-symbols-outlined text-white text-3xl">workspace_premium</span>
              </div>
              <h1 className="text-2xl font-black">Session Terminée</h1>
              <p className="text-gray-500 font-medium text-sm">Bravo ! {session.name} validé.</p>
            </header>

            <section className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/10 text-center shadow-soft">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Durée Totale</p>
                <p className="text-xl font-black">{formatTime(globalSeconds)}</p>
              </div>
              <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/10 text-center shadow-soft">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Volume</p>
                <p className="text-xl font-black">{totalVolume} <span className="text-xs font-bold text-gray-400">kg</span></p>
              </div>
            </section>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">analytics</span>
                Performances détaillées
              </h3>
              {metricsArray.map((m) => {
                const avgWeightPerSet = Math.round(m.sets.reduce((acc, s) => acc + s.weight, 0) / (m.sets.length || 1));
                return (
                  <div key={m.name} className="bg-white dark:bg-white/5 p-5 rounded-3xl border-l-4 border-l-primary shadow-soft space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-base leading-tight">{m.name}</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">{m.muscle}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1 whitespace-nowrap">Moy temp / Série</p>
                        <p className="text-lg font-black text-primary">{Math.round(m.totalTime / (m.sets.length || 1))} <span className="text-[10px] font-bold">sec</span></p>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1 whitespace-nowrap">Record Charge</p>
                        <p className="text-lg font-black">{m.peakLoad} <span className="text-[10px] font-bold">kg</span></p>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl col-span-2 shadow-inner">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1 whitespace-nowrap text-center">Moy charge / série</p>
                        <p className="text-lg font-black text-center">{avgWeightPerSet} <span className="text-[10px] font-bold">kg</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-gray-100 dark:border-white/10 z-30">
          <button
            onClick={async () => {
              try {
                if (sessionId) {
                  await workoutService.completeWorkout(sessionId);
                }
                completeSession(session.id);
                navigate('/stats');
              } catch (error) {
                console.error('Erreur lors de la complétion:', error);
                completeSession(session.id);
                navigate('/stats');
              }
            }}
            className="w-full max-w-md mx-auto block py-5 bg-primary text-black font-black text-lg rounded-3xl shadow-glow shadow-primary/40 active:scale-95 transition-all"
          >
            VALIDER LA SÉANCE
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE SESSION UI ---
  return (
    <div className="bg-background-light dark:bg-background-dark h-screen flex flex-col overflow-hidden">
      {/* HEADER COMPACT */}
      <header className="px-6 py-4 bg-white dark:bg-black/20 border-b border-gray-100 dark:border-white/5 flex justify-between items-center z-10 shrink-0 shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-lg font-black tracking-tight leading-none truncate max-w-[200px]">{currentEx?.name || 'Exercice'}</h2>
          <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1.5">
            Série {currentSetIdx + 1} de {currentEx?.sets?.length || 0} • {currentEx?.muscle}
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-primary/10">
          <span className="material-symbols-outlined text-sm font-bold">timer</span>
          <span className="text-sm font-black tabular-nums">{formatTime(globalSeconds)}</span>
        </div>
      </header>

      {/* PROGRESS COMPACT */}
      <div className="w-full h-1 bg-gray-100 dark:bg-white/5 shrink-0">
        <div className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_8px_rgba(234,40,49,0.5)]" style={{ width: `${sessionProgress}%` }}></div>
      </div>

      <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full justify-between items-center overflow-hidden">

        {uiState === 'ACTIVE_SET_UI' ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 w-full">
            <div className="text-center mb-10">
              <div className="flex gap-8 items-baseline justify-center mb-2">
                <div className="text-center">
                  <p className="text-8xl font-black tracking-tighter tabular-nums leading-none">{currentSet?.weight || 0}</p>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2 block">Kilos</span>
                </div>
                <div className="text-5xl text-gray-200 dark:text-gray-800 font-thin mb-4">×</div>
                <div className="text-center">
                  <p className="text-8xl font-black tracking-tighter tabular-nums leading-none">{currentSet?.reps || 0}</p>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2 block">Reps</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest mt-4">
                <span className="material-symbols-outlined text-xs">bolt</span>
                Suivi du temps activé
              </div>
            </div>

            <button
              onClick={handleFinishSet}
              className="size-56 rounded-full bg-primary text-black font-black text-xl shadow-glow shadow-primary/40 active:scale-90 transition-all flex flex-col items-center justify-center gap-2 border-[12px] border-primary-dark/20 relative group"
            >
              <span className="material-symbols-outlined text-6xl group-hover:scale-110 transition-transform">check_circle</span>
              <span className="leading-tight text-lg">
                {isLastSetOfEx ? (isLastExOfSession ? 'TERMINER' : 'FINIR EXO') : 'SÉRIE FAITE'}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="relative size-72 flex items-center justify-center">
              <svg className="absolute inset-0 size-full transform -rotate-90">
                <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-white/5" />
                <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={816}
                  strokeDashoffset={816 - (816 * restTimer / (initialRestTime || 1))}
                  className="text-primary transition-all duration-1000 ease-linear shadow-glow shadow-primary/20"
                  strokeLinecap="round"
                />
              </svg>

              <button
                onClick={() => adjustRest(-10)}
                className="absolute left-[-15px] top-1/2 -translate-y-1/2 size-14 rounded-full bg-white dark:bg-white/10 shadow-xl flex items-center justify-center border border-gray-100 dark:border-white/5 active:scale-90 transition-all hover:bg-gray-50 dark:hover:bg-white/20 z-20 hover:shadow-2xl"
              >
                <span className="text-sm font-black text-gray-400 dark:text-gray-500">-10s</span>
              </button>

              <button
                onClick={() => adjustRest(10)}
                className="absolute right-[-15px] top-1/2 -translate-y-1/2 size-14 rounded-full bg-white dark:bg-white/10 shadow-xl flex items-center justify-center border border-gray-100 dark:border-white/5 active:scale-90 transition-all hover:bg-gray-50 dark:hover:bg-white/20 z-20 hover:shadow-2xl"
              >
                <span className="text-sm font-black text-primary">+10s</span>
              </button>

              <div className="flex flex-col items-center z-10 bg-white/5 dark:bg-black/10 p-6 rounded-full backdrop-blur-sm border border-white/5 shadow-inner">
                <span className="text-8xl font-black tabular-nums tracking-tighter leading-none drop-shadow-md">{restTimer}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-4">Récupération</span>
              </div>
            </div>

            <button
              onClick={skipRest}
              className="mt-12 px-10 py-4 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center gap-3 hover:bg-primary/10 transition-all group active:scale-95 border border-transparent hover:border-primary/20 shadow-soft hover:shadow-md"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-xl">fast_forward</span>
              <span className="font-bold text-sm text-gray-500 group-hover:text-primary transition-colors uppercase tracking-widest">Passer le repos</span>
            </button>
          </div>
        )}

        {/* PIED DE PAGE PRÉDICTIF */}
        <div className="w-full shrink-0 mb-2">
          <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/10 flex items-center justify-between shadow-soft hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-xl">{isLastSetOfEx ? 'forward' : 'layers'}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Ensuite</p>
                <p className="font-black text-sm truncate max-w-[150px]">
                  {isLastSetOfEx
                    ? (isLastExOfSession ? 'FIN DE SÉANCE' : nextEx?.name)
                    : `Série ${currentSetIdx + 2} / ${currentEx?.sets?.length || 0}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Cible</p>
              <p className="font-black text-sm text-primary">
                {isLastSetOfEx
                  ? (isLastExOfSession ? 'COMPLETE' : `${nextEx?.sets?.[0]?.weight || 0}kg`)
                  : `${nextSet?.weight || 0}kg`}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActiveSession;
