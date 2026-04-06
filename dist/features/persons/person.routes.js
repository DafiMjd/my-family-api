"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const require_access_jwt_middleware_1 = require("@/shared/middleware/require-access-jwt.middleware");
const person_controller_1 = __importDefault(require("./person.controller"));
const person_validation_1 = require("./person.validation");
const router = (0, express_1.Router)();
router.get("/list", person_validation_1.listPersonsQueryValidation, person_controller_1.default.getAllPersons.bind(person_controller_1.default));
router.get("/count", person_controller_1.default.getPersonCount.bind(person_controller_1.default));
router.get("/living/list", person_controller_1.default.getLivingPersons.bind(person_controller_1.default));
router.get("/deceased/list", person_controller_1.default.getDeceasedPersons.bind(person_controller_1.default));
router.get("/latest/list", person_validation_1.latestPersonsQueryValidation, person_controller_1.default.getLatestPersons.bind(person_controller_1.default));
router.get("/one", person_controller_1.default.getPersonById.bind(person_controller_1.default));
router.post("/one", require_access_jwt_middleware_1.requireAccessJwt, person_validation_1.createPersonValidation, person_controller_1.default.createPerson.bind(person_controller_1.default));
router.put("/one", require_access_jwt_middleware_1.requireAccessJwt, person_validation_1.updatePersonValidation, person_controller_1.default.updatePerson.bind(person_controller_1.default));
router.delete("/one", require_access_jwt_middleware_1.requireAccessJwt, person_controller_1.default.deletePerson.bind(person_controller_1.default));
exports.default = router;
//# sourceMappingURL=person.routes.js.map