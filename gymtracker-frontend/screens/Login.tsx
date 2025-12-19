import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details: string; validation?: string[] } | null>(null);
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    pseudonym: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation côté client
    if (!loginData.email) {
      setError({
        message: "Email requis",
        details: "Veuillez saisir votre adresse email pour vous connecter."
      });
      setLoading(false);
      return;
    }
    
    if (!loginData.email.includes('@')) {
      setError({
        message: "Email invalide",
        details: "L'adresse email doit contenir un '@' et être au format valide (exemple: utilisateur@domaine.com)."
      });
      setLoading(false);
      return;
    }

    if (!loginData.password) {
      setError({
        message: "Mot de passe requis",
        details: "Veuillez saisir votre mot de passe pour vous connecter."
      });
      setLoading(false);
      return;
    }

    try {
      await authService.login(loginData);
      navigate('/');
    } catch (err: any) {
      const status = err?.response?.status;
      setError({
        message: status === 401 ? "Identifiants incorrects" : "Échec de connexion",
        details: status === 401 
          ? "L'email ou le mot de passe est incorrect. Vérifiez vos informations et réessayez."
          : status === 429
          ? "Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer."
          : "Erreur de connexion au serveur. Vérifiez votre connexion internet."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation côté client
    if (!registerData.pseudonym || registerData.pseudonym.length < 2) {
      setError({
        message: "Pseudonyme invalide",
        details: "Le pseudonyme doit contenir au moins 2 caractères."
      });
      setLoading(false);
      return;
    }

    if (!registerData.email || !registerData.email.includes('@')) {
      setError({
        message: "Email invalide",
        details: "L'adresse email doit être au format valide (exemple: utilisateur@domaine.com)."
      });
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError({
        message: "Mots de passe différents",
        details: "Les deux mots de passe ne correspondent pas. Veuillez vérifier que vous avez saisi le même mot de passe dans les deux champs."
      });
      setLoading(false);
      return;
    }

    // Validation détaillée du mot de passe
    const passwordValidation = [];
    if (registerData.password.length < 6 || registerData.password.length > 99) {
      passwordValidation.push("Longueur entre 6 et 99 caractères");
    }
    if (!/(?=.*[a-z])/.test(registerData.password)) {
      passwordValidation.push("Au moins 1 lettre minuscule (a-z)");
    }
    if (!/(?=.*[A-Z])/.test(registerData.password)) {
      passwordValidation.push("Au moins 1 lettre majuscule (A-Z)");
    }
    if (!/(?=.*\d)/.test(registerData.password)) {
      passwordValidation.push("Au moins 1 chiffre (0-9)");
    }
    if (!/(?=.*[$@$!%*?&_])/.test(registerData.password)) {
      passwordValidation.push("Au moins 1 caractère spécial parmi: $ @ ! % * ? & _");
    }

    if (passwordValidation.length > 0) {
      setError({
        message: "Mot de passe non conforme",
        details: "Votre mot de passe ne respecte pas les critères de sécurité requis. Il doit contenir:",
        validation: passwordValidation
      });
      setLoading(false);
      return;
    }

    try {
      await authService.register(registerData);
      navigate('/');
    } catch (err: any) {
      const status = err?.response?.status;
      const errorMsg = err?.response?.data?.errors?.[0]?.msg || err?.response?.data?.message;
      
      setError({
        message: status === 409 ? "Email déjà utilisé" : "Échec de l'inscription",
        details: status === 409
          ? "Un compte existe déjà avec cet email. Essayez de vous connecter ou utilisez un autre email."
          : errorMsg
          ? errorMsg
          : "Erreur de connexion au serveur. Vérifiez votre connexion internet."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl">
      {/* Top Bar */}
      <div className="flex items-center p-4 justify-between sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">GymTracker</h2>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-8">
        {/* Hero */}
        <div className="w-full mt-2 mb-6 gap-1 overflow-hidden rounded-2xl flex shadow-soft aspect-[2/1] relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <div 
            className="w-full bg-center bg-no-repeat bg-cover flex-1 transform group-hover:scale-105 transition-transform duration-700"
            style={{ backgroundImage: 'url("https://picsum.photos/seed/gym/800/400")' }}
          >
          </div>
          <div className="absolute bottom-3 left-4 z-20">
            <p className="text-white text-xs font-medium bg-primary px-2 py-0.5 rounded-md inline-block mb-1">Motivation</p>
            <p className="text-white font-bold text-sm">Prêt à transpirer ?</p>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-slate-900 dark:text-slate-50 tracking-tight text-3xl font-bold leading-tight">
            {isLogin ? 'Start your journey' : 'Rejoignez-nous'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {isLogin ? 'Connectez-vous pour suivre vos progrès' : 'Créez votre compte pour commencer'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 dark:text-red-400 text-sm">{error.message}</h3>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error.details}</p>
                {error.validation && error.validation.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-red-600 dark:text-red-300">
                    {error.validation.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Toggle */}
        <div className="flex mb-8">
          <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 p-1 relative">
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 z-10 ${isLogin ? 'bg-white dark:bg-surface-dark shadow-sm' : ''} transition-all duration-200`}>
              <span className={`truncate text-sm ${isLogin ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>Se connecter</span>
              <input 
                type="radio" 
                name="auth-toggle" 
                value="login" 
                className="invisible w-0 absolute" 
                checked={isLogin}
                onChange={() => {
                  setIsLogin(true);
                  setError('');
                }}
              />
            </label>
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 z-10 ${!isLogin ? 'bg-white dark:bg-surface-dark shadow-sm' : ''} transition-all duration-200`}>
              <span className={`truncate text-sm ${!isLogin ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>S'inscrire</span>
              <input 
                type="radio" 
                name="auth-toggle" 
                value="signup" 
                className="invisible w-0 absolute"
                checked={!isLogin}
                onChange={() => {
                  setIsLogin(false);
                  setError('');
                }}
              />
            </label>
          </div>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <label className="flex flex-col flex-1 group">
              <span className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-normal pb-2 ml-1">Email</span>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 material-symbols-outlined text-[20px]">mail</span>
                <input 
                  type="email" 
                  placeholder="exemple@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary border-transparent bg-input-light dark:bg-input-dark h-14 placeholder:text-slate-400 pl-11 pr-4 text-base font-normal leading-normal transition-all" 
                />
              </div>
            </label>
            <label className="flex flex-col flex-1 group">
              <span className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-normal pb-2 ml-1">Mot de passe</span>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 material-symbols-outlined text-[20px]">lock</span>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                  minLength={6}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary border-transparent bg-input-light dark:bg-input-dark h-14 placeholder:text-slate-400 pl-11 pr-12 text-base font-normal leading-normal transition-all" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-primary transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </label>
            
            <div className="flex justify-end -mt-1">
              <a href="#" className="text-primary hover:text-primary-dark text-sm font-medium transition-colors">Mot de passe oublié ?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.98] text-white h-14 text-base font-bold shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form className="flex flex-col gap-5" onSubmit={handleRegister}>
            <label className="flex flex-col flex-1 group">
              <span className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-normal pb-2 ml-1">Pseudonyme</span>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 material-symbols-outlined text-[20px]">person</span>
                <input 
                  type="text" 
                  placeholder="VotrePseudo"
                  value={registerData.pseudonym}
                  onChange={(e) => setRegisterData({...registerData, pseudonym: e.target.value})}
                  required
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary border-transparent bg-input-light dark:bg-input-dark h-14 placeholder:text-slate-400 pl-11 pr-4 text-base font-normal leading-normal transition-all" 
                />
              </div>
            </label>
            <label className="flex flex-col flex-1 group">
              <span className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-normal pb-2 ml-1">Email</span>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 material-symbols-outlined text-[20px]">mail</span>
                <input 
                  type="email" 
                  placeholder="exemple@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  required
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary border-transparent bg-input-light dark:bg-input-dark h-14 placeholder:text-slate-400 pl-11 pr-4 text-base font-normal leading-normal transition-all" 
                />
              </div>
            </label>
            <label className="flex flex-col flex-1 group">
              <span className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-normal pb-2 ml-1">Mot de passe</span>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 material-symbols-outlined text-[20px]">lock</span>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  onFocus={() => setShowPasswordHints(true)}
                  required
                  minLength={6}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary border-transparent bg-input-light dark:bg-input-dark h-14 placeholder:text-slate-400 pl-11 pr-12 text-base font-normal leading-normal transition-all" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-primary transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              
              {showPasswordHints && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-2">Le mot de passe doit contenir :</p>
                  <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
                    <li className="flex items-center gap-2">
                      <span className={registerData.password.length >= 6 && registerData.password.length <= 99 ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      Entre 6 et 99 caractères
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={/(?=.*[a-z])/.test(registerData.password) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      Au moins 1 lettre minuscule (a-z)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={/(?=.*[A-Z])/.test(registerData.password) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      Au moins 1 lettre majuscule (A-Z)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={/(?=.*\d)/.test(registerData.password) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      Au moins 1 chiffre (0-9)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={/(?=.*[$@$!%*?&_])/.test(registerData.password) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      Au moins 1 caractère spécial ($ @ ! % * ? & _)
                    </li>
                  </ul>
                </div>
              )}
            </label>
            
            <label className="flex flex-col flex-1 group">
              <span className="text-slate-900 dark:text-slate-200 text-sm font-semibold leading-normal pb-2 ml-1">Confirmer le mot de passe</span>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 material-symbols-outlined text-[20px]">lock</span>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  required
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary border-transparent bg-input-light dark:bg-input-dark h-14 placeholder:text-slate-400 pl-11 pr-12 text-base font-normal leading-normal transition-all" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-primary transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">Les mots de passe ne correspondent pas</p>
              )}
              {registerData.confirmPassword && registerData.password === registerData.confirmPassword && registerData.password.length > 0 && (
                <p className="text-xs text-green-500 dark:text-green-400 mt-1 ml-1 flex items-center gap-1">
                  <span>✓</span> Les mots de passe correspondent
                </p>
              )}
            </label>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.98] text-white h-14 text-base font-bold shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>
        )}

        <div className="relative flex py-8 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">Ou continuer avec</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {/* Social Buttons Mockups */}
          {['Apple', 'Google', 'Facebook'].map((social) => (
             <button key={social} className="size-14 rounded-full bg-white dark:bg-input-dark border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-xl">{social === 'Apple' ? 'star' : social === 'Google' ? 'language' : 'thumb_up'}</span>
             </button>
          ))}
        </div>

        <div className="mt-auto text-center px-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            En continuant, vous acceptez nos 
            <a href="#" className="underline decoration-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mx-1">Conditions d'utilisation</a> 
            et notre 
            <a href="#" className="underline decoration-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mx-1">Politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;