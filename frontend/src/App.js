import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

// Import components
import Login from './components/auth/Login';
// Import other components as you create them

// Protected route component
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAuthenticated = !!localStorage.getItem('token');

  // Check if user is authenticated and has the right role
  if (!isAuthenticated || (allowedRole && user?.role !== allowedRole)) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Main App component
function App() {
  return (
      <Provider store={store}>
        <Router>
          <div className="app">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected admin routes */}
              <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRole="admin">
                      <div>Admin Dashboard (To be implemented)</div>
                    </ProtectedRoute>
                  }
              />

              {/* Protected employee routes */}
              <Route
                  path="/employee/dashboard"
                  element={
                    <ProtectedRoute allowedRole="employee">
                      <div>Employee Dashboard (To be implemented)</div>
                    </ProtectedRoute>
                  }
              />

              {/* Redirect to login for root path */}
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </Router>
      </Provider>
  );
}

export default App;