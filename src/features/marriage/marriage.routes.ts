import { Router } from 'express';
import { requireAccessJwt } from '@/shared/middleware/require-access-jwt.middleware';
import marriageController from './marriage.controller';
import {
  marryValidation,
  marryCreateValidation,
  divorceValidation,
  cancelMarriageValidation,
  cancelDivorceValidation,
  personListValidation,
} from './marriage.validation';

const router = Router();

// POST /api/marriage/marry - Create new marriage
router.post(
  '/marry',
  requireAccessJwt,
  marryCreateValidation,
  marriageController.marryByPersonInput.bind(marriageController)
);

// POST /api/marriage/marry/by-id - Create new marriage by existing person IDs
router.post(
  '/marry/by-id',
  requireAccessJwt,
  marryValidation,
  marriageController.marry.bind(marriageController)
);

// PUT /api/marriage/divorce - End marriage (divorce)
router.put(
  '/divorce',
  requireAccessJwt,
  divorceValidation,
  marriageController.divorce.bind(marriageController)
);

// DELETE /api/marriage/cancel - Cancel marriage (delete)
router.delete(
  '/cancel',
  requireAccessJwt,
  cancelMarriageValidation,
  marriageController.cancelMarriage.bind(marriageController)
);

// PUT /api/marriage/cancel-divorce - Cancel divorce (restore marriage)
router.put(
  '/cancel-divorce',
  requireAccessJwt,
  cancelDivorceValidation,
  marriageController.cancelDivorce.bind(marriageController)
);

// GET /api/marriage/person/list - Get persons by status (married, single, divorced)
router.get(
  '/person/list',
  personListValidation,
  marriageController.getPersonsByStatus.bind(marriageController)
);

export default router;
