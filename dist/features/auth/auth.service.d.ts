import { LoginResponse, RefreshTokenResponse } from "../../shared/types/auth.types";
export interface VerifiedAccessToken {
    adminId: string;
    username: string;
}
declare class AuthService {
    login(username: string, password: string): Promise<LoginResponse | null>;
    refreshTokens(refreshToken: string): Promise<RefreshTokenResponse | null>;
    verifyAccessToken(token: string): VerifiedAccessToken | null;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map