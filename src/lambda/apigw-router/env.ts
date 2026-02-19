const getRequiredEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const SERVER_ENV = {
  AGENT_RUNTIME_ARN: getRequiredEnv("AGENT_RUNTIME_ARN"),
  AGENTCORE_LOG_TABLE_NAME: getRequiredEnv("AGENTCORE_LOG_TABLE_NAME"),
  HISTORY_ITEM_LIMIT: parseInt(getRequiredEnv("HISTORY_ITEM_LIMIT"), 10),
  AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME || "local-dev",
}
