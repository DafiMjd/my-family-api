"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const person_service_1 = __importDefault(require("./person.service"));
const express_validator_1 = require("express-validator");
class PersonController {
    async getAllPersons(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: errors.array(),
                });
                return;
            }
            const name = typeof req.query.name === "string" ? req.query.name : undefined;
            const gender = typeof req.query.gender === "string" ? req.query.gender : undefined;
            const limit = req.query.limit !== undefined ? Number(req.query.limit) : 10;
            const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;
            const { data, total } = await person_service_1.default.getAllPersons({ name, gender, limit, offset });
            res.status(200).json({
                success: true,
                data,
                count: data.length,
                total,
                limit: limit ?? null,
                offset,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch persons",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getLatestPersons(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: errors.array(),
                });
                return;
            }
            const limit = req.query.limit !== undefined ? Number(req.query.limit) : 10;
            const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;
            const { data, total } = await person_service_1.default.getLatestPersons({ limit, offset });
            res.status(200).json({
                success: true,
                data,
                count: data.length,
                total,
                limit,
                offset,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch latest persons",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getPersonById(req, res) {
        try {
            const { id } = req.query;
            if (!id || typeof id !== "string") {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "ID query parameter is required",
                });
                return;
            }
            const person = await person_service_1.default.getPersonById(id);
            if (!person) {
                res.status(404).json({
                    success: false,
                    error: "Person not found",
                    message: `Person with ID ${id} does not exist`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: person,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch person",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async createPerson(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: errors.array(),
                });
                return;
            }
            const personData = req.body;
            const person = await person_service_1.default.createPerson(personData);
            res.status(201).json({
                success: true,
                data: person,
                message: "Person created successfully",
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "";
            const statusCode = message.includes("not found")
                ? 404
                : message.includes("already exists")
                    ? 409
                    : 500;
            res.status(statusCode).json({
                success: false,
                error: "Failed to create person",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async updatePerson(req, res) {
        try {
            const { id } = req.query;
            if (!id || typeof id !== "string") {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "ID query parameter is required",
                });
                return;
            }
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: errors.array(),
                });
                return;
            }
            const personData = req.body;
            const person = await person_service_1.default.updatePerson(id, personData);
            if (!person) {
                res.status(404).json({
                    success: false,
                    error: "Person not found",
                    message: `Person with ID ${id} does not exist`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: person,
                message: "Person updated successfully",
            });
        }
        catch (error) {
            const statusCode = error instanceof Error && error.message.includes("already exists")
                ? 409
                : 500;
            res.status(statusCode).json({
                success: false,
                error: "Failed to update person",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async deletePerson(req, res) {
        try {
            const { id } = req.query;
            if (!id || typeof id !== "string") {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "ID query parameter is required",
                });
                return;
            }
            const deleted = await person_service_1.default.deletePerson(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: "Person not found",
                    message: `Person with ID ${id} does not exist`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Person deleted successfully",
            });
        }
        catch (error) {
            error;
            res.status(500).json({
                success: false,
                error: "Failed to delete person",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getLivingPersons(req, res) {
        try {
            const persons = await person_service_1.default.getLivingPersons();
            res.status(200).json({
                success: true,
                data: persons,
                count: persons.length,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch living persons",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getDeceasedPersons(req, res) {
        try {
            const persons = await person_service_1.default.getDeceasedPersons();
            res.status(200).json({
                success: true,
                data: persons,
                count: persons.length,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch deceased persons",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getPersonCount(req, res) {
        try {
            const count = await person_service_1.default.getPersonCount();
            res.status(200).json({
                success: true,
                data: { count },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch person count",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.default = new PersonController();
//# sourceMappingURL=person.controller.js.map