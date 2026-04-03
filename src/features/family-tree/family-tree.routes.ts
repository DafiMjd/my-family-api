import { Router } from "express";
import familyTreeController from "./family-tree.controller";
import { personIdParamValidation, withSpouseQueryValidation } from "./family-tree.validation";

const router = Router();

// GET /api/family-tree/roots - Get first generation (persons with no parents)
router.get("/roots", familyTreeController.getRoots.bind(familyTreeController));

// GET /api/family-tree/:personId/children - Get children of a person
router.get(
  "/:personId/children",
  personIdParamValidation,
  withSpouseQueryValidation,
  familyTreeController.getChildren.bind(familyTreeController)
);

// GET /api/family-tree/:personId/parents - Get parents of a person
router.get(
  "/:personId/parents",
  personIdParamValidation,
  familyTreeController.getParents.bind(familyTreeController)
);

export default router;
