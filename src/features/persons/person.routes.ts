import { Router } from "express";
import { requireAccessJwt } from "@/shared/middleware/require-access-jwt.middleware";
import personController from "./person.controller";
import {
  createPersonValidation,
  deletePersonQueryValidation,
  latestPersonsQueryValidation,
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

// GET /api/person/latest/list - Get latest created persons (paginated)
router.get(
  "/latest/list",
  latestPersonsQueryValidation,
  personController.getLatestPersons.bind(personController)
);

// GET /api/person/one - Get person by ID (query param)
router.get("/one", personController.getPersonById.bind(personController));

// POST /api/person - Create new person
router.post(
  "/one",
  requireAccessJwt,
  createPersonValidation,
  personController.createPerson.bind(personController)
);

// PUT /api/person/one - Update person (query param). Body deathDate: null clears DB value.
router.put(
  "/one",
  requireAccessJwt,
  updatePersonValidation,
  personController.updatePerson.bind(personController)
);

// DELETE /api/person/one - Delete person (query param)
router.delete(
  "/one",
  requireAccessJwt,
  deletePersonQueryValidation,
  personController.deletePerson.bind(personController)
);

export default router;
