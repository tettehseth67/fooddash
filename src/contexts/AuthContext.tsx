import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';
import { dbService } from '../services/db';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await dbService.getUserProfile(user.uid);
      if (userProfile) {
        const driverProfile = await dbService.getDriver(user.uid);
        userProfile.isDriver = !!driverProfile;
        userProfile.isOnline = driverProfile?.isOnline || false;
      }
      setProfile(userProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        let userProfile = await dbService.getUserProfile(u.uid);
        const driverProfile = await dbService.getDriver(u.uid);
        
        if (!userProfile) {
          // Auto-create profile if missing
          const initialProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || 'Foodie',
            photoURL: u.photoURL || '',
            isAdmin: u.email === "tettehseth67@gmail.com",
            isDriver: !!driverProfile,
            isOnline: driverProfile?.isOnline || false,
            favorites: [],
            addresses: []
          };
          await dbService.updateUserProfile(u.uid, initialProfile);
          userProfile = initialProfile;

          // Special case: if workspace owner, activate admin doc too
          if (u.email === "tettehseth67@gmail.com") {
            await dbService.setUserAdmin(u.uid, true);
          }
        } else {
          // Sync driver status to profile object
          userProfile.isDriver = !!driverProfile;
          userProfile.isOnline = driverProfile?.isOnline || false;
          
          // Ensure owner is always admin
          if (u.email === "tettehseth67@gmail.com" && !userProfile.isAdmin) {
            userProfile.isAdmin = true;
            await dbService.setUserAdmin(u.uid, true);
          }
        }
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request') {
        console.error('Sign in error:', error);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, pass);
    
    if (newUser) {
      // Update Firebase Auth profile
      await updateProfile(newUser, { displayName: name });

      const initialProfile: UserProfile = {
        uid: newUser.uid,
        email: newUser.email || '',
        displayName: name || 'Foodie',
        photoURL: '',
        isAdmin: newUser.email === "tettehseth67@gmail.com",
        isDriver: false,
        isOnline: false,
        favorites: [],
        addresses: []
      };
      await dbService.updateUserProfile(newUser.uid, initialProfile);
      setProfile(initialProfile);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signInWithEmail, 
      signUpWithEmail, 
      resetPassword, 
      logOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
