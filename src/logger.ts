export const systemLogger = {
  log: (category: string, message: string, data?: any) => {
    console.log(`[${category}] ${message}`, data);
  },
  error: (category: string, message: string, data?: any) => {
    console.error(`[${category}] ${message}`, data);
  },
  warn: (category: string, message: string, data?: any) => {
    console.warn(`[${category}] ${message}`, data);
  }
};