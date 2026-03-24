import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './redux/store';

// Placeholders for pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Teams from './pages/Teams';

import React from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const DynamicTitle = () => {
  const location = useLocation();
  
  useEffect(() => {
    const defaultTitle = 'API Insight';
    const path = location.pathname;
    
    if (path === '/dashboard') document.title = `Dashboard | ${defaultTitle}`;
    else if (path === '/teams') document.title = `Teams | ${defaultTitle}`;
    else if (path === '/login') document.title = `Login | ${defaultTitle}`;
    else if (path === '/register') document.title = `Register | ${defaultTitle}`;
    else if (path.startsWith('/projects/')) document.title = `Project | ${defaultTitle}`;
    else document.title = defaultTitle;
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <DynamicTitle />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          } />

          <Route path="/teams" element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
