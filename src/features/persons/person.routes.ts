import { Router } from "express";
import personController from "./person.controller";
import {
  createPersonValidation,
  listPersonsQueryValidation,
  updatePersonValidation,
} from "./person.validation";

const router = Router();

// GET /api/person - Get all person
router.get("/list", listPersonsQueryValidation, personController.getAllPersons.bind(personController));

// GET /api/person/count - Get person count
router.get("/count", personController.getPersonCount.bind(personController));

// GET /api/person/living - Get living person
router.get("/living/list", personController.getLivingPersons.bind(personController));

// GET /api/person/deceased - Get deceased person
router.get(
  "/deceased/list",
  personController.getDeceasedPersons.bind(personController)
);

// GET /api/person/one - Get person by ID (query param)
router.get("/one", personController.getPersonById.bind(personController));

// POST /api/person - Create new person
router.post(
  "/one",
  createPersonValidation,
  personController.createPerson.bind(personController)
);

// PUT /api/person/one - Update person (query param)
router.put(
  "/one",
  updatePersonValidation,
  personController.updatePerson.bind(personController)
);

// DELETE /api/person/one - Delete person (query param)
router.delete("/one", personController.deletePerson.bind(personController));

export default router;
