/**
 * Structured logger for payment and error tracking
 */

const logMessage = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  
  // Handle Error objects
  if (data instanceof Error) {
    data = {
      name: data.name,
      message: data.message,
      stack: data.stack,
      ...(data.response ? { response: data.response } : {}),
      ...(data.code ? { code: data.code } : {})
    };
  }

  const logData = {
    timestamp,
    level,
    message,
    ...(typeof data === 'object' ? data : { data })
  };

  // Ensure we can stringify circular references
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(logData, getCircularReplacer(), 2));
      break;
    case 'warn':
      console.warn(JSON.stringify(logData, getCircularReplacer(), 2));
      break;
    case 'info':
    default:
      console.log(JSON.stringify(logData, getCircularReplacer(), 2));
  }
};

const logger = {
  info: (message, data = {}) => logMessage('info', message, data),
  warn: (message, data = {}) => logMessage('warn', message, data),
  error: (message, data = {}) => logMessage('error', message, data)
};

export { logger };
