import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/problems" element={<Problems />} />
              <Route path="/problems/tag/:tag" element={<Problems />} />
              <Route path="/problems/category/:category" element={<Problems />} />
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
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile/:idOrUsername" element={<Profile />} />
              <Route path="/problems/:id" element={<ProblemDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
