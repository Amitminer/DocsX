export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api",

  pagination: {
    defaultLimit: 12,
    maxLimit: 50,
  },
} as const
