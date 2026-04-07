import { Request, Response } from "express";
import { validationResult } from "express-validator";
import familyTreeService from "./family-tree.service";

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

  // GET /api/family-tree/:personId/children
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

      const { personId } = req.params;
      const withSpouse = req.query.withSpouse === "true";
      const children = await familyTreeService.getChildren(personId, withSpouse);

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

      const { parentId, children } = req.body;
      const result = await familyTreeService.addChildren(parentId, children);

      res.status(201).json({
        success: true,
        data: result,
        count: result.children.length,
      });
    } catch (error) {
      const isNotFound =
        error instanceof Error && error.message.includes("not found");
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        error: isNotFound ? "Parent not found" : "Failed to add children",
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
