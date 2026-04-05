import prisma from "@/shared/database/prisma";
import { Admin } from "@prisma/client";

class AuthRepository {
  async findAdminByUsername(username: string): Promise<Admin | null> {
    return await prisma.admin.findUnique({
      where: { username },
    });
  }

  async findAdminById(id: string): Promise<Admin | null> {
    return await prisma.admin.findUnique({
      where: { id },
    });
  }
}

export default new AuthRepository();
