import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Returns a function: call it before an action that needs an account.
// It returns true when signed in, otherwise shows a toast and sends the user to the login page.
export default function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return useCallback(() => {
    if (user) return true;
    toast('Please log in to do that');
    navigate('/login');
    return false;
  }, [user, navigate]);
}
