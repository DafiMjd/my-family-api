import { AdminResponse } from "../../shared/types/admin.types";
declare class AdminService {
    createAdmin(username: string, password: string): Promise<AdminResponse>;
    private mapToResponse;
}
declare const _default: AdminService;
export default _default;
//# sourceMappingURL=admin.service.d.ts.map