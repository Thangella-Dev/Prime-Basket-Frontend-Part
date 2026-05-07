import React from 'react';
import { useTracking } from '../context/TrackingContext';

const TrackingPopup = ({ onOpenTracking }) => {
  const { activeOrder } = useTracking();

  // Hide when no active order OR when delivered
  if (!activeOrder || activeOrder.status === 'Delivered') return null;

  return (
    <div 
      className="tracking-popup-bubble"
      onClick={onOpenTracking}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 10000,
        background: '#1d5ba0',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'bounce 2s infinite',
        border: '2px solid rgba(255,255,255,0.2)'
      }}
    >
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-5px);}
          60% {transform: translateY(-3px);}
        }
      `}</style>
      <div style={{
        width: '35px',
        height: '35px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px'
      }}>
        <i className="fas fa-truck"></i>
      </div>
      <div>
        <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>Track Order</div>
        <div style={{ fontSize: '14px', fontWeight: 800 }}>{activeOrder.status}</div>
      </div>
      <i className="fas fa-chevron-right" style={{ fontSize: '12px', opacity: 0.7 }}></i>
    </div>
  );
};

export default TrackingPopup;
