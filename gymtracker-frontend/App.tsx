
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Profile from './screens/Profile';
import Planning from './screens/Planning';
import Stats from './screens/Stats';
import Notifications from './screens/Notifications';
import NewSession from './screens/NewSession';
import EditSession from './screens/EditSession';
import ActiveSession from './screens/ActiveSession';
import Goals from './screens/Goals';
import WorkoutLibrary from './screens/WorkoutLibrary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/new-session" element={
        <ProtectedRoute>
          <NewSession />
        </ProtectedRoute>
      } />
      <Route path="/edit-session/:id" element={
        <ProtectedRoute>
          <EditSession />
        </ProtectedRoute>
      } />
      <Route path="/active-session/:sessionId" element={
        <ProtectedRoute>
          <ActiveSession />
        </ProtectedRoute>
      } />
      <Route path="/active-session" element={
        <ProtectedRoute>
          <ActiveSession />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/planning" element={
        <ProtectedRoute>
          <Layout>
            <Planning />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/stats" element={
        <ProtectedRoute>
          <Layout>
            <Stats />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout>
            <Notifications />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/goals" element={
        <ProtectedRoute>
          <Layout>
            <Goals />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/workouts" element={
        <ProtectedRoute>
          <Layout>
            <WorkoutLibrary />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
}
