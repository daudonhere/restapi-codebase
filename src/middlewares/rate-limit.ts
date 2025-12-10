import rateLimit from "express-rate-limit";

export const mainRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    code: 429,
    message: "too many requests on auth endpoint, please try again later",
  },
});

export const oauthRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

