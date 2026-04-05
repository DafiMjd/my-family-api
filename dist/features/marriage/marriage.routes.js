"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const require_access_jwt_middleware_1 = require("@/shared/middleware/require-access-jwt.middleware");
const marriage_controller_1 = __importDefault(require("./marriage.controller"));
const marriage_validation_1 = require("./marriage.validation");
const router = (0, express_1.Router)();
router.post('/marry', require_access_jwt_middleware_1.requireAccessJwt, marriage_validation_1.marryValidation, marriage_controller_1.default.marry.bind(marriage_controller_1.default));
router.put('/divorce', require_access_jwt_middleware_1.requireAccessJwt, marriage_validation_1.divorceValidation, marriage_controller_1.default.divorce.bind(marriage_controller_1.default));
router.delete('/cancel', require_access_jwt_middleware_1.requireAccessJwt, marriage_validation_1.cancelMarriageValidation, marriage_controller_1.default.cancelMarriage.bind(marriage_controller_1.default));
router.put('/cancel-divorce', require_access_jwt_middleware_1.requireAccessJwt, marriage_validation_1.cancelDivorceValidation, marriage_controller_1.default.cancelDivorce.bind(marriage_controller_1.default));
router.get('/person/list', marriage_validation_1.personListValidation, marriage_controller_1.default.getPersonsByStatus.bind(marriage_controller_1.default));
exports.default = router;
//# sourceMappingURL=marriage.routes.js.map