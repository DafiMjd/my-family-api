import bcrypt from "bcrypt";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import authRepository from "./auth.repository";
import { Admin } from "@prisma/client";
import { LoginResponse, RefreshTokenResponse } from "@/shared/types/auth.types";

function accessSignOptions(): SignOptions {
  const expiresIn =
    process.env.JWT_EXPIRES_IN?.trim() && process.env.JWT_EXPIRES_IN.trim().length > 0
      ? process.env.JWT_EXPIRES_IN.trim()
      : "1d";
  return { expiresIn: expiresIn as SignOptions["expiresIn"] };
}

function refreshSignOptions(): SignOptions {
  const expiresIn =
    process.env.JWT_REFRESH_EXPIRES_IN?.trim() &&
    process.env.JWT_REFRESH_EXPIRES_IN.trim().length > 0
      ? process.env.JWT_REFRESH_EXPIRES_IN.trim()
      : "7d";
  return { expiresIn: expiresIn as SignOptions["expiresIn"] };
}

function getJwtSecrets(): { accessSecret: string; refreshSecret: string } {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new Error(
      "JWT authentication is not configured: set JWT_SECRET and JWT_REFRESH_SECRET in the environment"
    );
  }
  return { accessSecret, refreshSecret };
}

function issueTokenPair(admin: Admin): { token: string; refreshToken: string } {
  const { accessSecret, refreshSecret } = getJwtSecrets();

  const token = jwt.sign(
    { sub: admin.id, username: admin.username, tokenType: "access" },
    accessSecret,
    accessSignOptions()
  );

  const refreshToken = jwt.sign(
    { sub: admin.id, tokenType: "refresh" },
    refreshSecret,
    refreshSignOptions()
  );

  return { token, refreshToken };
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse | null> {
    const admin = await authRepository.findAdminByUsername(username);
    if (!admin) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) {
      return null;
    }

    const { token, refreshToken } = issueTokenPair(admin);

    return {
      id: admin.id,
      username: admin.username,
      token,
      refreshToken,
    };
  }

  /**
   * Exchanges a valid refresh JWT for a new access + refresh pair.
   * Returns null if the token is invalid, expired, or not a refresh token.
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse | null> {
    const { refreshSecret } = getJwtSecrets();

    let payload: JwtPayload & { tokenType?: string };
    try {
      payload = jwt.verify(refreshToken, refreshSecret) as JwtPayload & { tokenType?: string };
    } catch {
      return null;
    }

    if (payload.tokenType !== "refresh" || typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }

    const admin = await authRepository.findAdminById(payload.sub);
    if (!admin) {
      return null;
    }

    const pair = issueTokenPair(admin);
    return pair;
  }
}

export default new AuthService();
