import { Router } from "express";
import personController from "./person.controller";
import {
  createPersonValidation,
  updatePersonValidation,
} from "./person.validation";

const router = Router();

// GET /api/persons - Get all persons
router.get("/list", personController.getAllPersons.bind(personController));

// GET /api/persons/count - Get person count
router.get("/count", personController.getPersonCount.bind(personController));

// GET /api/persons/living - Get living persons
router.get("/living/list", personController.getLivingPersons.bind(personController));

// GET /api/persons/deceased - Get deceased persons
router.get(
  "/deceased/list",
  personController.getDeceasedPersons.bind(personController)
);

// GET /api/persons/one - Get person by ID (query param)
router.get("/one", personController.getPersonById.bind(personController));

// POST /api/persons - Create new person
router.post(
  "/one",
  createPersonValidation,
  personController.createPerson.bind(personController)
);

// PUT /api/persons/one - Update person (query param)
router.put(
  "/one",
  updatePersonValidation,
  personController.updatePerson.bind(personController)
);

// DELETE /api/persons/one - Delete person (query param)
router.delete("/one", personController.deletePerson.bind(personController));

export default router;
