import { Router } from "express";
import familyTreeController from "./family-tree.controller";
import { addChildrenValidation, personIdParamValidation, withSpouseQueryValidation } from "./family-tree.validation";

const router = Router();

// GET /api/family-tree/roots - First generation (no parents). Omits people married to a descendant
// (spouse has parents): they are shown under the spouse's family line instead.
router.get("/roots", familyTreeController.getRoots.bind(familyTreeController));

// GET /api/family-tree/married-couples - Opposite-gender spouse pairs (for parent pickers)
router.get("/married-couples", familyTreeController.getMarriedCouples.bind(familyTreeController));

// POST /api/family-tree/add-children - Add new children to a parent (and their spouse)
router.post(
  "/add-children",
  addChildrenValidation,
  familyTreeController.addChildren.bind(familyTreeController)
);

// GET /api/family-tree/children - Get children of a father/mother pair
router.get(
  "/children",
  withSpouseQueryValidation,
  familyTreeController.getChildren.bind(familyTreeController)
);

// GET /api/family-tree/:personId/closest-related-people - Get spouse, children, and parents in one call
router.get(
  "/:personId/closest-related-people",
  personIdParamValidation,
  familyTreeController.getClosestRelatedPeople.bind(familyTreeController)
);

// GET /api/family-tree/:personId/parents - Get parents of a person
router.get(
  "/:personId/parents",
  personIdParamValidation,
  familyTreeController.getParents.bind(familyTreeController)
);

// GET /api/family-tree/has-child/:personId - Check whether person has at least one child
router.get(
  "/has-child/:personId",
  personIdParamValidation,
  familyTreeController.hasChildren.bind(familyTreeController)
);

export default router;
