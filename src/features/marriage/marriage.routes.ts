import { Router } from 'express';
import marriageController from './marriage.controller';
import {
  marryValidation,
  divorceValidation,
  cancelMarriageValidation,
  cancelDivorceValidation,
  personListValidation,
} from './marriage.validation';

const router = Router();

// POST /api/marriage/marry - Create new marriage
router.post(
  '/marry',
  marryValidation,
  marriageController.marry.bind(marriageController)
);

// PUT /api/marriage/divorce - End marriage (divorce)
router.put(
  '/divorce',
  divorceValidation,
  marriageController.divorce.bind(marriageController)
);

// DELETE /api/marriage/cancel - Cancel marriage (delete)
router.delete(
  '/cancel',
  cancelMarriageValidation,
  marriageController.cancelMarriage.bind(marriageController)
);

// PUT /api/marriage/cancel-divorce - Cancel divorce (restore marriage)
router.put(
  '/cancel-divorce',
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
