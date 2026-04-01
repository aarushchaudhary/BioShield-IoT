import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SecurityDashboard } from './pages/SecurityDashboard';
import { UserDashboard } from './pages/UserDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute allowedRoles={['security_officer', 'admin']} />}>
            <Route path="/security" element={<Layout><SecurityDashboard /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
            <Route path="/dashboard" element={<Layout><UserDashboard /></Layout>} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div className="text-white p-10">404 - Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
