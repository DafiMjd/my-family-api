"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const marriage_service_1 = __importDefault(require("./marriage.service"));
const express_validator_1 = require("express-validator");
class MarriageController {
    async marry(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: errors.mapped(),
                });
                return;
            }
            const marriageData = req.body;
            if (marriageData.personId1 === marriageData.personId2) {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "Cannot marry a person to themselves",
                });
                return;
            }
            const result = await marriage_service_1.default.marry(marriageData);
            res.status(201).json(result);
        }
        catch (error) {
            const errorResponse = this.handleMarriageError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async divorce(req, res) {
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
            const { personId } = req.body;
            const { endDate } = req.body;
            const divorceData = { personId, endDate };
            const result = await marriage_service_1.default.divorce(divorceData);
            res.status(200).json(result);
        }
        catch (error) {
            const errorResponse = this.handleMarriageError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async cancelMarriage(req, res) {
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
            const { personId } = req.body;
            const cancelData = { personId };
            const result = await marriage_service_1.default.cancelMarriage(cancelData);
            res.status(200).json(result);
        }
        catch (error) {
            const errorResponse = this.handleMarriageError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async cancelDivorce(req, res) {
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
            const { personId } = req.body;
            const cancelData = { personId };
            const result = await marriage_service_1.default.cancelDivorce(cancelData);
            res.status(200).json(result);
        }
        catch (error) {
            const errorResponse = this.handleMarriageError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    async getPersonsByStatus(req, res) {
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
            const { status, gender } = req.query;
            if (!status || typeof status !== "string") {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "status query parameter is required",
                });
                return;
            }
            const genderFilter = gender && typeof gender === "string" ? gender : undefined;
            const result = await marriage_service_1.default.getPersonsByStatus(status, genderFilter);
            res.status(200).json(result);
        }
        catch (error) {
            const errorResponse = this.handleMarriageError(error);
            res.status(errorResponse.statusCode).json(errorResponse.response);
        }
    }
    handleMarriageError(error) {
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
            if (message.includes("already married") ||
                message.includes("different genders") ||
                message.includes("no marriage") ||
                message.includes("not currently married") ||
                message.includes("not currently divorced")) {
                return {
                    statusCode: 409,
                    response: {
                        success: false,
                        error: "CONFLICT",
                        message,
                    },
                };
            }
            if (message.includes("Cannot marry") ||
                message.includes("personId") ||
                message.includes("required")) {
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
exports.default = new MarriageController();
//# sourceMappingURL=marriage.controller.js.map