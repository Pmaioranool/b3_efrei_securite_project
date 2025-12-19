
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, Session } from '../context/AppContext';
import workoutService from '../services/workoutService';

const WorkoutLibrary: React.FC = () => {
  const { templates, deleteTemplate, addSession } = useApp();
  const navigate = useNavigate();
  const [apiWorkouts, setApiWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ workoutId: string; workoutName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<{ message: string; details: string } | null>(null);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const workouts = await workoutService.getWorkouts();
      setApiWorkouts(workouts);
    } catch (error) {
      console.error('Erreur lors du chargement des workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const displayWorkouts = apiWorkouts;

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ workoutId: id, workoutName: name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setIsDeleting(true);
      setError(null);
      await workoutService.deleteWorkout(deleteConfirm.workoutId);
      deleteTemplate(deleteConfirm.workoutId);
      setDeleteConfirm(null);
      // Recharger les workouts après la suppression
      await loadWorkouts();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setDeleteConfirm(null);
      setError({
        message: "Échec de la suppression",
        details: error?.response?.status === 403
          ? "Vous n'avez pas les permissions pour supprimer cette séance. Assurez-vous d'être le propriétaire."
          : error?.response?.status === 401
          ? "Session expirée. Veuillez vous reconnecter."
          : error?.response?.status === 404
          ? "Cette séance n'existe plus. Elle a peut-être déjà été supprimée."
          : "Erreur de connexion au serveur. Vérifiez votre connexion internet et réessayez."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handlePlanQuickly = (template: Session) => {
    navigate('/planning', { state: { selectedTemplateId: template.id } });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black tracking-tight">Mes Séances</h1>
          <button 
            onClick={() => navigate('/new-session')}
            className="size-10 bg-primary text-black rounded-full flex items-center justify-center shadow-glow"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <p className="text-sm font-medium text-gray-500">Gérez vos modèles d'entraînement</p>
      </header>

      <main className="px-4 space-y-4">
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
        
        {loading ? (
          <div className="text-center py-20 opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4 animate-pulse">fitness_center</span>
            <p className="font-bold">Chargement...</p>
          </div>
        ) : displayWorkouts.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">fitness_center</span>
            <p className="font-bold">Aucune séance enregistrée</p>
            <p className="text-xs">Créez votre première séance !</p>
          </div>
        ) : (
          displayWorkouts.map((workout) => {
            const workoutId = workout._id || workout.id;
            const exerciseCount = workout.exercises?.length || 0;
            const muscles = workout.exercises?.map((ex: any) => ex.exercise?.BodyPart || ex.muscle || 'N/A') || [];
            
            return (
              <div 
                key={workoutId} 
                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-100 dark:border-zinc-800 shadow-soft group hover:border-primary transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">exercise</span>
                    </div>
                    <div>
                      <h3 className="font-black text-lg leading-tight">{workout.name}</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {exerciseCount} exercices
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteClick(workoutId, workout.name)}
                    className="text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                  {[...new Set(muscles)].map((m, i) => (
                    <span key={i} className="text-[10px] font-bold bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-500">{m}</span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/planning', { state: { selectedWorkoutId: workoutId } })}
                    className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Planifier
                  </button>
                  <button 
                    onClick={() => navigate(`/edit-session/${workoutId}`)}
                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => navigate(`/active-session/${workoutId}`)}
                    className="flex-1 py-3 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-glow hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Lancer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50 animate-in fade-in">
          <div className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom duration-300">
            <div className="text-center mb-6">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">delete</span>
              </div>
              <h2 className="font-black text-lg mb-2">Supprimer cette séance ?</h2>
              <p className="text-sm text-zinc-500 mb-1">"{deleteConfirm.workoutName}"</p>
              <p className="text-xs text-zinc-400">Cette action est irréversible</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Suppression...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">delete</span>
                    Supprimer définitivement
                  </>
                )}
              </button>
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLibrary;
