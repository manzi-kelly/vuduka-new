import { useState, useCallback, useEffect } from 'react';

export const useAuthState = () => {
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    type: 'login' // 'login' or 'register'
  });
  
  const [authMessage, setAuthMessage] = useState('');
  const [user, setUser] = useState(null);

  // Load user from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('rideAppUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('rideAppUser');
      }
    }
  }, []);

  const openLoginModal = useCallback(() => {
    setAuthModal({ isOpen: true, type: 'login' });
    setAuthMessage('');
  }, []);

  const openRegisterModal = useCallback(() => {
    setAuthModal({ isOpen: true, type: 'register' });
    setAuthMessage('');
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal({ isOpen: false, type: 'login' });
    setAuthMessage('');
  }, []);

  const switchToRegister = useCallback(() => {
    setAuthModal({ isOpen: true, type: 'register' });
    setAuthMessage('');
  }, []);

  const switchToLogin = useCallback(() => {
    setAuthModal({ isOpen: true, type: 'login' });
    setAuthMessage('');
  }, []);

  // Handle regular login
  const handleLogin = useCallback(async (loginData) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const existingUsers = JSON.parse(localStorage.getItem('rideAppUsers') || '[]');
      const user = existingUsers.find(u => 
        u.email === loginData.emailOrPhone || u.phone === loginData.emailOrPhone
      );

      if (user && user.password === loginData.password) {
        setUser(user);
        localStorage.setItem('rideAppUser', JSON.stringify(user));
        setAuthMessage('Login successful!');
        setTimeout(() => closeAuthModal(), 1500);
        return { success: true };
      } else {
        setAuthMessage('Invalid email/phone or password');
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      setAuthMessage('Login failed. Please try again.');
      return { success: false, error: error.message };
    }
  }, [closeAuthModal]);

  // Handle user registration
  const handleRegister = useCallback(async (userData) => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('rideAppUsers') || '[]');
      const userExists = existingUsers.find(user => 
        user.email === userData.email || user.phone === userData.phone
      );
      
      if (userExists) {
        setAuthMessage('User already exists with this email or phone number');
        return { success: false, error: 'User already exists' };
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString(),
        orderHistory: []
      };

      // Save to users list
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('rideAppUsers', JSON.stringify(updatedUsers));

      // Auto-login after registration
      setUser(newUser);
      localStorage.setItem('rideAppUser', JSON.stringify(newUser));
      setAuthMessage('Registration successful! Welcome to Ufit.');
      setTimeout(() => closeAuthModal(), 1500);
      return { success: true };
    } catch (error) {
      setAuthMessage('Registration failed. Please try again.');
      return { success: false, error: error.message };
    }
  }, [closeAuthModal]);

  // Handle Google login with account verification
  const handleGoogleLogin = useCallback(async () => {
    try {
      // Initialize Google OAuth
      setAuthMessage('Connecting to Google...');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock Google user data
      const googleUser = {
        id: `google_${Date.now()}`,
        name: 'Google User',
        email: `googleuser${Math.floor(Math.random() * 1000)}@gmail.com`,
        isGoogleUser: true,
        createdAt: new Date().toISOString(),
        orderHistory: []
      };

      // Check if user already exists in local storage
      const existingUsers = JSON.parse(localStorage.getItem('rideAppUsers') || '[]');
      let existingUser = existingUsers.find(user => user.email === googleUser.email);
      
      if (!existingUser) {
        // Return no account found for Google user
        setAuthMessage('No account found with this Google email. Please create an account first.');
        return { noAccount: true, email: googleUser.email };
      }
      
      // If user exists, complete login
      setUser(existingUser);
      localStorage.setItem('rideAppUser', JSON.stringify(existingUser));
      setAuthMessage('Google login successful! Welcome to Ufit.');
      setTimeout(() => closeAuthModal(), 1500);
      return { success: true };
      
    } catch (error) {
      console.error('Google login error:', error);
      setAuthMessage('Google authentication failed. Please try again.');
      return { success: false, error: error.message };
    }
  }, [closeAuthModal]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('rideAppUser');
    setUser(null);
    setAuthMessage('You have been logged out');
  }, []);

  return {
    authModal,
    authMessage,
    user,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
    switchToRegister,
    switchToLogin,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleLogout,
    setAuthMessage
  };
};