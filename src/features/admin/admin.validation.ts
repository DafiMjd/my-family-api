import { body } from "express-validator";

export const createAdminValidation = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ max: 100 })
    .withMessage("Username must be at most 100 characters"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ max: 500 })
    .withMessage("Password must be at most 500 characters"),
];
