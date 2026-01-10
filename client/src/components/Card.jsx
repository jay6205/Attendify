import React from 'react';

const Card = ({ children, className = '' }) => {
  // Reusable Card component with a subtle border and glass-morphism effect
  return (
    <div className={`glass rounded-xl p-6 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default Card;
