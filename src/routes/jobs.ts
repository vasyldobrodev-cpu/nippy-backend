import { Router } from 'express';
import { JobController } from '../controllers/JobController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createJobSchema, updateJobSchema } from '../validators/job';

const router = Router();
const jobController = new JobController();

router.use(authenticate); // This check all headers for authentication.

// Specific routes MUST come before parameterized routes
router.get('/drafts', 
  jobController.getDraftJobs
);                                                   // Get user's draft jobs

router.post('/draft', 
  jobController.createDraft
);                                                   // Create draft job (clients only)

// Client-specific routes
router.get('/client/my-jobs', 
  jobController.getMyJobs
);     // Get client's jobs

router.get('/client/stats', 
  jobController.getMyJobStats
);   // Get client's job statistics

// General routes
router.get('/', jobController.getAllJobs);          // Get all jobs with filters

// Parameterized routes MUST come after specific routes
router.get('/:id', jobController.getJobById);       // Get job by ID

// Protected routes - apply authentication per route
router.post('/', 
  validateRequest(createJobSchema), 
  jobController.createJob
);                                                   // Create new job (clients only)

router.put('/:id', 
  validateRequest(updateJobSchema), 
  jobController.updateJob
);                                                   // Update job (owner only)

router.delete('/:id', 
  jobController.deleteJob
);     // Delete/Cancel job (owner only)

export default router;