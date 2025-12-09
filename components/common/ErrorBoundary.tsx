import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logError, getUserFriendlyErrorMessage } from '@shared/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: string) => void;
}

export const ErrorBoundary: React.FC<Props> = ({
  children,
  fallback,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(event.error, 'ErrorBoundary');
      setError(event.error);
      setErrorInfo(`${event.message}\n${event.filename}:${event.lineno}:${event.colno}`);
      setHasError(true);

      if (onError) {
        onError(event.error, `${event.filename}:${event.lineno}:${event.colno}`);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      logError(error, 'ErrorBoundary');
      setError(error);
      setErrorInfo(`Unhandled Promise Rejection: ${event.reason}`);
      setHasError(true);

      if (onError) {
        onError(error, `Unhandled Promise Rejection`);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    setErrorInfo(null);
  };

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-400 text-sm mb-4">
            {getUserFriendlyErrorMessage(error)}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              새로고침
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400">
                개발자 정보 보기
              </summary>
              <pre className="mt-2 text-xs text-red-400 overflow-auto max-h-32">
                {error.toString()}
                {errorInfo}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};