import bcrypt from "bcrypt";
import adminRepository from "./admin.repository";
import { AdminResponse } from "@/shared/types/admin.types";
import { Admin } from "@prisma/client";

class AdminService {
  async createAdmin(username: string, password: string): Promise<AdminResponse> {
    const existingAdmin = await adminRepository.findByUsername(username);
    if (existingAdmin) {
      throw new Error(`Admin with username '${username}' already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAdmin = await adminRepository.create(username, hashedPassword);

    return this.mapToResponse(createdAdmin);
  }

  private mapToResponse(admin: Admin): AdminResponse {
    return {
      id: admin.id,
      username: admin.username,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    };
  }
}

export default new AdminService();
