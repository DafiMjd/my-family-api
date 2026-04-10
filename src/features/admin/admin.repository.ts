import prisma from "@/shared/database/prisma";
import { Admin } from "@prisma/client";

class AdminRepository {
  async findByUsername(username: string): Promise<Admin | null> {
    return await prisma.admin.findUnique({
      where: { username },
    });
  }

  async create(username: string, hashedPassword: string): Promise<Admin> {
    return await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
  }
}

export default new AdminRepository();
