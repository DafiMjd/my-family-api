import { Request, Response } from "express";
import familyService from "./family.service";
import {
  CreateFamilyRequestById,
  UpdateFamilyChildrenRequest,
  UpdateFamilyFatherRequest,
  UpdateFamilyMotherRequest,
  DeleteFamilyRequest,
  GetFamiliesQuery,
  CreateFamilyRequest,
} from "@/shared/types/family.types";
import { validationResult } from "express-validator";

class FamilyController {
  async createFamily(req: Request, res: Response): Promise<void> {
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

      const familyData: CreateFamilyRequest = req.body;

      const family = await familyService.createFamily(familyData);
      res.status(201).json({
        success: true,
        data: family,
        message: "Family created successfully",
      });
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }
  async createFamilyById(req: Request, res: Response): Promise<void> {
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

      const familyData: CreateFamilyRequestById = req.body;

      // Validate that father and mother are different
      if (familyData.fatherId === familyData.motherId) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: "Father and mother must be different persons",
        });
        return;
      }

      const family = await familyService.createFamilyById(familyData);
      res.status(201).json({
        success: true,
        data: family,
        message: "Family created successfully",
      });
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async getFamilyById(req: Request, res: Response): Promise<void> {
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

      const family = await familyService.getFamilyById(id);

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
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async getFamilies(req: Request, res: Response): Promise<void> {
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

      const filters: GetFamiliesQuery = {
        fatherId: req.query.fatherId as string | undefined,
        motherId: req.query.motherId as string | undefined,
        childrenId: req.query.childrenId as string | undefined,
      };

      const families = await familyService.getFamilies(filters);

      res.status(200).json({
        success: true,
        data: families,
        count: families.length,
      });
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async updateFamilyChildren(req: Request, res: Response): Promise<void> {
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

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const updateData: UpdateFamilyChildrenRequest = req.body;

      const family = await familyService.updateFamilyChildren(id, updateData);

      res.status(200).json({
        success: true,
        data: family,
        message: "Family children updated successfully",
      });
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async updateFamilyFather(req: Request, res: Response): Promise<void> {
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

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const updateData: UpdateFamilyFatherRequest = req.body;

      const family = await familyService.updateFamilyFather(id, updateData);

      res.status(200).json({
        success: true,
        data: family,
        message: "Family father updated successfully",
      });
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async updateFamilyMother(req: Request, res: Response): Promise<void> {
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

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.array(),
        });
        return;
      }

      const updateData: UpdateFamilyMotherRequest = req.body;

      const family = await familyService.updateFamilyMother(id, updateData);

      res.status(200).json({
        success: true,
        data: family,
        message: "Family mother updated successfully",
      });
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async deleteFamily(req: Request, res: Response): Promise<void> {
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

      const deleteOptions: DeleteFamilyRequest = {
        deleteSpouseRelationship: true,
      };

      const deleted = await familyService.deleteFamily(id, deleteOptions);

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
    } catch (error) {
      const errorResponse = this.handleError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  private handleError(error: unknown): {
    statusCode: number;
    response: { success: false; error: string; message: string };
  } {
    if (error instanceof Error) {
      const message = error.message;

      // Handle not found errors
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

      // Handle conflict errors (already married, gender validation, etc.)
      if (
        message.includes("must be male") ||
        message.includes("must be female") ||
        message.includes("already married") ||
        message.includes("must have") ||
        message.includes("must be different")
      ) {
        return {
          statusCode: 409,
          response: {
            success: false,
            error: "CONFLICT",
            message,
          },
        };
      }

      // Handle validation errors
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

    // Default error response
    return {
      statusCode: 500,
      response: {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

export default new FamilyController();
