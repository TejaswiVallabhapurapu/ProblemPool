import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Problems from './pages/Problems';
import CreateProblem from './pages/CreateProblem';
import ProblemDetails from './pages/ProblemDetails';
import SavedProblems from './pages/SavedProblems';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';
import Challenges from './pages/Challenges';
import Platform from './pages/Platform';
import TeamUpDiscovery from './pages/TeamUpDiscovery';
import TeamWorkspace from './pages/TeamWorkspace';
import WebThreadsBackground from './components/WebThreadsBackground';

function AppContent() {
  const location = useLocation();
  const isPlatformPage = location.pathname === '/' || location.pathname === '/platform';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signin' || location.pathname === '/signup';
  const isPublicNavbarPage = isPlatformPage || isAuthPage;

  return (
    <div className="flex flex-col min-h-screen bg-[#080808] text-[#f8fafc] relative">
      {/* Global WebThreads Background for all application and auth pages except Platform */}
      {!isPlatformPage && <WebThreadsBackground />}

      {isPublicNavbarPage ? (
        /* Public Landing & Authentication pages: Minimal Top Navbar, no left sidebar */
        <div className="relative z-10 flex flex-col flex-grow min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Platform />} />
              <Route path="/platform" element={<Platform />} />
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signin" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      ) : (
        /* Authenticated Application pages: Left Vertical Sidebar + Main Content */
        <div className="relative z-10 flex flex-col flex-grow min-h-screen">
          <Sidebar />

          {/* Main content offset by left sidebar on desktop (md:pl-64) and mobile top bar padding (pt-16 md:pt-0) */}
          <div className="md:pl-64 flex flex-col flex-grow min-h-screen pt-16 md:pt-0">
            <main className="flex-grow">
              <Routes>
                {/* Routes */}
                <Route path="/" element={<Platform />} />
                <Route path="/platform" element={<Platform />} />
                <Route path="/home" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/signin" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Problem & Community Workspaces */}
                <Route
                  path="/problems"
                  element={
                    <ProtectedRoute>
                      <Problems />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/problems/tag/:tag"
                  element={
                    <ProtectedRoute>
                      <Problems />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/problems/category/:category"
                  element={
                    <ProtectedRoute>
                      <Problems />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/problems/:id"
                  element={
                    <ProtectedRoute>
                      <ProblemDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/problems/:problemId/team/:teamId"
                  element={
                    <ProtectedRoute>
                      <TeamWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/team-up"
                  element={
                    <ProtectedRoute>
                      <TeamUpDiscovery />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/problem/:id"
                  element={
                    <ProtectedRoute>
                      <ProblemDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-problem"
                  element={
                    <ProtectedRoute>
                      <CreateProblem />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved-problems"
                  element={
                    <ProtectedRoute>
                      <SavedProblems />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:idOrUsername"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/challenges"
                  element={
                    <ProtectedRoute>
                      <Challenges />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
