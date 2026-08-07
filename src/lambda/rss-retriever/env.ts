const getRequiredEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const ENV = {
  FEED_URL: getRequiredEnv("FEED_URL"),
  WHATSNEW_FEED_TABLE: getRequiredEnv("WHATSNEW_FEED_TABLE"),
}
