import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { initializeUserAccount } from '../services/firestoreService';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface StoredAccount {
  uid: string;
  email: string;
  displayName: string;
  password?: string;
  major?: string;
  university?: string;
  isDemo?: boolean;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, pass: string, isDemo?: boolean) => Promise<void>;
  signUp: (email: string, pass: string, name: string, major?: string, university?: string, isDemo?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACTIVE_USER_KEY = 'studyflow_active_user';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'studyflow_student_accounts';

function getStoredAccounts(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredAccount(account: StoredAccount) {
  try {
    const existing = getStoredAccounts();
    existing[account.email.toLowerCase()] = account;
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save account locally:', err);
  }
}

function generateUserIdForEmail(email: string): string {
  // Generate deterministic sanitized safe ID for this email
  const cleanEmail = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
    hash |= 0;
  }
  const prefix = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  return `usr_${prefix}_${Math.abs(hash)}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if there is an existing locally saved student session
    try {
      const savedUserStr = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr) as AuthUser;
        if (savedUser && savedUser.uid) {
          setCurrentUser(savedUser);
          const accounts = getStoredAccounts();
          const isDemo = accounts[savedUser.email?.toLowerCase() || '']?.isDemo || false;
          initializeUserAccount(
            savedUser.uid,
            savedUser.email || '',
            savedUser.displayName || undefined,
            undefined,
            undefined,
            isDemo
          ).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error reading saved session:', e);
    }

    // 2. Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Student',
        };
        setCurrentUser(authUser);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(authUser));
        await initializeUserAccount(user.uid, user.email || '', user.displayName || undefined, undefined, undefined, false);
      }
      setLoading(false);
    });

    // Timeout safety
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 700);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, pass: string, isDemo = false) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Firebase Auth first
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      if (userCredential.user) {
        const authUser: AuthUser = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || normalizedEmail.split('@')[0],
        };
        setCurrentUser(authUser);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(authUser));
        await initializeUserAccount(userCredential.user.uid, normalizedEmail, authUser.displayName || undefined, undefined, undefined, isDemo);
        return;
      }
    } catch (firebaseErr: unknown) {
      const err = firebaseErr as { code?: string; message?: string };
      if (err.code !== 'auth/operation-not-allowed' && err.code !== 'auth/configuration-not-found') {
        // Continue to resilient fallback
      }
    }

    // 2. Local student account fallback
    const accounts = getStoredAccounts();
    const existing = accounts[normalizedEmail];

    const uid = existing?.uid || generateUserIdForEmail(normalizedEmail);
    const displayName = existing?.displayName || normalizedEmail.split('@')[0];

    const authUser: AuthUser = {
      uid,
      email: normalizedEmail,
      displayName,
    };

    saveStoredAccount({
      uid,
      email: normalizedEmail,
      displayName,
      password: pass,
      major: existing?.major,
      university: existing?.university,
      isDemo: isDemo || existing?.isDemo || false,
    });

    setCurrentUser(authUser);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(authUser));
    await initializeUserAccount(uid, normalizedEmail, displayName, existing?.major, existing?.university, isDemo || existing?.isDemo || false);
  };

  const signUp = async (
    email: string,
    pass: string,
    name: string,
    major?: string,
    university?: string,
    isDemo = false
  ) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Firebase Auth first
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
      if (userCredential.user) {
        if (name) {
          try {
            await updateProfile(userCredential.user, { displayName: name });
          } catch {}
        }
        const authUser: AuthUser = {
          uid: userCredential.user.uid,
          email: normalizedEmail,
          displayName: name || normalizedEmail.split('@')[0],
        };
        setCurrentUser(authUser);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(authUser));
        await initializeUserAccount(authUser.uid, normalizedEmail, name, major, university, isDemo);
        return;
      }
    } catch (firebaseErr: unknown) {
      const err = firebaseErr as { code?: string; message?: string };
      console.warn('Firebase signup fallback notification:', err.code || err.message);
    }

    // 2. Resilient student account fallback
    const uid = generateUserIdForEmail(normalizedEmail);
    const authUser: AuthUser = {
      uid,
      email: normalizedEmail,
      displayName: name.trim() || normalizedEmail.split('@')[0],
    };

    saveStoredAccount({
      uid,
      email: normalizedEmail,
      displayName: authUser.displayName || 'Student',
      password: pass,
      major: major?.trim(),
      university: university?.trim(),
      isDemo,
    });

    setCurrentUser(authUser);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(authUser));
    await initializeUserAccount(uid, normalizedEmail, name, major, university, isDemo);
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
