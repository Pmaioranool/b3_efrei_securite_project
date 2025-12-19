import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import userService from '../services/userService';

const Goals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [apiGoals, setApiGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const userData = await userService.getCurrentUser();
        if (userData.goals) {
          setApiGoals(userData.goals);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des objectifs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  const displayGoals = apiGoals || user.goals;

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-4 pb-2 flex items-center justify-between border-b border-transparent">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Objectifs</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col gap-6 px-4 pb-32 pt-2">
        <div className="flex items-center justify-center py-2">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-primary/5">
                <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="text-[22px] font-bold px-3 text-center tracking-tight text-slate-900 dark:text-white">Semaine du 21 Oct</h2>
            <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-primary/5">
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
        </div>

        <section>
          <h3 className="text-lg font-bold mb-4 px-1 text-slate-900 dark:text-white">Ma Progression</h3>
          <div className="flex flex-col gap-4">
            {/* Primary Card */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
                <div className="flex items-start justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-xl bg-primary/20 flex items-center justify-center text-green-700 dark:text-primary shadow-sm">
                            <span className="material-symbols-outlined text-3xl">fitness_center</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-bold text-lg text-slate-900 dark:text-white">Séances</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">3 sur 5 complétées</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cible</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">5</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 z-10">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-green-600 dark:text-primary">Bon travail !</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">60%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,91,0.5)]" style={{ width: '60%' }}></div>
                    </div>
                </div>
            </div>

            {/* Secondary Card */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-2xl">schedule</span>
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-base text-slate-900 dark:text-white">Temps Actif</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">120 / 150 min</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 w-28">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">80%</span>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        <section>
             <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activité cette semaine</h3>
                <span className="text-xs font-bold text-green-700 dark:text-primary bg-primary/15 px-3 py-1 rounded-full">4 Jours</span>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-white/5">
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {['L','M','M','J','V','S','D'].map((day, i) => {
                        const states = ['done', 'done', 'missed', 'done', 'today', 'future', 'future'];
                        const state = states[i];
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 group">
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${state === 'today' ? 'text-primary' : 'text-slate-400'}`}>{day}</span>
                                <div className={`aspect-square w-full max-w-[40px] rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-105
                                    ${state === 'done' ? 'bg-primary text-background-dark shadow-sm' : ''}
                                    ${state === 'missed' ? 'bg-slate-100 dark:bg-white/10 text-slate-400' : ''}
                                    ${state === 'today' ? 'border-2 border-primary text-primary bg-primary/5' : ''}
                                    ${state === 'future' ? 'bg-transparent text-slate-300 dark:text-slate-600 border border-transparent hover:border-slate-200 dark:hover:border-white/10' : ''}
                                `}>
                                    {state === 'done' ? <span className="material-symbols-outlined text-lg font-bold">check</span> : 21+i}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>

        <section className="flex flex-col gap-4 mt-2">
             <div className="bg-white dark:bg-white/5 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">notifications</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-slate-900 dark:text-white">Rappel quotidien</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Recevoir une alerte à 9h00</span>
                    </div>
                </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary shadow-inner"></div>
                </label>
             </div>
             <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg mt-2">
                <span className="material-symbols-outlined text-xl">edit_note</span>
                Modifier mes objectifs
             </button>
        </section>
      </main>
    </div>
  );
};

export default Goals;