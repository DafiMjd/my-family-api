import { Request, Response } from "express";
import personService from "./person.service";
import {
  CreatePersonRequest,
  PersonResponse,
  UpdatePersonRequest,
} from "@/shared/types/person.types";
import { validationResult } from "express-validator";

class PersonController {
  async getAllPersons(req: Request, res: Response): Promise<void> {
    try {
      const { gender } = req.query;

      let persons: PersonResponse[] = [];

      if (gender && typeof gender === "string") {
        persons = await personService.getPersonsByGender(gender);
      } else {
        persons = await personService.getAllPersons();
      }

      res.status(200).json({
        success: true,
        data: persons,
        count: persons.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch persons",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getPersonById(req: Request, res: Response): Promise<void> {
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

      const person = await personService.getPersonById(id);

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
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch person",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createPerson(req: Request, res: Response): Promise<void> {
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

      const personData: CreatePersonRequest = req.body;
      const person = await personService.createPerson(personData);
      res.status(201).json({
        success: true,
        data: person,
        message: "Person created successfully",
      });
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("already exists")
          ? 409
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to create person",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updatePerson(req: Request, res: Response): Promise<void> {
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

      const personData: UpdatePersonRequest = req.body;

      const person = await personService.updatePerson(id, personData);

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
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes("already exists")
          ? 409
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to update person",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deletePerson(req: Request, res: Response): Promise<void> {
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

      const deleted = await personService.deletePerson(id);

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
    } catch (error) {
      error;
      res.status(500).json({
        success: false,
        error: "Failed to delete person",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getLivingPersons(req: Request, res: Response): Promise<void> {
    try {
      const persons = await personService.getLivingPersons();

      res.status(200).json({
        success: true,
        data: persons,
        count: persons.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch living persons",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getDeceasedPersons(req: Request, res: Response): Promise<void> {
    try {
      const persons = await personService.getDeceasedPersons();

      res.status(200).json({
        success: true,
        data: persons,
        count: persons.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch deceased persons",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getPersonCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await personService.getPersonCount();

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch person count",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new PersonController();
