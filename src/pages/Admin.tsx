import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Only remove authentication data, keep profiles and unlocked profiles
    localStorage.removeItem('adminAuth');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Home Button */}
      <Link to="/" className="absolute top-6 left-6 z-10">
        <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 transition-all duration-200">
          ← Home
        </Button>
      </Link>
      
      {!isAuthenticated ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Admin;
