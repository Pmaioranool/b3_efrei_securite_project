import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, CartesianGrid, XAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import workoutService from '../services/workoutService';

const Stats: React.FC = () => {
  const navigate = useNavigate();
  const { user, sessions } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'sessions'>('general');
  const [selectedSessionName, setSelectedSessionName] = useState<string | null>(null);
  const [apiStats, setApiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await workoutService.getWeeklyStats();
        setApiStats(stats);
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // --- Logique de données ---

  const sessionTemplates = useMemo(() => {
    const names = Array.from(new Set(sessions.map(s => s.name)));
    return names.map(name => {
      const history = sessions.filter(s => s.name === name && s.status === 'completed');
      return { name, count: history.length, lastDate: history.length > 0 ? history[history.length - 1].date : null };
    });
  }, [sessions]);

  const drillDownStats = useMemo(() => {
    if (!selectedSessionName) return null;

    const history = sessions
      .filter(s => s.name === selectedSessionName && s.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (history.length === 0) return null;

    const totalCount = history.length;
    const avgDuration = Math.round(history.reduce((a, b) => a + b.durationMinutes, 0) / totalCount);
    const totalCalories = history.reduce((a, b) => a + (b.calories || 0), 0);
    
    let totalCumulativeVolume = 0;
    history.forEach(session => {
      session.exercises.forEach(exo => {
        exo.sets.forEach(set => {
          if (set.completed) totalCumulativeVolume += (set.weight * set.reps);
        });
      });
    });

    const chartData = history.map(s => {
      let sessionVolume = 0;
      s.exercises.forEach(exo => exo.sets.forEach(set => {
        if (set.completed) sessionVolume += set.weight * set.reps;
      }));
      return {
        date: new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        volume: sessionVolume,
        fullDate: new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
        calories: s.calories
      };
    });

    const exercisePerformance: Record<string, any> = {};
    history.forEach(s => {
      s.exercises.forEach(exo => {
        if (!exercisePerformance[exo.name]) {
          exercisePerformance[exo.name] = { name: exo.name, muscle: exo.muscle, maxW: 0, sumW: 0, countW: 0, maxR: 0, sumR: 0, countR: 0, totalReps: 0, totalVol: 0 };
        }
        const p = exercisePerformance[exo.name];
        exo.sets.forEach(set => {
          if (set.completed) {
            if (set.weight > p.maxW) p.maxW = set.weight;
            if (set.reps > p.maxR) p.maxR = set.reps;
            if (set.weight > 0) { 
                p.sumW += set.weight; 
                p.countW++; 
                p.totalVol += (set.weight * set.reps);
                p.totalReps += set.reps;
            }
            p.sumR += set.reps; p.countR++;
          }
        });
      });
    });

    return { 
        totalCount, 
        avgDuration, 
        totalCalories, 
        totalCumulativeVolume: (totalCumulativeVolume / 1000).toFixed(1), 
        chartData, 
        performance: Object.values(exercisePerformance) 
    };
  }, [selectedSessionName, sessions]);

  if (selectedSessionName && drillDownStats) {
    return (
      <div className="space-y-6 pb-20">
        <header className="flex items-center gap-4 px-4 pt-10 pb-4 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 border-b border-gray-100 dark:border-white/5">
          <button onClick={() => setSelectedSessionName(null)} className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-white/5 shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{selectedSessionName}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performances Historiques</p>
          </div>
        </header>

        <div className="px-4 space-y-8">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <div className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-orange-500 uppercase">Temps Moy.</span>
                <p className="text-2xl font-bold mt-1">{drillDownStats.avgDuration} <span className="text-sm font-medium text-gray-400">min</span></p>
             </div>
             <div className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-blue-500 uppercase">Volume Total</span>
                <p className="text-2xl font-bold mt-1">{drillDownStats.totalCumulativeVolume} <span className="text-sm font-medium text-gray-400">t</span></p>
             </div>
             <div className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-red-500 uppercase">Calories</span>
                <p className="text-2xl font-bold mt-1">{(drillDownStats.totalCalories/1000).toFixed(1)} <span className="text-sm font-medium text-gray-400">k</span></p>
             </div>
             <div className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-green-500 uppercase">Validations</span>
                <p className="text-2xl font-bold mt-1">{drillDownStats.totalCount}</p>
             </div>
          </section>

          <section className="bg-white dark:bg-white/5 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5">
             <h3 className="text-sm font-bold text-gray-500 uppercase mb-6 tracking-wide">Évolution du tonnage (kg)</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={drillDownStats.chartData}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EA2831" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EA2831" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.1} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#1a1a1a', color: '#fff'}}
                      itemStyle={{color: '#EA2831'}}
                      labelStyle={{fontSize: '12px', opacity: 0.7}}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#EA2831" strokeWidth={4} fillOpacity={1} fill="url(#colorVol)" activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </section>

          <section>
             <h3 className="text-lg font-bold mb-4 px-1">Performances par exercice</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drillDownStats.performance.map((p) => (
                  <div key={p.name} className="bg-white dark:bg-white/5 p-5 rounded-3xl border border-gray-100 dark:border-white/5 group hover:border-primary transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                                <span className="material-symbols-outlined">fitness_center</span>
                            </div>
                            <h4 className="font-bold text-base leading-tight">{p.name}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{p.muscle}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Pic de charge</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{p.maxW}</span>
                                <span className="text-xs font-bold text-gray-500">kg</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Intensité Moy.</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{(p.totalVol / (p.totalReps || 1)).toFixed(1)}</span>
                                <span className="text-xs font-bold text-gray-500">kg/rep</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Répétitions Max</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{p.maxR}</span>
                                <span className="text-xs font-bold text-gray-500">reps</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Volume Moyen</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{Math.round(p.totalVol / drillDownStats.totalCount)}</span>
                                <span className="text-xs font-bold text-gray-500">kg</span>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="px-4 pt-10 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-sm font-medium text-gray-500">Analysez vos progrès sur le long terme</p>
      </header>

      <div className="px-4">
        <div className="flex w-full p-1.5 bg-gray-200/50 dark:bg-white/5 rounded-2xl">
          <button onClick={() => setActiveTab('general')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'general' ? 'bg-white dark:bg-[#1a1a1a] shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>Général</button>
          <button onClick={() => setActiveTab('sessions')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'sessions' ? 'bg-white dark:bg-[#1a1a1a] shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>Toutes les séances</button>
        </div>
      </div>

      <div className="px-4 pb-10">
        {activeTab === 'general' ? (
          <div className="space-y-8">
             <div className="pt-4">
                <div className="flex items-end gap-3 mb-6">
                    <h2 className="text-[48px] font-bold leading-none tracking-tighter">{user.stats.weight} <span className="text-xl font-medium text-gray-400 tracking-normal">kg</span></h2>
                    <div className="mb-2 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full uppercase">Stable</div>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{v:76},{v:77},{v:76},{v:78}]}>
                           <Area type="monotone" dataKey="v" stroke="#EA2831" strokeWidth={4} fill="url(#colorVol)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-white/5 p-5 rounded-3xl border border-gray-100 dark:border-white/5">
                    <span className="material-symbols-outlined text-primary mb-2">trending_up</span>
                    <p className="text-xs font-bold text-gray-400 uppercase">Progrès volume</p>
                    <p className="text-xl font-bold mt-1">+12.5%</p>
                </div>
                <div className="bg-white dark:bg-white/5 p-5 rounded-3xl border border-gray-100 dark:border-white/5">
                    <span className="material-symbols-outlined text-primary mb-2">avg_pace</span>
                    <p className="text-xs font-bold text-gray-400 uppercase">Fréquence moy.</p>
                    <p className="text-xl font-bold mt-1">3.4j / sem</p>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {sessionTemplates.map((template) => (
              <button 
                key={template.name} 
                onClick={() => setSelectedSessionName(template.name)}
                className="w-full flex items-center justify-between p-5 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-primary transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-3xl">exercise</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-primary">{template.count} fois complétée</span>
                      {template.lastDate && <span className="text-xs text-gray-400">• {new Date(template.lastDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-300">chevron_right</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;