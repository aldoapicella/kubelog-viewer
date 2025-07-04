import { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

/**
 * Accessible loading spinner component with optional message
 */
export const LoadingSpinner = memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className="flex items-center justify-center space-x-2"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-600 border-t-blue-500`}
        aria-hidden="true"
      />
      {message && (
        <span className="text-sm text-gray-400">{message}</span>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
