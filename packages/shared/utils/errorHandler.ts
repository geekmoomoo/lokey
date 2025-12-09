// 에러 핸들링 유틸리티

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface CustomError {
  type: ErrorType;
  message: string;
  details?: string;
  code?: string | number;
  timestamp: Date;
}

export class AppError extends Error implements CustomError {
  type: ErrorType;
  details?: string;
  code?: string | number;
  timestamp: Date;

  constructor(type: ErrorType, message: string, details?: string, code?: string | number) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.code = code;
    this.timestamp = new Date();
  }
}

// 에러 생성 함수들
export const createNetworkError = (message: string = '네트워크 연결에 실패했습니다.'): AppError => {
  return new AppError(ErrorType.NETWORK, message, '인터넷 연결을 확인해주세요.');
};

export const createAuthError = (message: string = '인증에 실패했습니다.'): AppError => {
  return new AppError(ErrorType.AUTHENTICATION, message, '다시 로그인해주세요.');
};

export const createValidationError = (message: string, details?: string): AppError => {
  return new AppError(ErrorType.VALIDATION, message, details);
};

export const createServerError = (message: string = '서버 오류가 발생했습니다.'): AppError => {
  return new AppError(ErrorType.SERVER_ERROR, message, '잠시 후 다시 시도해주세요.');
};

export const createNotFoundError = (message: string = '요청하신 데이터를 찾을 수 없습니다.'): AppError => {
  return new AppError(ErrorType.NOT_FOUND, message);
};

// 에러 메시지 포맷팅
export const formatErrorMessage = (error: CustomError | Error | unknown): string => {
  if (error instanceof AppError) {
    return error.details ? `${error.message}\n${error.details}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

// 사용자에게 보여줄 에러 메시지 변환
export const getUserFriendlyErrorMessage = (error: CustomError | Error | unknown): string => {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.NETWORK:
        return '🌐 네트워크 연결이 불안정합니다. 인터넷 연결을 확인해주세요.';
      case ErrorType.AUTHENTICATION:
        return '🔐 로그인이 필요합니다. 다시 로그인해주세요.';
      case ErrorType.VALIDATION:
        return '⚠️ 입력 정보가 올바르지 않습니다.';
      case ErrorType.NOT_FOUND:
        return '📄 요청하신 정보를 찾을 수 없습니다.';
      case ErrorType.SERVER_ERROR:
        return '🔧 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return error.message;
    }
  }

  return '❌ 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};

// 로깅 함수
export const logError = (error: CustomError | Error | unknown, context?: string): void => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';

  if (error instanceof AppError) {
    console.error(`[${timestamp}] ${contextStr} ERROR:`, {
      type: error.type,
      message: error.message,
      details: error.details,
      code: error.code,
      stack: error.stack
    });
  } else if (error instanceof Error) {
    console.error(`[${timestamp}] ${contextStr} ERROR:`, {
      message: error.message,
      stack: error.stack
    });
  } else {
    console.error(`[${timestamp}] ${contextStr} UNKNOWN ERROR:`, error);
  }
};