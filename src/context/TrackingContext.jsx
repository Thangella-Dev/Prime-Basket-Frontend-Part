import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TrackingContext = createContext();

export const useTracking = () => useContext(TrackingContext);

const WALLET_KEY = 'wallet';
const STEPS = ['Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];
const STEP_INTERVAL = 15000; // 15 seconds per step

export const TrackingProvider = ({ children }) => {
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('pb_active_tracking') || 'null');
      // Migrate stale "Delivered Successfully" to "Delivered"
      if (stored && stored.status === 'Delivered Successfully') {
        stored.status = 'Delivered';
      }
      return stored;
    } catch {
      return null;
    }
  });

  const [wallet, setWallet] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(WALLET_KEY) || "null");
      if (stored && typeof stored === "object" && typeof stored.balance === "number") return stored;
      return { balance: 0.00, transactions: [] };
    } catch {
      return { balance: 0.00, transactions: [] };
    }
  });

  const walletBalance = wallet.balance;

  const setWalletBalance = (newValOrFn) => {
    setWallet(prev => {
      const nextBalance = typeof newValOrFn === 'function' ? newValOrFn(prev.balance) : newValOrFn;
      return { ...prev, balance: nextBalance };
    });
  };

  const [completedOrder, setCompletedOrder] = useState(null);
  const intervalRef = useRef(null);

  // Persist activeOrder to localStorage
  useEffect(() => {
    localStorage.setItem('pb_active_tracking', JSON.stringify(activeOrder));
  }, [activeOrder]);

  // Persist wallet
  useEffect(() => {
    const existingWallet = JSON.parse(localStorage.getItem('wallet') || '{"balance": 0, "transactions": []}');
    if (existingWallet.balance !== walletBalance) {
      existingWallet.balance = walletBalance;
      localStorage.setItem('wallet', JSON.stringify(existingWallet));
      window.dispatchEvent(new Event("wallet-updated"));
    }
  }, [walletBalance]);

  // Listen for external wallet updates
  useEffect(() => {
    const syncWallet = () => {
      try {
        const wallet = JSON.parse(localStorage.getItem('wallet') || 'null');
        if (wallet && wallet.balance !== undefined) {
          setWalletBalance(wallet.balance);
        }
      } catch {}
    };
    window.addEventListener("wallet-updated", syncWallet);
    window.addEventListener("storage", syncWallet);
    return () => {
      window.removeEventListener("wallet-updated", syncWallet);
      window.removeEventListener("storage", syncWallet);
    };
  }, []);

  // Single interval tied to orderId only — never restarts on status change
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!activeOrder?.orderId) return;
    // If already delivered, don't start interval
    if (activeOrder.status === 'Delivered') return;

    intervalRef.current = setInterval(() => {
      setActiveOrder(prev => {
        if (!prev) return null;
        const currentIndex = STEPS.indexOf(prev.status);
        if (currentIndex < 0 || currentIndex >= STEPS.length - 1) {
          // Already delivered or unknown status — stop
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return prev;
        }

        const nextStatus = STEPS[currentIndex + 1];
        const updated = { ...prev, status: nextStatus };

        // Sync to orders history in localStorage
        try {
          const orders = JSON.parse(localStorage.getItem('pb_orders') || '[]');
          const updatedOrders = orders.map(o =>
            o.orderId === prev.orderId ? { ...o, status: nextStatus } : o
          );
          localStorage.setItem('pb_orders', JSON.stringify(updatedOrders));
          window.dispatchEvent(new Event('storage'));
        } catch {}

        if (nextStatus === 'Delivered') {
          setCompletedOrder(updated);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        return updated;
      });
    }, STEP_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // ONLY re-run when orderId changes (new order), never on status change
  }, [activeOrder?.orderId]);

  const startTracking = (order) => {
    const orderToTrack = {
      ...order,
      status: 'Confirmed',
      startTime: Date.now()
    };
    setActiveOrder(orderToTrack);
  };

  const stopTracking = () => {
    setActiveOrder(null);
  };

  const addWalletMoney = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return;

    setWalletBalance(prev => prev + numericAmount);

    const wallet = JSON.parse(localStorage.getItem('wallet') || '{"balance": 0, "transactions": []}');
    wallet.transactions.unshift({
      id: Date.now(),
      amount: numericAmount,
      type: 'credit',
      reason: 'Added to wallet',
      date: new Date().toISOString()
    });
    localStorage.setItem('wallet', JSON.stringify(wallet));
  };

  const useWalletMoney = (amount) => {
    const numericAmount = Number(amount);
    if (walletBalance >= numericAmount) {
      setWalletBalance(prev => prev - numericAmount);

      const wallet = JSON.parse(localStorage.getItem('wallet') || '{"balance": 0, "transactions": []}');
      wallet.transactions.unshift({
        id: Date.now(),
        amount: -numericAmount,
        type: 'debit',
        reason: 'Payment for order',
        date: new Date().toISOString()
      });
      localStorage.setItem('wallet', JSON.stringify(wallet));
      return true;
    }
    return false;
  };

  return (
    <TrackingContext.Provider value={{
      activeOrder,
      startTracking,
      stopTracking,
      walletBalance,
      setWalletBalance,
      addWalletMoney,
      useWalletMoney,
      completedOrder,
      setCompletedOrder
    }}>
      {children}
    </TrackingContext.Provider>
  );
};
