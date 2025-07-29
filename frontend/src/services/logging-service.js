// frontend/src/services/logging-service.js
import * as Sentry from "@sentry/react";

class LoggingService {
  static initialize() {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new Sentry.BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: process.env.REACT_APP_ENVIRONMENT
    });
  }

  static setUser(user) {
    Sentry.setUser({
      id: user.id,
      email: user.email
    });
  }

  static logError(error, context) {
    Sentry.captureException(error, {
      tags: { context }
    });
  }

  static logMessage(message, level = 'info') {
    Sentry.captureMessage(message, level);
  }
}

export default LoggingService;