import { Request, Response } from "express";
import marriageService from "./marriage.service";
import {
  MarriageRequest,
  DivorceRequest,
  CancelMarriageRequest,
  CancelDivorceRequest,
  MarriageErrorResponse,
} from "@/shared/types/marriage.types";
import { validationResult } from "express-validator";

class MarriageController {
  async marry(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: errors.mapped(),
        });
        return;
      }

      const marriageData: MarriageRequest = req.body;

      // Additional validation: ensure personId1 and personId2 are different
      if (marriageData.personId1 === marriageData.personId2) {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: "Cannot marry a person to themselves",
        });
        return;
      }

      const result = await marriageService.marry(marriageData);
      res.status(201).json(result);
    } catch (error) {
      const errorResponse = this.handleMarriageError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async divorce(req: Request, res: Response): Promise<void> {
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

      const { personId } = req.body;
      const { endDate } = req.body;

      const divorceData: DivorceRequest = { personId, endDate };
      const result = await marriageService.divorce(divorceData);
      res.status(200).json(result);
    } catch (error) {
      const errorResponse = this.handleMarriageError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async cancelMarriage(req: Request, res: Response): Promise<void> {
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

      const { personId } = req.body;

      const cancelData: CancelMarriageRequest = { personId };
      const result = await marriageService.cancelMarriage(cancelData);
      res.status(200).json(result);
    } catch (error) {
      const errorResponse = this.handleMarriageError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async cancelDivorce(req: Request, res: Response): Promise<void> {
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

      const { personId } = req.body;

      const cancelData: CancelDivorceRequest = { personId };
      const result = await marriageService.cancelDivorce(cancelData);
      res.status(200).json(result);
    } catch (error) {
      const errorResponse = this.handleMarriageError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  async getPersonsByStatus(req: Request, res: Response): Promise<void> {
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

      const { status, gender } = req.query;

      if (!status || typeof status !== "string") {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: "status query parameter is required",
        });
        return;
      }

      const genderFilter =
        gender && typeof gender === "string" ? gender : undefined;
      const result = await marriageService.getPersonsByStatus(
        status,
        genderFilter
      );
      res.status(200).json(result);
    } catch (error) {
      const errorResponse = this.handleMarriageError(error);
      res.status(errorResponse.statusCode).json(errorResponse.response);
    }
  }

  private handleMarriageError(error: unknown): {
    statusCode: number;
    response: MarriageErrorResponse;
  } {
    if (error instanceof Error) {
      const message = error.message;

      // Handle specific error cases
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

      if (
        message.includes("already married") ||
        message.includes("different genders") ||
        message.includes("no marriage") ||
        message.includes("not currently married") ||
        message.includes("not currently divorced")
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

      if (
        message.includes("Cannot marry") ||
        message.includes("personId") ||
        message.includes("required")
      ) {
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

export default new MarriageController();
