export const env = {
  // @ts-ignore
  CI: process.env.CI as string,
  // @ts-ignore
  TEST_ENV: process.env.TEST_ENV as string,

  // @ts-ignore
  BASE_URL: process.env.BASE_URL as string,

  // @ts-ignore
  API_URL: process.env.API_URL as string,
}
