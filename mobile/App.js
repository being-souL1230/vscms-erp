import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { getSessionToken, getUser, getUserRole } from './src/core/storage/authStorage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const token = await getSessionToken();
      const user = await getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserRole(user.role || 'student');
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onLogout={() => { setIsLoggedIn(false); setUserRole('student'); }}
      />
    </SafeAreaProvider>
  );
}
