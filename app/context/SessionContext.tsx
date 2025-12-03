/* eslint-disable react-hooks/set-state-in-effect */
// app/context/SessionContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionData {
  tableId: string;
  userId: string;
  orderId: string;
  customerName: string;
  tableNumber: number;
  timestamp: number;
}

interface SessionContextType {
  session: SessionData | null;
  setSession: (data: Omit<SessionData, 'timestamp'>) => void;
  clearSession: () => void;
  isLoading: boolean;
  updateSession: (updates: Partial<SessionData>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión desde localStorage al iniciar
    const stored = localStorage.getItem('customerSession');
    if (stored) {
      try {
        const sessionData = JSON.parse(stored);
        
        // Verificar que la sesión no sea muy antigua (4 horas máximo)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 4 * 60 * 60 * 1000; // 4 horas
        
        if (sessionAge > maxAge) {
          localStorage.removeItem('customerSession');
          setSession(null);
        } else {
          setSession(sessionData);
        }
      } catch (err) {
        localStorage.removeItem('customerSession');
        setSession(null);
      }
    }
    setIsLoading(false);
  }, []);

  const handleSetSession = (data: Omit<SessionData, 'timestamp'>) => {
    const sessionData: SessionData = {
      ...data,
      timestamp: Date.now()
    };
    setSession(sessionData);
    localStorage.setItem('customerSession', JSON.stringify(sessionData));
  };

  const updateSession = (updates: Partial<SessionData>) => {
    if (session) {
      const updatedSession = {
        ...session,
        ...updates,
        timestamp: Date.now()
      };
      setSession(updatedSession);
      localStorage.setItem('customerSession', JSON.stringify(updatedSession));
    }
  };

  const clearSession = () => {
    setSession(null);
    localStorage.removeItem('customerSession');
  };

  return (
    <SessionContext.Provider value={{
      session,
      setSession: handleSetSession,
      clearSession,
      isLoading,
      updateSession
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}