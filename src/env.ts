const getEnvValue = (key: string): string => {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} not set`)
  }
  return value
}

export const env = {
  SLACK_CLIENT_ID: getEnvValue('VITE_SLACK_CLIENT_ID'),
  SLACK_CLIENT_SECRET: getEnvValue('VITE_SLACK_CLIENT_SECRET'),
  SLACK_REDIRECT_URI: getEnvValue('VITE_SLACK_REDIRECT_URI'),
} as const
