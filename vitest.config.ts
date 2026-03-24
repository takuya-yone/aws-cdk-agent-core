import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/tests/**/*.{spec,test}.ts'],
    env: {
        FEED_URL: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
        WHATSNEW_FEED_TABLE: 'WhatsNewFeedTable',
    },
  },
});
