import { Request, Response, NextFunction } from "express";
import authService from "@/features/auth/auth.service";

/**
 * Requires a valid access JWT in the Authorization header: `Bearer <token>`.
 */
export function requireAccessJwt(req: Request, res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Authentication required: send Authorization: Bearer <access_token>",
      });
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Authentication required: missing access token",
      });
      return;
    }

    const verified = authService.verifyAccessToken(token);
    if (!verified) {
      res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      });
      return;
    }

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isConfigError = message.includes("JWT authentication is not configured");
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR",
      message,
    });
  }
}
