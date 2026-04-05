import { LoginResponse, RefreshTokenResponse } from "@/shared/types/auth.types";
declare class AuthService {
    login(username: string, password: string): Promise<LoginResponse | null>;
    refreshTokens(refreshToken: string): Promise<RefreshTokenResponse | null>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map