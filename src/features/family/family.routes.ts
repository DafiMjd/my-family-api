import { Router } from "express";
import { requireAccessJwt } from "@/shared/middleware/require-access-jwt.middleware";
import familyController from "./family.controller";
import {
  createFamilyByIdValidation,
  updateFamilyChildrenValidation,
  updateFamilyFatherValidation,
  updateFamilyMotherValidation,
  getFamiliesValidation,
  createFamilyValidation,
} from "./family.validation";

const router = Router();

// GET /api/family/list - Get all families with optional filters
router.get(
  "/list",
  getFamiliesValidation,
  familyController.getFamilies.bind(familyController)
);

// GET /api/family/one - Get family by ID (query param)
router.get("/one", familyController.getFamilyById.bind(familyController));

// POST /api/family/one - Create new family
router.post(
  "/one",
  requireAccessJwt,
  createFamilyValidation,
  familyController.createFamily.bind(familyController)
);

// POST /api/family/one - Create new family by ID
router.post(
  "/one/by-id",
  requireAccessJwt,
  createFamilyByIdValidation,
  familyController.createFamilyById.bind(familyController)
);

// PUT /api/family/one/children - Update family children (query param)
router.put(
  "/one/children",
  requireAccessJwt,
  updateFamilyChildrenValidation,
  familyController.updateFamilyChildren.bind(familyController)
);

// PUT /api/family/one/father - Update family father (query param)
router.put(
  "/one/father",
  requireAccessJwt,
  updateFamilyFatherValidation,
  familyController.updateFamilyFather.bind(familyController)
);

// PUT /api/family/one/mother - Update family mother (query param)
router.put(
  "/one/mother",
  requireAccessJwt,
  updateFamilyMotherValidation,
  familyController.updateFamilyMother.bind(familyController)
);

// DELETE /api/family/one - Delete family (query param)
router.delete(
  "/one",
  requireAccessJwt,
  familyController.deleteFamily.bind(familyController)
);

export default router;
