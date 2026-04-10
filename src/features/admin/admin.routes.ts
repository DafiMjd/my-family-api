import { Router } from "express";
import adminController from "./admin.controller";
import { createAdminValidation } from "./admin.validation";

const router = Router();

// POST /api/admin/one - Create new admin
router.post("/one", createAdminValidation, adminController.createAdmin.bind(adminController));

export default router;
