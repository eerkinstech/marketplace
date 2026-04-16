import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        "Validation failed",
        result.error.flatten().fieldErrors
      )
    );
  }
  req.validatedBody = result.data;
  next();
};
