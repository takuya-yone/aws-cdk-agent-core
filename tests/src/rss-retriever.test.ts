import { describe, expect, it } from "vitest"
import { lambdaHandler } from "../../src/lambda/rss-retriever"

describe("feed-retriever", () => {
  it("should return undefined", async () => {
    const result = await lambdaHandler()
    expect(result).toBe("Success")
  })
})
