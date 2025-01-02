import { validationResult } from "express-validator";

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array().map((error) => {
        if (error.type === "alternative_grouped") {
          return error.nestedErrors.flat().map((nestedError) => ({
            field: nestedError.path,
            message: nestedError.msg,
          }));
        }
        return {
          field: error.path,
          message: error.msg,
        };
      }),
    });
  }
  next();
}

export default handleValidation;
