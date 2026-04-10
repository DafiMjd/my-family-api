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
    async getMarriedCouples(_req, res) {
        try {
            const couples = await family_tree_service_1.default.getMarriedCouples();
            res.status(200).json({
                success: true,
                data: couples,
                count: couples.length,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch married couples",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getChildrenCandidates(req, res) {
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
            const { data, total } = await family_tree_service_1.default.getChildrenCandidates(limit, offset);
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
                error: "Failed to fetch children candidates",
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
            const fatherRaw = req.query.fatherId;
            const motherRaw = req.query.motherId;
            const fatherId = typeof fatherRaw === "string" && fatherRaw.trim() ? fatherRaw.trim() : undefined;
            const motherId = typeof motherRaw === "string" && motherRaw.trim() ? motherRaw.trim() : undefined;
            const withSpouse = req.query.withSpouse === "true";
            const children = await family_tree_service_1.default.getChildren(fatherId, motherId, withSpouse);
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
            const request = req.body;
            const result = await family_tree_service_1.default.addChildren(request);
            res.status(201).json({
                success: true,
                data: result,
                count: result.children.length,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "";
            const isNotFound = message.includes("not found") || message.includes("Parents not found");
            const isBadRequest = message.includes("Duplicate") ||
                message.includes("cannot") ||
                message.includes("children-candidate") ||
                message.includes("Grandparent") ||
                message.includes("eligible");
            const status = isBadRequest ? 400 : isNotFound ? 404 : 500;
            res.status(status).json({
                success: false,
                error: isBadRequest
                    ? "BAD_REQUEST"
                    : isNotFound
                        ? "Parents not found"
                        : "Failed to add children",
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