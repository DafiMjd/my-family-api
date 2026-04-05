import { Router } from "express";
import authController from "./auth.controller";
import { loginValidation, refreshTokenValidation } from "./auth.validation";

const router = Router();

// POST /api/login
router.post("/login", loginValidation, authController.login.bind(authController));

// POST /api/refresh-token
router.post(
  "/refresh-token",
  refreshTokenValidation,
  authController.refreshToken.bind(authController)
);

export default router;
