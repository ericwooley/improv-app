import { env } from './env'

export interface EnvironmentConfig {
  baseURL: string
  apiURL: string
  // Add other environment-specific variables here
}

const environments: Record<string, EnvironmentConfig> = {
  local: {
    baseURL: 'http://localhost:5173',
    apiURL: 'http://localhost:4080',
  },
  docker: {
    baseURL: 'http://localhost:4081',
    apiURL: 'http://localhost:4081',
  },
  staging: {
    baseURL: 'https://staging.your-app.com',
    apiURL: 'https://api.staging.your-app.com',
  },
  production: {
    baseURL: 'https://your-app.com',
    apiURL: 'https://api.your-app.com',
  },
}

// Get the environment from the TEST_ENV environment variable, default to 'local'
const currentEnv = env.TEST_ENV || 'local'

// Export the current environment configuration
export const config: EnvironmentConfig = environments[currentEnv]

// Validate that we have a valid environment
if (!config) {
  throw new Error(`Invalid environment: ${currentEnv}. Valid environments are: ${Object.keys(environments).join(', ')}`)
}
