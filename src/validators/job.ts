import { z } from 'zod';
import { JobStatus, JobType, ExperienceLevel } from '../entities/Job';

const jobDataSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
    
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
    
  categoryId: z.string()
    .uuid('Invalid category ID')
    .optional(),
    
  jobType: z.nativeEnum(JobType)
    .default(JobType.FIXED),
    
  budget: z.number()
    .min(5, 'Budget must be at least $5')
    .max(100000, 'Budget must be less than $100,000')
    .optional(),
    
  hourlyRateMin: z.number()
    .min(5, 'Hourly rate minimum must be at least $5')
    .max(1000, 'Hourly rate minimum must be less than $1000')
    .optional(),
    
  hourlyRateMax: z.number()
    .min(5, 'Hourly rate maximum must be at least $5')
    .max(1000, 'Hourly rate maximum must be less than $1000')
    .optional(),
    
  estimatedHours: z.number()
    .min(1, 'Estimated hours must be at least 1')
    .max(2000, 'Estimated hours must be less than 2000')
    .optional(),
    
  duration: z.string()
    .max(100, 'Duration must be less than 100 characters')
    .optional(),
    
  experienceLevel: z.nativeEnum(ExperienceLevel)
    .default(ExperienceLevel.INTERMEDIATE),
    
  skillsRequired: z.array(z.string())
    .max(10, 'Maximum 10 skills allowed')
    .optional(),
    
  deadline: z.string()
    .datetime('Invalid deadline format')
    .refine(date => new Date(date) > new Date(), 'Deadline must be in the future')
    .optional(),
    
  requirements: z.string()
    .max(1000, 'Requirements must be less than 1000 characters')
    .optional()
}).strict()
.refine(data => {
  // If jobType is FIXED, budget is required
  if (data.jobType === JobType.FIXED && !data.budget) {
    return false;
  }
  // If jobType is HOURLY, hourlyRateMin and hourlyRateMax should be provided
  if (data.jobType === JobType.HOURLY && (!data.hourlyRateMin || !data.hourlyRateMax)) {
    return false;
  }
  // Ensure hourlyRateMax >= hourlyRateMin if both provided
  if (data.hourlyRateMin && data.hourlyRateMax && data.hourlyRateMax < data.hourlyRateMin) {
    return false;
  }
  return true;
}, {
  message: "Invalid job configuration: Fixed jobs require budget, Hourly jobs require rate range, Max rate must be >= Min rate"
});

export const createJobSchema = z.object({
  userid: z.string()
    .uuid('Invalid user ID'),
  newjob: jobDataSchema
}).strict();

export const updateJobSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
    
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
    
  categoryId: z.string()
    .uuid('Invalid category ID')
    .optional(),
    
  jobType: z.nativeEnum(JobType)
    .optional(),
    
  budget: z.number()
    .min(5, 'Budget must be at least $5')
    .max(100000, 'Budget must be less than $100,000')
    .optional(),
    
  hourlyRateMin: z.number()
    .min(5, 'Hourly rate minimum must be at least $5')
    .max(1000, 'Hourly rate minimum must be less than $1000')
    .optional(),
    
  hourlyRateMax: z.number()
    .min(5, 'Hourly rate maximum must be at least $5')
    .max(1000, 'Hourly rate maximum must be less than $1000')
    .optional(),
    
  estimatedHours: z.number()
    .min(1, 'Estimated hours must be at least 1')
    .max(2000, 'Estimated hours must be less than 2000')
    .optional(),
    
  duration: z.string()
    .max(100, 'Duration must be less than 100 characters')
    .optional(),
    
  experienceLevel: z.nativeEnum(ExperienceLevel)
    .optional(),
    
  skillsRequired: z.array(z.string())
    .max(10, 'Maximum 10 skills allowed')
    .optional(),
    
  deadline: z.string()
    .datetime('Invalid deadline format')
    .refine(date => new Date(date) > new Date(), 'Deadline must be in the future')
    .optional(),
    
  requirements: z.string()
    .max(1000, 'Requirements must be less than 1000 characters')
    .optional(),
    
  status: z.nativeEnum(JobStatus)
    .optional()
}).strict();