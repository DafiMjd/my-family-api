import { Request, Response } from "express";
import { validationResult } from "express-validator";
import authService from "./auth.service";
import { LoginRequest, RefreshTokenRequest } from "@/shared/types/auth.types";

class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const { username, password } = req.body as LoginRequest;
      const result = await authService.login(username, password);

      if (!result) {
        res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const isConfigError = message.includes("JWT authentication is not configured");
      res.status(isConfigError ? 503 : 500).json({
        success: false,
        error: isConfigError ? "SERVICE_UNAVAILABLE" : "Failed to sign in",
        message,
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const { refreshToken } = req.body as RefreshTokenRequest;
      const result = await authService.refreshTokens(refreshToken);

      if (!result) {
        res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Invalid or expired refresh token",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const isConfigError = message.includes("JWT authentication is not configured");
      res.status(isConfigError ? 503 : 500).json({
        success: false,
        error: isConfigError ? "SERVICE_UNAVAILABLE" : "Failed to refresh token",
        message,
      });
    }
  }
}

export default new AuthController();
