/**
 * Async Handler Wrapper
 * Eliminates try/catch boilerplate in controllers
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
