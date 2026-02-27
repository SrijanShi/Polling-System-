export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: any) => {
  if (error.isOperational) {
    return {
      success: false,
      message: error.message,
      statusCode: error.statusCode
    };
  }

  console.error('UNHANDLED ERROR:', error);
  
  return {
    success: false,
    message: 'Something went wrong',
    statusCode: 500
  };
};