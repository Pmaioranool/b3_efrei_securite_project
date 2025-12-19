
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// --- Types ---
export type Set = {
  id: string;
  reps: number;
  weight: number;
  durationSeconds?: number;
  restSeconds: number;
  completed: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  type: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cardio';
  sets: Set[];
};

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'custom';

export type Session = {
  id: string;
  name: string;
  date: string;
  durationMinutes: number;
  status: 'planned' | 'completed' | 'missed';
  exercises: Exercise[];
  calories?: number;
  isTemplate?: boolean;
  recurrence?: {
    type: RecurrenceType;
    days?: number[]; // 0-6 pour Dimanche-Samedi
    frequency?: number; // Toutes les X semaines/jours
    endDate?: string;
  };
};

type AppContextType = {
  user: User;
  sessions: Session[];
  templates: Session[];
  completeSession: (id: string) => void;
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  saveAsTemplate: (session: Session) => void;
  deleteTemplate: (id: string) => void;
  updateUser: (user: Partial<User>) => void;
  getWeeklyStats: () => { count: number; duration: number; calories: number; volume: number };
  getHistoryByWeek: () => { weekLabel: string, volume: number, count: number }[];
};

export type User = {
  name: string;
  email: string;
  avatar: string;
  stats: { age: number; weight: number; height: number };
  goals: { weeklyWorkouts: number; dailyCalories: number; targetWeight: number };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({
    name: 'Alexandre', email: 'alex@fitness.com', avatar: 'https://picsum.photos/seed/alex/200/200',
    stats: { age: 28, weight: 78, height: 182 },
    goals: { weeklyWorkouts: 4, dailyCalories: 2400, targetWeight: 75 }
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<Session[]>([]);

  const completeSession = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'completed', calories: s.durationMinutes * 8.5 } : s));
  };

  const addSession = (session: Session) => setSessions(prev => [...prev, session]);
  const removeSession = (id: string) => setSessions(prev => prev.filter(s => s.id !== id));
  
  const saveAsTemplate = (session: Session) => {
    const template: Session = { ...session, id: Date.now().toString(), isTemplate: true, status: 'planned' };
    setTemplates(prev => [...prev, template]);
  };

  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));

  const updateUser = (upd: Partial<User>) => setUser(prev => ({ ...prev, ...upd }));
  
  const getWeeklyStats = () => {
    const last7 = sessions.filter(s => s.status === 'completed' && new Date(s.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return { 
      count: last7.length, 
      duration: last7.reduce((a, b) => a + b.durationMinutes, 0), 
      calories: last7.reduce((a, b) => a + (b.calories || 0), 0),
      volume: last7.reduce((a, b) => a + calculateVolume(b), 0)
    };
  };

  const calculateVolume = (session: Session) => {
    return session.exercises.reduce((total, ex) => {
      return total + ex.sets.reduce((st, s) => st + (s.completed ? s.weight * s.reps : 0), 0);
    }, 0);
  };

  const getHistoryByWeek = () => {
    const history = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekSessions = sessions.filter(s => s.status === 'completed' && new Date(s.date) >= start && new Date(s.date) < end);
      history.push({
        weekLabel: i === 0 ? 'Cette sem.' : `S-${i}`,
        volume: weekSessions.reduce((a, b) => a + calculateVolume(b), 0),
        count: weekSessions.length
      });
    }
    return history;
  };

  return (
    <AppContext.Provider value={{ 
      user, sessions, templates, 
      completeSession, addSession, removeSession, 
      saveAsTemplate, deleteTemplate, updateUser, 
      getWeeklyStats, getHistoryByWeek 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
