"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const family_tree_service_1 = __importDefault(require("./family-tree.service"));
class FamilyTreeController {
    async getRoots(req, res) {
        try {
            const roots = await family_tree_service_1.default.getRoots();
            res.status(200).json({
                success: true,
                data: roots,
                count: roots.length,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch first generation",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getChildren(req, res) {
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
            const { personId } = req.params;
            const withSpouse = req.query.withSpouse === "true";
            const children = await family_tree_service_1.default.getChildren(personId, withSpouse);
            res.status(200).json({
                success: true,
                data: children,
                count: children.length,
            });
        }
        catch (error) {
            const isNotFound = error instanceof Error && error.message.includes("not found");
            res.status(isNotFound ? 404 : 500).json({
                success: false,
                error: isNotFound ? "Person not found" : "Failed to fetch children",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getClosestRelatedPeople(req, res) {
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
            const { personId } = req.params;
            const data = await family_tree_service_1.default.getClosestRelatedPeople(personId);
            res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
            const isNotFound = error instanceof Error && error.message.includes("not found");
            res.status(isNotFound ? 404 : 500).json({
                success: false,
                error: isNotFound ? "Person not found" : "Failed to fetch closest related people",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getParents(req, res) {
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
            const { personId } = req.params;
            const parents = await family_tree_service_1.default.getParents(personId);
            res.status(200).json({
                success: true,
                data: parents,
                count: parents.length,
            });
        }
        catch (error) {
            const isNotFound = error instanceof Error && error.message.includes("not found");
            res.status(isNotFound ? 404 : 500).json({
                success: false,
                error: isNotFound ? "Person not found" : "Failed to fetch parents",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async addChildren(req, res) {
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
            const { parentId, children } = req.body;
            const result = await family_tree_service_1.default.addChildren(parentId, children);
            res.status(201).json({
                success: true,
                data: result,
                count: result.children.length,
            });
        }
        catch (error) {
            const isNotFound = error instanceof Error && error.message.includes("not found");
            res.status(isNotFound ? 404 : 500).json({
                success: false,
                error: isNotFound ? "Parent not found" : "Failed to add children",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async hasChildren(req, res) {
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
            const { personId } = req.params;
            const hasChildren = await family_tree_service_1.default.hasChildren(personId);
            res.status(200).json({
                success: true,
                data: {
                    hasChildren,
                },
            });
        }
        catch (error) {
            const isNotFound = error instanceof Error && error.message.includes("not found");
            res.status(isNotFound ? 404 : 500).json({
                success: false,
                error: isNotFound ? "Person not found" : "Failed to check children",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.default = new FamilyTreeController();
//# sourceMappingURL=family-tree.controller.js.map