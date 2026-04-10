import { Request, Response } from "express";
import { validationResult } from "express-validator";
import familyTreeService from "./family-tree.service";
import { AddChildrenRequest } from "@/shared/types/family-tree.types";

class FamilyTreeController {
  // GET /api/family-tree/roots
  async getRoots(req: Request, res: Response): Promise<void> {
    try {
      const roots = await familyTreeService.getRoots();

      res.status(200).json({
        success: true,
        data: roots,
        count: roots.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch first generation",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // GET /api/family-tree/married-couples
  async getMarriedCouples(_req: Request, res: Response): Promise<void> {
    try {
      const couples = await familyTreeService.getMarriedCouples();

      res.status(200).json({
        success: true,
        data: couples,
        count: couples.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch married couples",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // GET /api/family-tree/children-candidate — limit & offset only; same response shape as GET /api/person/list
  async getChildrenCandidates(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const { data, total } = await familyTreeService.getChildrenCandidates(limit, offset);

      res.status(200).json({
        success: true,
        data,
        count: data.length,
        total,
        limit: limit ?? null,
        offset,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch children candidates",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // GET /api/family-tree/children?fatherId=...&motherId=...
  async getChildren(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
      const fatherId =
        typeof fatherRaw === "string" && fatherRaw.trim() ? fatherRaw.trim() : undefined;
      const motherId =
        typeof motherRaw === "string" && motherRaw.trim() ? motherRaw.trim() : undefined;
      const withSpouse = req.query.withSpouse === "true";
      const children = await familyTreeService.getChildren(fatherId, motherId, withSpouse);

      res.status(200).json({
        success: true,
        data: children,
        count: children.length,
      });
    } catch (error) {
      const isNotFound =
        error instanceof Error && error.message.includes("not found");
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        error: isNotFound ? "Person not found" : "Failed to fetch children",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // GET /api/family-tree/:personId/closest-related-people
  async getClosestRelatedPeople(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const { personId } = req.params;
      const data = await familyTreeService.getClosestRelatedPeople(personId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      const isNotFound =
        error instanceof Error && error.message.includes("not found");
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        error: isNotFound ? "Person not found" : "Failed to fetch closest related people",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // GET /api/family-tree/:personId/parents
  async getParents(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const { personId } = req.params;
      const parents = await familyTreeService.getParents(personId);

      res.status(200).json({
        success: true,
        data: parents,
        count: parents.length,
      });
    } catch (error) {
      const isNotFound =
        error instanceof Error && error.message.includes("not found");
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        error: isNotFound ? "Person not found" : "Failed to fetch parents",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // POST /api/family-tree/add-children
  async addChildren(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const request: AddChildrenRequest = req.body;
      const result = await familyTreeService.addChildren(request);

      res.status(201).json({
        success: true,
        data: result,
        count: result.children.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isNotFound =
        message.includes("not found") || message.includes("Parents not found");
      const isBadRequest =
        message.includes("Duplicate") ||
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

  // GET /api/family-tree/has-child/:personId
  async hasChildren(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const { personId } = req.params;
      const hasChildren = await familyTreeService.hasChildren(personId);

      res.status(200).json({
        success: true,
        data: {
          hasChildren,
        },
      });
    } catch (error) {
      const isNotFound =
        error instanceof Error && error.message.includes("not found");
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        error: isNotFound ? "Person not found" : "Failed to check children",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new FamilyTreeController();
