import { validationResult } from "express-validator";

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((error) => ({ [error.path]: error.msg })),
    });
  }
  next();
}

export default handleValidation;
