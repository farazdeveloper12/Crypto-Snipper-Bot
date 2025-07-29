// src/context/AuthContext.js
import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const userData = { name: 'Demo User', email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return true;
    } catch (err) {
      setError('Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mock register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful registration
      setUser({ name: userData.name, email: userData.email });
      localStorage.setItem('user', JSON.stringify(userData));
      
      return true;
    } catch (err) {
      setError('Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};