import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import authService from '../services/authService';
import userService from '../services/userService';

const Profile: React.FC = () => {
  const { user, updateUser } = useApp();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [tempStats, setTempStats] = useState(user.stats);
  const [loading, setLoading] = useState(false);
  const [apiUser, setApiUser] = useState<any>(null);
  const [error, setError] = useState<{ message: string; details: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await userService.getCurrentUser();
        setApiUser(userData);
        if (userData.stats) {
          setTempStats(userData.stats);
        }
      } catch (error) {
        // Si l'API échoue, on utilise juste les données du contexte
        console.log('Utilisation des données locales pour le profil');
      }
    };

    loadUserData();
  }, []);

  const displayUser = apiUser || user;

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await userService.updateStats(tempStats);
      updateUser({ stats: tempStats });
      setIsEditing(false);
      // Essayer de recharger les données, mais continuer si ça échoue
      try {
        const userData = await userService.getCurrentUser();
        setApiUser(userData);
      } catch (e) {
        console.log('Données sauvées localement');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      setError({
        message: "Échec de la mise à jour",
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

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Force logout even if API call fails
      navigate('/login');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!passwordData.currentPassword) {
      setError({
        message: "Mot de passe actuel requis",
        details: "Vous devez saisir votre mot de passe actuel pour des raisons de sécurité."
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError({
        message: "Mots de passe différents",
        details: "Les deux nouveaux mots de passe ne correspondent pas. Veuillez vérifier."
      });
      return;
    }

    // Validation détaillée du mot de passe
    const passwordValidation = [];
    if (passwordData.newPassword.length < 6 || passwordData.newPassword.length > 99) {
      passwordValidation.push("Longueur entre 6 et 99 caractères");
    }
    if (!/(?=.*[a-z])/.test(passwordData.newPassword)) {
      passwordValidation.push("Au moins 1 lettre minuscule (a-z)");
    }
    if (!/(?=.*[A-Z])/.test(passwordData.newPassword)) {
      passwordValidation.push("Au moins 1 lettre majuscule (A-Z)");
    }
    if (!/(?=.*\d)/.test(passwordData.newPassword)) {
      passwordValidation.push("Au moins 1 chiffre (0-9)");
    }
    if (!/(?=.*[$@$!%*?&_])/.test(passwordData.newPassword)) {
      passwordValidation.push("Au moins 1 caractère spécial parmi: $ @ ! % * ? & _");
    }

    if (passwordValidation.length > 0) {
      setError({
        message: "Nouveau mot de passe non conforme",
        details: "Le nouveau mot de passe ne respecte pas les critères de sécurité requis."
      });
      return;
    }

    try {
      setLoading(true);
      // Appel API pour changer le mot de passe
      await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      alert('Mot de passe modifié avec succès !');
    } catch (error: any) {
      console.error('Erreur:', error);
      setError({
        message: "Échec de la modification",
        details: error?.response?.status === 401
          ? "Le mot de passe actuel est incorrect."
          : error?.response?.status === 400
          ? "Le nouveau mot de passe ne respecte pas les critères de sécurité."
          : "Erreur de connexion au serveur. Vérifiez votre connexion internet."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="flex items-center px-6 pt-12 pb-4 justify-between bg-background-light dark:bg-background-dark sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
        <button className="flex items-center justify-center rounded-full size-10 bg-white dark:bg-[#343217] shadow-sm hover:bg-gray-50 dark:hover:bg-[#45421f] transition-colors relative">
          <span className="material-symbols-outlined text-[#1c1c0d] dark:text-[#fcfcf8]" style={{ fontSize: '24px' }}>settings</span>
        </button>
      </header>
      
      <main className="px-4 space-y-6">
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
        
        {/* Avatar Section */}
        <section className="flex flex-col items-center justify-center py-6">
          <div className="relative mb-4">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-28 border-4 border-primary shadow-md" 
              style={{ backgroundImage: `url("${displayUser.avatar || 'https://picsum.photos/seed/user/200/200'}")` }}
            ></div>
            <button className="absolute bottom-0 right-1 bg-white dark:bg-[#23220f] p-2 rounded-full border border-gray-200 dark:border-[#343217] shadow-sm hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>edit</span>
            </button>
          </div>
          <h2 className="text-2xl font-bold text-[#1c1c0d] dark:text-[#fcfcf8]">{displayUser.pseudonym || displayUser.name}</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{displayUser.email}</p>
          <div className="flex gap-2 mt-4">
            <span className="bg-[#f4f4e6] dark:bg-[#343217] px-3 py-1 rounded-full text-xs font-bold text-[#1c1c0d] dark:text-primary border border-primary/20">Pro</span>
            <span className="bg-[#f4f4e6] dark:bg-[#343217] px-3 py-1 rounded-full text-xs font-bold text-gray-500 dark:text-gray-300">Niveau 12</span>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#343217] p-4 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center group relative">
             {isEditing ? (
                 <input 
                    type="number" 
                    value={tempStats.age} 
                    onChange={e => setTempStats({...tempStats, age: parseInt(e.target.value)})} 
                    className="w-16 text-center bg-gray-100 dark:bg-black/20 rounded p-1 font-bold"
                 />
             ) : (
                <>
                    <span className="text-sm text-gray-400 font-medium">Age</span>
                    <span className="text-xl font-bold mt-1">{displayUser.stats?.age || user.stats.age}</span>
                </>
             )}
          </div>
          <div className="bg-white dark:bg-[#343217] p-4 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
             {isEditing ? (
                 <input 
                    type="number" 
                    value={tempStats.weight} 
                    onChange={e => setTempStats({...tempStats, weight: parseInt(e.target.value)})} 
                    className="w-16 text-center bg-gray-100 dark:bg-black/20 rounded p-1 font-bold"
                 />
             ) : (
                <>
                    <span className="text-sm text-gray-400 font-medium">Poids</span>
                    <span className="text-xl font-bold mt-1">{displayUser.stats?.weight || user.stats.weight} <span className="text-sm text-gray-400 font-normal">kg</span></span>
                </>
             )}
          </div>
          <div className="bg-white dark:bg-[#343217] p-4 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
             {isEditing ? (
                 <input 
                    type="number" 
                    value={tempStats.height} 
                    onChange={e => setTempStats({...tempStats, height: parseInt(e.target.value)})} 
                    className="w-16 text-center bg-gray-100 dark:bg-black/20 rounded p-1 font-bold"
                 />
             ) : (
                <>
                    <span className="text-sm text-gray-400 font-medium">Taille</span>
                    <span className="text-xl font-bold mt-1">{displayUser.stats?.height || user.stats.height} <span className="text-sm text-gray-400 font-normal">cm</span></span>
                </>
             )}
          </div>
        </section>

        <div className="flex justify-center">
             <button 
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={loading}
                className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${isEditing ? 'bg-primary text-black' : 'text-primary bg-primary/10'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                 {loading ? 'Sauvegarde...' : isEditing ? 'Sauvegarder les mesures' : 'Modifier mes mesures'}
             </button>
        </div>

        {/* Goals */}
        <section>
          <div className="flex items-center justify-between px-1 pb-3 pt-2">
            <h3 className="text-lg font-bold tracking-tight">Mes Objectifs</h3>
            <Link to="/goals" className="text-sm font-bold text-primary hover:text-[#dcd805] transition-colors">Modifier</Link>
          </div>
          <div className="bg-white dark:bg-[#343217] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#45421f] flex items-center gap-4">
              <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-full">
                <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm">Calories / jour</span>
                  <span className="text-sm font-medium text-gray-500">{displayUser.goals?.dailyCalories || user.goals.dailyCalories} kcal</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-[#23220f] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                <span className="material-symbols-outlined text-blue-500">monitor_weight</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm">Poids cible</span>
                  <span className="text-sm font-medium text-gray-500">{displayUser.goals?.targetWeight || user.goals.targetWeight} kg</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-[#23220f] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((displayUser.goals?.targetWeight || user.goals.targetWeight) / (displayUser.stats?.weight || user.stats.weight)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Links */}
        <section>
          <h3 className="text-lg font-bold tracking-tight px-1 pb-3 pt-2">Compte & Préférences</h3>
          <div className="bg-white dark:bg-[#343217] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <button 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#45421f] transition-colors border-b border-gray-100 dark:border-[#45421f] w-full text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">key</span>
                <span className="font-medium">Modifier le mot de passe</span>
              </div>
              <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform ${isChangingPassword ? 'rotate-90' : ''}`}>arrow_forward_ios</span>
            </button>
            
            {isChangingPassword && (
              <div className="p-4 bg-gray-50 dark:bg-[#23220f] border-b border-gray-100 dark:border-[#45421f]">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2 block">Mot de passe actuel</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">lock</span>
                      <input 
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-[#343217] border border-gray-200 dark:border-[#45421f] rounded-xl pl-11 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPasswords.current ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2 block">Nouveau mot de passe</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">lock</span>
                      <input 
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        onFocus={() => setShowPasswordHints(true)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-[#343217] border border-gray-200 dark:border-[#45421f] rounded-xl pl-11 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPasswords.new ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                    
                    {showPasswordHints && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-2">Le mot de passe doit contenir :</p>
                        <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
                          <li className="flex items-center gap-2">
                            <span className={passwordData.newPassword.length >= 6 && passwordData.newPassword.length <= 99 ? 'text-green-500' : 'text-slate-400'}>✓</span>
                            Entre 6 et 99 caractères
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={/(?=.*[a-z])/.test(passwordData.newPassword) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                            Au moins 1 lettre minuscule (a-z)
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={/(?=.*[A-Z])/.test(passwordData.newPassword) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                            Au moins 1 lettre majuscule (A-Z)
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={/(?=.*\d)/.test(passwordData.newPassword) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                            Au moins 1 chiffre (0-9)
                          </li>
                          <li className="flex items-center gap-2">
                            <span className={/(?=.*[$@$!%*?&_])/.test(passwordData.newPassword) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                            Au moins 1 caractère spécial ($ @ ! % * ? & _)
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2 block">Confirmer le nouveau mot de passe</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">lock</span>
                      <input 
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-[#343217] border border-gray-200 dark:border-[#45421f] rounded-xl pl-11 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPasswords.confirm ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length > 0 && (
                      <p className="text-xs text-green-500 dark:text-green-400 mt-1 flex items-center gap-1">
                        <span>✓</span> Les mots de passe correspondent
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowPasswordHints(false);
                      }}
                      className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-[#45421f] font-bold text-sm hover:bg-gray-100 dark:hover:bg-[#45421f] transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-glow"
                    >
                      {loading ? 'Modification...' : 'Confirmer'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <a href="#" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#45421f] transition-colors border-b border-gray-100 dark:border-[#45421f]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">fitness_center</span>
                <span className="font-medium">Préférences d'entraînement</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward_ios</span>
            </a>
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#45421f] transition-colors border-b border-gray-100 dark:border-[#45421f]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">notifications</span>
                <span className="font-medium">Notifications</span>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary cursor-pointer">
                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
              </div>
            </div>
            <a href="#" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#45421f] transition-colors border-b border-gray-100 dark:border-[#45421f]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">lock</span>
                <span className="font-medium">Confidentialité</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward_ios</span>
            </a>
            <a href="#" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#45421f] transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">credit_card</span>
                <span className="font-medium">Abonnement</span>
              </div>
              <span className="text-xs bg-primary/20 text-primary-dark px-2 py-1 rounded font-bold uppercase tracking-wide">Premium</span>
            </a>
          </div>
        </section>
        
        <section className="pt-4">
            <button 
              onClick={handleLogout}
              className="w-full py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">logout</span>
                Déconnexion
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">Version 2.4.0</p>
        </section>
      </main>
    </>
  );
};

export default Profile;