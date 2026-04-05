"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const family_service_1 = __importDefault(require("./family.service"));
const express_validator_1 = require("express-validator");
class FamilyController {
    async createFamily(req, res) {
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
            const familyData = req.body;
            const family = await family_service_1.default.createFamily(familyData);
            res.status(201).json({
                success: true,
                data: family,
                message: "Family created successfully",
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async createFamilyById(req, res) {
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
            const familyData = req.body;
            if (familyData.fatherId === familyData.motherId) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "Father and mother must be different persons",
                });
                return;
            }
            const family = await family_service_1.default.createFamilyById(familyData);
            res.status(201).json({
                success: true,
                data: family,
                message: "Family created successfully",
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async getFamilyById(req, res) {
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
            const family = await family_service_1.default.getFamilyById(id);
            if (!family) {
                res.status(404).json({
                    success: false,
                    error: "NOT_FOUND",
                    message: `Family with ID ${id} not found`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: family,
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async getFamilies(req, res) {
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
            const filters = {
                fatherId: req.query.fatherId,
                motherId: req.query.motherId,
                childrenId: req.query.childrenId,
            };
            const families = await family_service_1.default.getFamilies(filters);
            res.status(200).json({
                success: true,
                data: families,
                count: families.length,
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async updateFamilyChildren(req, res) {
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
            const updateData = req.body;
            const family = await family_service_1.default.updateFamilyChildren(id, updateData);
            res.status(200).json({
                success: true,
                data: family,
                message: "Family children updated successfully",
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async updateFamilyFather(req, res) {
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
            const updateData = req.body;
            const family = await family_service_1.default.updateFamilyFather(id, updateData);
            res.status(200).json({
                success: true,
                data: family,
                message: "Family father updated successfully",
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async updateFamilyMother(req, res) {
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
            const updateData = req.body;
            const family = await family_service_1.default.updateFamilyMother(id, updateData);
            res.status(200).json({
                success: true,
                data: family,
                message: "Family mother updated successfully",
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async deleteFamily(req, res) {
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
            const deleteOptions = {
                deleteSpouseRelationship: true,
            };
            const deleted = await family_service_1.default.deleteFamily(id, deleteOptions);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: "NOT_FOUND",
                    message: `Family with ID ${id} not found`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Family deleted successfully",
            });
        }
        catch (error) {
            const errorResponse = this.handleError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    handleError(error) {
        if (error instanceof Error) {
            const message = error.message;
            if (message.includes("not found")) {
                return {
                    statusCode: 404,
                    response: {
                        success: false,
                        error: "NOT_FOUND",
                        message,
                    },
                };
            }
            if (message.includes("must be male") ||
                message.includes("must be female") ||
                message.includes("already married") ||
                message.includes("must have") ||
                message.includes("must be different")) {
                return {
                    statusCode: 409,
                    response: {
                        success: false,
                        error: "CONFLICT",
                        message,
                    },
                };
            }
            if (message.includes("required") || message.includes("invalid")) {
                return {
                    statusCode: 400,
                    response: {
                        success: false,
                        error: "BAD_REQUEST",
                        message,
                    },
                };
            }
        }
        return {
            statusCode: 500,
            response: {
                success: false,
                error: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error ? error.message : "Unknown error occurred",
            },
        };
    }
}
exports.default = new FamilyController();
//# sourceMappingURL=family.controller.js.map