import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Landing & Authentication */}
              <Route path="/" element={<Home />} />
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
      </Router>
    </AuthProvider>
  );
}

export default App;

