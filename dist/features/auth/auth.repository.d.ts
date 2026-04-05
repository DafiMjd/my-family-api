import { Admin } from "@prisma/client";
declare class AuthRepository {
    findAdminByUsername(username: string): Promise<Admin | null>;
    findAdminById(id: string): Promise<Admin | null>;
}
declare const _default: AuthRepository;
export default _default;
//# sourceMappingURL=auth.repository.d.ts.map