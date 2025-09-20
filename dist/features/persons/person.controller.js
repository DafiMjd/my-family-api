"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const person_service_1 = __importDefault(require("./person.service"));
class PersonController {
    async getAllPersons(req, res) {
        try {
            const persons = await person_service_1.default.getAllPersons();
            res.status(200).json({
                success: true,
                data: persons,
                count: persons.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch persons',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getPersonById(req, res) {
        try {
            const { id } = req.params;
            const person = await person_service_1.default.getPersonById(id);
            if (!person) {
                res.status(404).json({
                    success: false,
                    error: 'Person not found',
                    message: `Person with ID ${id} does not exist`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: person
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch person',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async createPerson(req, res) {
        try {
            const personData = req.body;
            if (!personData.name || !personData.gender || !personData.birthDate) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Name, gender, and birth date are required'
                });
                return;
            }
            const person = await person_service_1.default.createPerson(personData);
            res.status(201).json({
                success: true,
                data: person,
                message: 'Person created successfully'
            });
        }
        catch (error) {
            const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
            res.status(statusCode).json({
                success: false,
                error: 'Failed to create person',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updatePerson(req, res) {
        try {
            const { id } = req.params;
            const personData = req.body;
            const person = await person_service_1.default.updatePerson(id, personData);
            if (!person) {
                res.status(404).json({
                    success: false,
                    error: 'Person not found',
                    message: `Person with ID ${id} does not exist`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: person,
                message: 'Person updated successfully'
            });
        }
        catch (error) {
            const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
            res.status(statusCode).json({
                success: false,
                error: 'Failed to update person',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async deletePerson(req, res) {
        try {
            const { id } = req.params;
            const deleted = await person_service_1.default.deletePerson(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Person not found',
                    message: `Person with ID ${id} does not exist`
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Person deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete person',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getPersonsByGender(req, res) {
        try {
            const { gender } = req.params;
            const persons = await person_service_1.default.getPersonsByGender(gender);
            res.status(200).json({
                success: true,
                data: persons,
                count: persons.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch persons by gender',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getLivingPersons(req, res) {
        try {
            const persons = await person_service_1.default.getLivingPersons();
            res.status(200).json({
                success: true,
                data: persons,
                count: persons.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch living persons',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getDeceasedPersons(req, res) {
        try {
            const persons = await person_service_1.default.getDeceasedPersons();
            res.status(200).json({
                success: true,
                data: persons,
                count: persons.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch deceased persons',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getPersonCount(req, res) {
        try {
            const count = await person_service_1.default.getPersonCount();
            res.status(200).json({
                success: true,
                data: { count }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch person count',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.default = new PersonController();
//# sourceMappingURL=person.controller.js.map