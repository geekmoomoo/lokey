import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-2 border-yellow-500/20 rounded-full animate-spin`}
        >
          <div
            className={`${sizeClasses[size]} border-t-2 border-yellow-500 rounded-full animate-spin`}
          />
        </div>
      </div>
      {message && (
        <span className="ml-2 text-gray-400 text-sm">{message}</span>
      )}
    </div>
  );
};