import { describe, expect, it } from "vitest"
import { handler } from "../../src/lambda/feed-retriever"

describe("feed-retriever", () => {
  it("should return undefined", async () => {
    const result = await handler()
    expect(result).toBeUndefined()
  })
})
