"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const person_controller_1 = __importDefault(require("./person.controller"));
const router = (0, express_1.Router)();
router.get('/', person_controller_1.default.getAllPersons.bind(person_controller_1.default));
router.get('/count', person_controller_1.default.getPersonCount.bind(person_controller_1.default));
router.get('/living', person_controller_1.default.getLivingPersons.bind(person_controller_1.default));
router.get('/deceased', person_controller_1.default.getDeceasedPersons.bind(person_controller_1.default));
router.get('/gender/:gender', person_controller_1.default.getPersonsByGender.bind(person_controller_1.default));
router.get('/:id', person_controller_1.default.getPersonById.bind(person_controller_1.default));
router.post('/', person_controller_1.default.createPerson.bind(person_controller_1.default));
router.put('/:id', person_controller_1.default.updatePerson.bind(person_controller_1.default));
router.delete('/:id', person_controller_1.default.deletePerson.bind(person_controller_1.default));
exports.default = router;
//# sourceMappingURL=person.routes.js.map