import { Router } from 'express';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/roleController.js';
import { authenticateJWT, isStaff, isSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Any staff member can read the role list (needed for pickers and badges);
// only super-admins can create, edit or delete roles.
router.get('/', authenticateJWT, isStaff, listRoles);
router.post('/', authenticateJWT, isSuperAdmin, createRole);
router.patch('/:id', authenticateJWT, isSuperAdmin, updateRole);
router.delete('/:id', authenticateJWT, isSuperAdmin, deleteRole);

export default router;
