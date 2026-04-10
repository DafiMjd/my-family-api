"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const person_validation_1 = require("../persons/person.validation");
const family_tree_controller_1 = __importDefault(require("./family-tree.controller"));
const family_tree_validation_1 = require("./family-tree.validation");
const router = (0, express_1.Router)();
router.get("/roots", family_tree_controller_1.default.getRoots.bind(family_tree_controller_1.default));
router.get("/married-couples", family_tree_controller_1.default.getMarriedCouples.bind(family_tree_controller_1.default));
router.post("/add-children", family_tree_validation_1.addChildrenValidation, family_tree_controller_1.default.addChildren.bind(family_tree_controller_1.default));
router.get("/children", family_tree_validation_1.withSpouseQueryValidation, family_tree_controller_1.default.getChildren.bind(family_tree_controller_1.default));
router.get("/children-candidate", person_validation_1.latestPersonsQueryValidation, family_tree_controller_1.default.getChildrenCandidates.bind(family_tree_controller_1.default));
router.get("/:personId/closest-related-people", family_tree_validation_1.personIdParamValidation, family_tree_controller_1.default.getClosestRelatedPeople.bind(family_tree_controller_1.default));
router.get("/:personId/parents", family_tree_validation_1.personIdParamValidation, family_tree_controller_1.default.getParents.bind(family_tree_controller_1.default));
router.get("/has-child/:personId", family_tree_validation_1.personIdParamValidation, family_tree_controller_1.default.hasChildren.bind(family_tree_controller_1.default));
exports.default = router;
//# sourceMappingURL=family-tree.routes.js.map