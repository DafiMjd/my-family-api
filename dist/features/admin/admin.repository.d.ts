import { Admin } from "@prisma/client";
declare class AdminRepository {
    findByUsername(username: string): Promise<Admin | null>;
    create(username: string, hashedPassword: string): Promise<Admin>;
}
declare const _default: AdminRepository;
export default _default;
//# sourceMappingURL=admin.repository.d.ts.map