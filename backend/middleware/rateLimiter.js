import rateLimit from 'express-rate-limit';

// General API rate limiter (protects all /api routes from aggressive flooding)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    statusCode: 429,
  },
});

// Stricter limiter for authentication endpoints (prevents credential brute-forcing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 login/register attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
    statusCode: 429,
  },
});

// AI endpoints limiter (protects LLM APIs, GPU compute & external provider quotas)
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 AI requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI generation rate limit exceeded. Please wait a few minutes before trying again.',
    statusCode: 429,
  },
});
