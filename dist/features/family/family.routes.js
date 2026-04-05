"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const require_access_jwt_middleware_1 = require("@/shared/middleware/require-access-jwt.middleware");
const family_controller_1 = __importDefault(require("./family.controller"));
const family_validation_1 = require("./family.validation");
const router = (0, express_1.Router)();
router.get("/list", family_validation_1.getFamiliesValidation, family_controller_1.default.getFamilies.bind(family_controller_1.default));
router.get("/one", family_controller_1.default.getFamilyById.bind(family_controller_1.default));
router.post("/one", require_access_jwt_middleware_1.requireAccessJwt, family_validation_1.createFamilyValidation, family_controller_1.default.createFamily.bind(family_controller_1.default));
router.post("/one/by-id", require_access_jwt_middleware_1.requireAccessJwt, family_validation_1.createFamilyByIdValidation, family_controller_1.default.createFamilyById.bind(family_controller_1.default));
router.put("/one/children", require_access_jwt_middleware_1.requireAccessJwt, family_validation_1.updateFamilyChildrenValidation, family_controller_1.default.updateFamilyChildren.bind(family_controller_1.default));
router.put("/one/father", require_access_jwt_middleware_1.requireAccessJwt, family_validation_1.updateFamilyFatherValidation, family_controller_1.default.updateFamilyFather.bind(family_controller_1.default));
router.put("/one/mother", require_access_jwt_middleware_1.requireAccessJwt, family_validation_1.updateFamilyMotherValidation, family_controller_1.default.updateFamilyMother.bind(family_controller_1.default));
router.delete("/one", require_access_jwt_middleware_1.requireAccessJwt, family_controller_1.default.deleteFamily.bind(family_controller_1.default));
exports.default = router;
//# sourceMappingURL=family.routes.js.map