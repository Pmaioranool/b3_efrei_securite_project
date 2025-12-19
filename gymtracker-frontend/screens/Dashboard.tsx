
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import workoutService from '../services/workoutService';
import userService from '../services/userService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, sessions, getWeeklyStats, getHistoryByWeek } = useApp();
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, duration: 0, calories: 0, volume: 0 });
  const [apiUser, setApiUser] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Charger les données depuis l'API avec gestion d'erreur individuelle
        const results = await Promise.allSettled([
          workoutService.getWeeklyStats(),
          userService.getCurrentUser(),
          workoutService.getWorkouts(),
        ]);
        
        // Stats
        if (results[0].status === 'fulfilled') {
          setStats(results[0].value);
        } else {
          setStats(getWeeklyStats());
        }
        
        // User
        if (results[1].status === 'fulfilled') {
          setApiUser(results[1].value);
        }
        
        // Workouts
        if (results[2].status === 'fulfilled') {
          setWorkouts(results[2].value);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Fallback vers les données mockées
        setStats(getWeeklyStats());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Use API user data if available, fallback to context user
  const displayUser = apiUser || user;
  const history = getHistoryByWeek();
  
  // Find last completed session from API workouts
  const lastSession = [...workouts]
    .filter(s => s.status === 'completed')
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  const calPercentage = Math.min(100, Math.round((stats.calories / ((displayUser.goals?.dailyCalories || 2400) * 7)) * 100));

  const maxVolume = Math.max(...history.map(h => h.volume), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center px-6 pt-12 pb-4 justify-between bg-background-light dark:bg-background-dark sticky top-0 z-10">
        <div className="flex flex-1 items-center gap-4">
          <Link to="/profile" className="relative">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-primary shadow-sm" 
              style={{ backgroundImage: `url("${displayUser.avatar || 'https://picsum.photos/seed/user/200/200'}")` }}
            ></div>
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-[#23220f]"></div>
          </Link>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bienvenue,</p>
            <h2 className="text-lg font-bold leading-tight tracking-tight">{displayUser.pseudonym || displayUser.name} 👋</h2>
          </div>
        </div>
        <Link to="/notifications" className="flex items-center justify-center rounded-full size-10 bg-white dark:bg-[#343217] shadow-sm hover:bg-gray-50 dark:hover:bg-[#45421f] transition-colors relative">
          <span className="material-symbols-outlined text-[#1c1c0d] dark:text-[#fcfcf8]" style={{ fontSize: '24px' }}>notifications</span>
          <span className="absolute top-2 right-2.5 size-2 bg-red-500 rounded-full"></span>
        </Link>
      </header>

      <main className="px-4 space-y-6">
        {/* Stats Grid */}
        <section aria-label="Statistiques de la semaine">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col justify-between gap-2 rounded-xl p-5 bg-[#f4f4e6] dark:bg-[#343217] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="p-2 bg-white dark:bg-[#23220f] rounded-full">
                  <span className="material-symbols-outlined text-orange-500" style={{ fontSize: '20px' }}>fitness_center</span>
                </span>
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight text-[#1c1c0d] dark:text-[#fcfcf8]">{(stats.volume / 1000).toFixed(1)} <span className="text-sm font-bold text-gray-400 tracking-normal">t</span></p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Charge totale</p>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-2 rounded-xl p-5 bg-[#f4f4e6] dark:bg-[#343217] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="p-2 bg-white dark:bg-[#23220f] rounded-full">
                  <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '20px' }}>task_alt</span>
                </span>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight text-[#1c1c0d] dark:text-[#fcfcf8]">{stats.count}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Séances validées</p>
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Goal */}
        <section>
          <div className="flex items-end justify-between px-1 pb-3">
            <h2 className="text-xl font-bold tracking-tight">Objectif hebdo</h2>
            <Link to="/goals" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">Modifier</Link>
          </div>
          <div className="flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-[#343217] shadow-sm border border-gray-100 dark:border-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>local_fire_department</span>
                <div>
                  <p className="text-base font-bold text-[#1c1c0d] dark:text-[#fcfcf8]">Calories brûlées</p>
                  <p className="text-xs font-medium text-gray-400">Cette semaine</p>
                </div>
              </div>
              <p className="text-lg font-bold text-[#1c1c0d] dark:text-[#fcfcf8]">{calPercentage}%</p>
            </div>
            <div className="w-full h-3 bg-[#e9e8ce] dark:bg-[#45421f] rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${calPercentage}%` }}></div>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-[#1c1c0d] dark:text-[#fcfcf8]">{stats.calories} Kcal</span>
              <span className="text-gray-400">{(displayUser.goals?.dailyCalories || 2400) * 7} Kcal</span>
            </div>
          </div>
        </section>

        {/* Intensity Chart (Weekly Tonnage) */}
        <section>
          <div className="flex items-center justify-between px-1 pb-3 pt-2">
            <h2 className="text-xl font-bold tracking-tight">Intensité par semaine</h2>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dernier mois</div>
          </div>
          <div className="bg-white dark:bg-[#343217] p-6 rounded-2xl shadow-sm flex items-end justify-between h-48 gap-4 relative">
            {history.map((h, i) => {
                const barHeight = Math.max(10, (h.volume / maxVolume) * 100);
                const isCurrent = i === history.length - 1;
                const isHovered = hoveredWeek === i;
                
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center gap-3 flex-1 h-full justify-end relative group"
                    onMouseEnter={() => setHoveredWeek(i)}
                    onMouseLeave={() => setHoveredWeek(null)}
                  >
                    {/* Tooltip on hover/active */}
                    {(isHovered || (isCurrent && hoveredWeek === null)) && (
                      <div className="absolute -top-12 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl z-20 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                        {h.count} séances • {Math.round(h.volume/1000)}t
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}

                    <div className="w-full bg-[#f4f4e6] dark:bg-[#45421f] rounded-xl relative h-28 overflow-hidden cursor-pointer">
                       <div 
                         className={`absolute bottom-0 w-full transition-all duration-500 ease-out 
                            ${isCurrent ? 'bg-primary shadow-glow shadow-primary/30' : 'bg-primary/30 group-hover:bg-primary/60'}
                            ${isHovered ? 'shadow-md ring-1 ring-white/10' : ''}
                         `} 
                         style={{ height: `${barHeight}%` }}
                       ></div>
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight uppercase ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>{h.weekLabel}</span>
                  </div>
                )
            })}
          </div>
        </section>

        {/* Last Session Hero */}
        {lastSession ? (
        <section onClick={() => navigate(`/active-session/${lastSession.id}`)} className="cursor-pointer group">
          <div className="flex items-center justify-between px-1 pb-3 pt-2">
            <h2 className="text-xl font-bold tracking-tight">Dernière séance</h2>
            <span className="material-symbols-outlined text-gray-400">more_horiz</span>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-[#23220f] text-white shadow-md group-hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
              <img 
                alt="Gym" 
                className="h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                src="https://picsum.photos/seed/gymworkout/800/600"
              />
            </div>
            <div className="relative z-20 p-6 flex flex-col justify-end h-48">
              <div className="flex items-start justify-between mb-4">
                <span className="bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">{lastSession.exercises[0]?.muscle || 'Cardio'}</span>
                <span className="text-[10px] font-bold text-gray-200 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md uppercase tracking-tight">
                    {new Date(lastSession.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month:'short' })}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black">{lastSession.name}</h3>
                <div className="flex items-center gap-4 text-gray-200 text-xs font-bold uppercase tracking-wide">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>schedule</span>
                    <span>{lastSession.durationMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>local_fire_department</span>
                    <span>{lastSession.calories} kcal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        ) : null}
      </main>

      {/* FAB */}
      <Link to="/new-session" className="fixed bottom-24 right-6 bg-primary hover:bg-primary-dark text-black rounded-full size-14 shadow-lg shadow-primary/40 flex items-center justify-center transition-all hover:scale-110 z-40 active:scale-95">
        <span className="material-symbols-outlined" style={{ fontSize: '32px', fontWeight: 600 }}>add</span>
      </Link>
    </div>
  );
};

export default Dashboard;
