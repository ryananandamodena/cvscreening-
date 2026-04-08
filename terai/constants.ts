/**
 * Application Constants
 * 
 * NOTE: All services should reference API_BASE_URL from this file
 * to ensure consistent port configuration across the application.
 * 
 * Default port: 8081 (consistent with ai.service.ts and other services)
 */
export const APP_NAME = 'RecruitAI Enterprise';

/**
 * Base URL for API requests
 * Uses environment variable if set, otherwise defaults to localhost:8081
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

/**
 * Default API port - used for consistency across all services
 */
export const DEFAULT_API_PORT = 8081;
