/**
 * withValidation(schema) — Zod schema validation middleware.
 * Validates req.body against the provided Zod schema.
 * On success, replaces req.body with the parsed (sanitized) data.
 * On failure, returns a structured 400 with all validation errors.
 *
 * Usage: compose(withValidation(MySchema), handler)
 */
export const withValidation = (schema) => async (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }
  // Replace raw req.body with sanitized, typed data — eliminates mass-assignment
  req.body = result.data;
  return next();
};

/**
 * withQueryValidation(schema) — same but validates req.query.
 */
export const withQueryValidation = (schema) => async (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: messages,
    });
  }
  req.query = result.data;
  return next();
};
