import { Request, Response } from "express";
import { validationResult } from "express-validator";
import adminService from "./admin.service";
import { CreateAdminRequest } from "@/shared/types/admin.types";

class AdminController {
  // POST /api/admin/one
  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const { username, password } = req.body as CreateAdminRequest;
      const admin = await adminService.createAdmin(username, password);

      res.status(201).json({
        success: true,
        data: admin,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const isConflict = message.includes("already exists");

      res.status(isConflict ? 409 : 500).json({
        success: false,
        error: isConflict ? "CONFLICT" : "Failed to create admin",
        message,
      });
    }
  }
}

export default new AdminController();
