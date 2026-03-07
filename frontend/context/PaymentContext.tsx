import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AccessSession, AccessTier } from '../types';

interface PaymentContextType {
  session: AccessSession;
  grantAccess: (tier: AccessTier) => void;
  checkAccess: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const FREE_SESSION: AccessSession = {
  isActive: true,
  expiresAt: null,
  tier: AccessTier.MONTHLY,
};

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AccessSession>(FREE_SESSION);

  const checkAccess = () => {
    setSession(FREE_SESSION);
  };

  useEffect(() => {
    checkAccess();
  }, []);

  const grantAccess = (tier: AccessTier) => {
    setSession({ ...FREE_SESSION, tier });
  };

  return (
    <PaymentContext.Provider value={{ session, grantAccess, checkAccess }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayment must be used within a PaymentProvider');
  return context;
};