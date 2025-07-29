// frontend/src/utils/error-handler.js
class ErrorHandler {
  static handleError(error, customHandlers = {}) {
    // Default error handling
    const defaultHandlers = {
      400: this.handleBadRequest,
      401: this.handleUnauthorized,
      403: this.handleForbidden,
      404: this.handleNotFound,
      500: this.handleServerError
    };

    // Merge default and custom handlers
    const handlers = { ...defaultHandlers, ...customHandlers };

    if (error.response) {
      // The request was made and the server responded with a status code
      const status = error.response.status;
      const handler = handlers[status] || this.handleGenericError;
      
      return handler(error.response.data, error);
    } else if (error.request) {
      // The request was made but no response was received
      return this.handleNetworkError(error);
    } else {
      // Something happened in setting up the request
      return this.handleGenericError(error.message);
    }
  }

  static handleBadRequest(data, error) {
    return {
      type: 'error',
      message: data.message || 'Invalid request. Please check your input.',
      details: data
    };
  }

  static handleUnauthorized(data, error) {
    // Trigger logout or redirect to login
    localStorage.removeItem('authToken');
    window.location.href = '/login';

    return {
      type: 'unauthorized',
      message: 'Session expired. Please log in again.',
      details: data
    };
  }

  static handleForbidden(data, error) {
    return {
      type: 'warning',
      message: 'You do not have permission to perform this action.',
      details: data
    };
  }

  static handleNotFound(data, error) {
    return {
      type: 'error',
      message: 'The requested resource was not found.',
      details: data
    };
  }

  static handleServerError(data, error) {
    return {
      type: 'error',
      message: 'A server error occurred. Please try again later.',
      details: data
    };
  }

  static handleNetworkError(error) {
    return {
      type: 'error',
      message: 'Network error. Please check your internet connection.',
      details: error
    };
  }

  static handleGenericError(message) {
    return {
      type: 'error',
      message: message || 'An unexpected error occurred.',
      details: null
    };
  }

  // Logging method
  static logError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // Optional: Send to logging service
    if (process.env.REACT_APP_LOGGING_SERVICE) {
      this.sendToLoggingService(error, context);
    }
  }

  static sendToLoggingService(error, context) {
    // Implement logging service integration
    // Could use services like Sentry, LogRocket, etc.
  }
}

export default ErrorHandler;