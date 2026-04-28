import { describe, expect, it } from "vitest"

describe("feed-retriever", () => {
  it.skip("should return undefined (requires AWS credentials and env vars)", async () => {
    const { lambdaHandler } = await import("../../src/lambda/rss-retriever")
    const result = await lambdaHandler()
    expect(result).toBe("Success")
  })
})
