import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller.js';
import { authenticateJWT, authorizeRBAC, validateRequest } from '../middlewares/index.js';
import { createProjectSchema, updateProjectSchema, assignMemberSchema, paginationQuerySchema } from '../validations/index.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', validateRequest(createProjectSchema), authorizeRBAC, ProjectController.createProject);
router.get('/', validateRequest(paginationQuerySchema), authorizeRBAC, ProjectController.listProjects);

router.get('/:id', authorizeRBAC, ProjectController.getProject);
router.patch('/:id', validateRequest(updateProjectSchema), authorizeRBAC, ProjectController.updateProject);
router.delete('/:id', authorizeRBAC, ProjectController.deleteProject);

router.post('/:id/members', validateRequest(assignMemberSchema), authorizeRBAC, ProjectController.assignMember);
router.delete('/:id/members/:userId', authorizeRBAC, ProjectController.removeMember);

export default router;
