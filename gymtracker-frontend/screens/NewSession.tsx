
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, Exercise, Set as SetType, Session } from '../context/AppContext';
import workoutService from '../services/workoutService';
import exerciseService from '../services/exerciseService';

const MUSCLES = ['Tous', 'Abdominaux', 'Abducteurs', 'Adducteurs', 'Biceps', 'Mollets', 'Pectoraux', 'Avant-bras', 'Fessiers', 'Ischio-jambiers', 'Grands dorsaux', 'Bas du dos', 'Milieu du dos', 'Cou', 'Quadriceps', 'Épaules', 'Trapèzes', 'Triceps'];
const TYPES = ['Tous', 'Bands', 'Barbell', 'Body Only', 'Cable', 'Dumbbell', 'E-Z Curl Bar', 'Exercise Ball', 'Foam Roll', 'Kettlebells', 'Machine', 'Medicine Ball', 'None', 'Other'];

const NewSession: React.FC = () => {
  const navigate = useNavigate();
  const { saveAsTemplate } = useApp();
  
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isPickingExercise, setIsPickingExercise] = useState(false);
  const [apiExercises, setApiExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMuscle, setActiveMuscle] = useState('Tous');
  const [activeType, setActiveType] = useState('Tous');

  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [error, setError] = useState<{ message: string; details: string } | null>(null);

  useEffect(() => {
    const frToApiBodyPart: Record<string, string> = {
      'Abdominaux': 'Abdominals',
      'Abducteurs': 'Abductors',
      'Adducteurs': 'Adductors',
      'Biceps': 'Biceps',
      'Mollets': 'Calves',
      'Pectoraux': 'Chest',
      'Avant-bras': 'Forearms',
      'Fessiers': 'Glutes',
      'Ischio-jambiers': 'Hamstrings',
      'Grands dorsaux': 'Lats',
      'Bas du dos': 'Lower Back',
      'Milieu du dos': 'Middle Back',
      'Cou': 'Neck',
      'Quadriceps': 'Quadriceps',
      'Épaules': 'Shoulders',
      'Trapèzes': 'Traps',
      'Triceps': 'Triceps',
      'Cardio': 'Cardio',
    };

    const translateBodyPartToFr = (api: string): string => {
      const map: Record<string, string> = Object.fromEntries(
        Object.entries(frToApiBodyPart).map(([fr, en]) => [en, fr])
      );
      return map[api] || api;
    };

    const loadExercises = async (reset = true) => {
      setLoading(true);
      try {
        const BodyPart = activeMuscle === 'Tous' ? undefined : frToApiBodyPart[activeMuscle] || activeMuscle;
        const Equipment = activeType === 'Tous' ? undefined : activeType;
        const exs = await exerciseService.getExercisesFiltered({
          BodyPart,
          Equipment,
          title: searchQuery,
          page: reset ? 0 : page,
          pageSize,
        });
        const mapped = exs.map((ex: any) => ({
          id: ex._id || ex.id,
          name: ex.Title || ex.name,
          muscle: translateBodyPartToFr(ex.BodyPart || ''),
          type: ex.Equipment || 'Other',
        }));
        setApiExercises(prev => (reset ? mapped : [...prev, ...mapped]));
      } catch (error) {
        console.error('Erreur lors du chargement des exercices:', error);
      } finally {
        setLoading(false);
      }
    };

    // initial and when filters change -> reset
    setPage(0);
    loadExercises(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMuscle, activeType, searchQuery]);

  const availableExercises = apiExercises;

  const filteredAvailableExercises = useMemo(() => {
    return availableExercises.filter(ex => {
      if (!ex || !ex.name) return false;
      const matchSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMuscle = activeMuscle === 'Tous' || ex.muscle === activeMuscle || (activeMuscle === 'Bras' && (ex.muscle === 'Biceps' || ex.muscle === 'Triceps'));
      const matchType = activeType === 'Tous' || ex.type === activeType;
      return matchSearch && matchMuscle && matchType;
    });
  }, [searchQuery, activeMuscle, activeType, availableExercises]);

  const handleSave = async () => {
    setError(null);
    
    if (!name || name.trim().length === 0) {
      return setError({
        message: "Nom de séance requis",
        details: "Vous devez donner un nom à votre séance pour pouvoir l'enregistrer et la retrouver facilement. Le nom ne peut pas être vide."
      });
    }
    
    if (exercises.length === 0) {
      return setError({
        message: "Aucun exercice ajouté",
        details: "Une séance doit contenir au moins un exercice avec des séries définies. Cliquez sur le bouton 'Ajouter' pour sélectionner des exercices depuis la bibliothèque."
      });
    }
    
    // Validation des exercices et séries
    const invalidExercises = exercises.filter(ex => !ex.sets || ex.sets.length === 0);
    if (invalidExercises.length > 0) {
      return setError({
        message: "Exercices incomplets",
        details: `${invalidExercises.length} exercice(s) n'ont pas de séries définies. Chaque exercice doit avoir au moins une série avec des valeurs (répétitions, poids, durée ou repos).`
      });
    }
    
    try {
      setLoading(true);
      
      // Get userId from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id;
      
      if (!userId) {
        return setError({
          message: "Session expirée",
          details: "Votre session utilisateur a expiré. Veuillez vous reconnecter pour continuer."
        });
      }
      
      // Transform exercises to backend format
      const transformedExercises = await Promise.all(exercises.map(async (ex) => {
        // Get exercise ID from API by title search
        const apiExercises = await exerciseService.getExercisesFiltered({
          title: ex.name,
          pageSize: 1,
        });
        const exerciseId = apiExercises[0]?._id || apiExercises[0]?.id;
        
        return {
          exercise: exerciseId,
          sets: ex.sets.map(set => ({
            rep: set.reps || 0,
            weight: set.weight || 0,
            duration: set.durationSeconds || 0,
            rest: set.restSeconds || 60,
          })),
        };
      }));
      
      // Save to API
      await workoutService.createWorkout({
        name: name,
        userId: userId,
        exercises: transformedExercises,
        template: false,
      });
      
      // Also save to local state
      saveAsTemplate({
        id: Date.now().toString(),
        name: name,
        date: new Date().toISOString(),
        durationMinutes: 45,
        status: 'planned',
        exercises: exercises,
      });
      
      navigate('/workouts');
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError({
        message: "Échec de la sauvegarde",
        details: error?.response?.status === 401
          ? "Session expirée. Veuillez vous reconnecter."
          : error?.response?.status === 400
          ? "Données invalides. Vérifiez que tous les champs sont correctement remplis."
          : "Erreur de connexion au serveur. Vérifiez votre connexion internet et réessayez."
      });
    } finally {
      setLoading(false);
    }
  };

  const addExerciseToSession = (exData: any) => {
    const newEx: Exercise = {
      id: Date.now().toString(),
      name: exData.name,
      muscle: exData.muscle,
      type: exData.type,
      sets: [
        { id: Math.random().toString(36).substr(2, 9), reps: 0, weight: 0, durationSeconds: 0, restSeconds: 60, completed: false }
      ]
    };
    setExercises([...exercises, newEx]);
    setIsPickingExercise(false);
    setSearchQuery('');
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const addSet = (exIndex: number) => {
    const newExercises = [...exercises];
    const lastSet = newExercises[exIndex].sets[newExercises[exIndex].sets.length - 1];
    newExercises[exIndex].sets.push({
      id: Math.random().toString(36).substr(2, 9),
      reps: lastSet?.reps || 0,
      weight: lastSet?.weight || 0,
      durationSeconds: lastSet?.durationSeconds || 0,
      restSeconds: lastSet?.restSeconds || 60,
      completed: false
    });
    setExercises(newExercises);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    if (exercises[exIdx].sets.length <= 1) return;
    const newExercises = [...exercises];
    newExercises[exIdx].sets.splice(setIdx, 1);
    setExercises(newExercises);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetType, value: any) => {
    const newExercises = [...exercises];
    newExercises[exIdx].sets[setIdx] = {
      ...newExercises[exIdx].sets[setIdx],
      [field]: value
    };
    setExercises(newExercises);
  };

  if (isPickingExercise) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen animate-in slide-in-from-right duration-300">
        <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/50 p-4">
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <button onClick={() => setIsPickingExercise(false)} className="flex items-center justify-center size-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Chercher un exercice..."
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-w-md mx-auto mt-4 space-y-3">
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {MUSCLES.map(m => (
                  <button 
                    key={m} 
                    onClick={() => setActiveMuscle(m)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeMuscle === m ? 'bg-primary text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                  >
                    {m}
                  </button>
                ))}
             </div>
             <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {TYPES.map(t => (
                  <button 
                    key={t} 
                    onClick={() => setActiveType(t)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black transition-all ${activeType === t ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                  >
                    {t}
                  </button>
                ))}
             </div>
          </div>
        </header>

        <main className="max-w-md mx-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl mb-4 animate-pulse text-zinc-300">fitness_center</span>
              <p className="text-zinc-500 font-medium">Chargement des exercices...</p>
            </div>
          ) : apiExercises.length > 0 ? (
            apiExercises.map((ex, i) => (
              <button 
                key={i} 
                onClick={() => addExerciseToSession(ex)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-primary transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">fitness_center</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-base">{ex.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">{ex.muscle} • {ex.type}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-300 group-hover:text-primary transition-colors">add_circle</span>
              </button>
            ))
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">search_off</span>
              <p className="text-zinc-500 font-medium">Aucun exercice trouvé</p>
            </div>
          )}
          {!loading && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={async () => {
                  const nextPage = page + 1;
                  const frToApiBodyPart: Record<string, string> = {
                    'Abdominaux': 'Abdominals',
                    'Abducteurs': 'Abductors',
                    'Adducteurs': 'Adductors',
                    'Biceps': 'Biceps',
                    'Mollets': 'Calves',
                    'Pectoraux': 'Chest',
                    'Avant-bras': 'Forearms',
                    'Fessiers': 'Glutes',
                    'Ischio-jambiers': 'Hamstrings',
                    'Grands dorsaux': 'Lats',
                    'Bas du dos': 'Lower Back',
                    'Milieu du dos': 'Middle Back',
                    'Cou': 'Neck',
                    'Quadriceps': 'Quadriceps',
                    'Épaules': 'Shoulders',
                    'Trapèzes': 'Traps',
                    'Triceps': 'Triceps',
                    'Cardio': 'Cardio',
                  };
                  setLoading(true);
                  try {
                    const BodyPart = activeMuscle === 'Tous' ? undefined : frToApiBodyPart[activeMuscle] || activeMuscle;
                    const Equipment = activeType === 'Tous' ? undefined : activeType;
                    const exs = await exerciseService.getExercisesFiltered({
                      BodyPart,
                      Equipment,
                      title: searchQuery,
                      page: nextPage,
                      pageSize: 20,
                    });
                    const translateBodyPartToFr = (api: string): string => {
                      const map: Record<string, string> = Object.fromEntries(
                        Object.entries(frToApiBodyPart).map(([fr, en]) => [en, fr])
                      );
                      return map[api] || api;
                    };
                    const mapped = exs.map((ex: any) => ({
                      id: ex._id || ex.id,
                      name: ex.Title || ex.name,
                      muscle: translateBodyPartToFr(ex.BodyPart || ''),
                      type: ex.Equipment || 'Other',
                    }));
                    setApiExercises(prev => [...prev, ...mapped]);
                    setPage(nextPage);
                  } catch (e) {
                    console.error('Erreur pagination:', e);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-bold"
              >
                Charger plus
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-40">
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="flex items-center justify-between p-4 h-16 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <h1 className="text-base font-bold tracking-tight">Nouveau Modèle</h1>
          <div className="size-10"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-6 pb-24">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 dark:text-red-400 text-sm">{error.message}</h3>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error.details}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="relative group">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du modèle (ex: Full Body)..." 
            className="block w-full bg-transparent border-0 border-b-2 border-zinc-200 dark:border-zinc-700 px-0 py-4 text-2xl font-black placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:border-primary focus:ring-0 transition-colors rounded-none" 
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Exercices</h2>
              <p className="text-[10px] text-zinc-400">{exercises.length} ajoutés</p>
            </div>
            <button 
              onClick={() => setIsPickingExercise(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Ajouter
            </button>
        </div>

        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">list_alt</span>
            <p className="text-lg font-bold">Modèle vide</p>
            <p className="text-sm">Ajoutez des exercices pour ce modèle</p>
          </div>
        ) : (
          exercises.map((exo, exIdx) => (
            <section key={exo.id} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-soft border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-4 border-b border-zinc-50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2 rounded-xl flex items-center justify-center size-10 shadow-sm">
                    <span className="material-symbols-outlined text-xl">fitness_center</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black leading-tight">{exo.name}</h3>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{exo.muscle}</p>
                  </div>
                </div>
                <button onClick={() => removeExercise(exo.id)} className="text-zinc-300 hover:text-red-500 transition-colors p-2">
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>

              <div className="grid grid-cols-12 gap-1.5 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-800/30 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Reps</div>
                <div className="col-span-2">Kg</div>
                <div className="col-span-3">Durée</div>
                <div className="col-span-3">Repos</div>
                <div className="col-span-1"></div>
              </div>

              <div className="p-2 space-y-2">
                {exo.sets.map((set, setIdx) => (
                  <div key={set.id} className="grid grid-cols-12 gap-1.5 items-center">
                    <div className="col-span-1 flex justify-center">
                      <span className="text-[10px] font-black text-zinc-300">{setIdx + 1}</span>
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={set.reps || ''} onChange={e => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)} className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2 text-center font-bold text-xs" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={set.weight || ''} onChange={e => updateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2 text-center font-bold text-xs" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" value={set.durationSeconds || ''} onChange={e => updateSet(exIdx, setIdx, 'durationSeconds', parseInt(e.target.value) || 0)} className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2 text-center font-bold text-xs" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" value={set.restSeconds || ''} onChange={e => updateSet(exIdx, setIdx, 'restSeconds', parseInt(e.target.value) || 0)} className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-2 text-center font-bold text-xs text-primary" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {setIdx > 0 && (
                        <button onClick={() => removeSet(exIdx, setIdx)} className="text-zinc-300 hover:text-red-400 p-1">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-zinc-50 dark:border-zinc-800/50">
                <button onClick={() => addSet(exIdx)} className="w-full py-2 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Ajouter une série
                </button>
              </div>
            </section>
          ))
        )}
      </main>

      <div className="fixed bottom-6 left-0 right-0 z-40 px-6 flex justify-center">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full max-w-sm bg-primary text-black shadow-xl rounded-3xl h-14 flex items-center justify-center gap-3 font-black text-base uppercase tracking-wider shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:grayscale"
        >
          {loading ? (
             <>
               <span className="material-symbols-outlined animate-spin">refresh</span>
               Enregistrement...
             </>
          ) : (
             <>
               <span className="material-symbols-outlined font-black">check</span>
               Enregistrer
             </>
          )}
        </button>
      </div>

    </div>
  );
};

export default NewSession;
