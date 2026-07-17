import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for sensitive authentication endpoints (registration, login)
 * to guard against brute-force and credential stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for public write endpoints (such as submitting poll votes,
 * creating orders, and submitting match predictions) to prevent spamming and abuse.
 */
export const writeRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 submissions per minute
  message: {
    success: false,
    message: 'Too many actions submitted from this IP, please wait a minute before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
