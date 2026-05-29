import React, { useState } from 'react';
import { useTracking } from '../context/TrackingContext';

const RatingModal = ({ language: _language, region, onSubmit }) => {
  const { isRatingModalOpen, setIsRatingModalOpen, completedOrder, setCompletedOrder } = useTracking();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  if (!isRatingModalOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      setError("Please select a rating before submitting.");
      return;
    }
    setError("");
    
    const feedbackData = {
      orderId: completedOrder?.orderId,
      rating,
      comment: feedback,
      timestamp: Date.now()
    };

    if (onSubmit) onSubmit(feedbackData);
    
    // Reset and close
    setIsRatingModalOpen(false);
    setCompletedOrder(null);
    setRating(0);
    setFeedback("");
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 10001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .rating-modal-card {
          background: white;
          padding: 40px;
          border-radius: 24px;
          maxWidth: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .agent-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1d5ba0, #2563eb);
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          border: 4px solid #f0f5ff;
          box-shadow: 0 4px 12px rgba(29, 91, 160, 0.2);
        }
      `}</style>

      <div className="rating-modal-card">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #1d5ba0, #10b981)' }}></div>
        
        <div className="agent-avatar">
          <i className="fas fa-user-tie"></i>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
          {region === 'ke' ? 'Maina Kamau' : 'Rahul Kumar'}
        </h3>
        <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Your Delivery Partner
        </p>

        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Order Delivered!</h2>
        <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
          Your order <strong>#{completedOrder?.orderId}</strong> was delivered successfully. 
          Please rate your experience with our partner.
        </p>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`${star <= (hover || rating) ? 'fas' : 'far'} fa-star`}
              onClick={() => {
                setRating(star);
                if (error) setError("");
              }}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                fontSize: '36px',
                color: star <= (hover || rating) ? '#f59e0b' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: star <= (hover || rating) ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          ))}
        </div>
        {error && (
          <div style={{ margin: '-12px 0 18px', color: '#dc2626', fontSize: '13px', fontWeight: 700 }}>
            {error}
          </div>
        )}

        <textarea
          placeholder="What did you like most? (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{
            width: '100%',
            height: '110px',
            padding: '16px',
            borderRadius: '16px',
            border: '2px solid #f1f5f9',
            background: '#f8fafc',
            fontSize: '14px',
            marginBottom: '24px',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1d5ba0'}
          onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => { setIsRatingModalOpen(false); setCompletedOrder(null); }}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: '#1d5ba0',
              color: 'white',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(29, 91, 160, 0.3)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
