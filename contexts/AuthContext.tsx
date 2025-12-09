import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../packages/shared/firebase';

interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  provider?: 'google' | 'kakao';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: 'google' | 'kakao') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          provider: 'google' // Currently only Google is implemented
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (provider: 'google' | 'kakao') => {
    try {
      if (provider === 'google') {
        const googleProvider = new GoogleAuthProvider();
        await signInWithPopup(auth, googleProvider);
      } else if (provider === 'kakao') {
        // Kakao login implementation would go here
        console.log('Kakao login not implemented yet');
        throw new Error('Kakao login is not implemented yet');
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};