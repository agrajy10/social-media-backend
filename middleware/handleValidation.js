import { validationResult } from "express-validator";

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((error) => {
        if (error.type === "alternative_grouped") {
          return error.nestedErrors.flat().map((nestedError) => ({
            [nestedError.path]: nestedError.msg,
          }));
        }
        return { [error.path]: error.msg };
      }),
    });
  }
  next();
}

export default handleValidation;
