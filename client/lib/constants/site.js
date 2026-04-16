const browserApiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
const serverApiUrl = process.env.INTERNAL_API_URL || "http://localhost:5000/api";

export const API_URL = typeof window === "undefined" ? serverApiUrl : browserApiUrl;
