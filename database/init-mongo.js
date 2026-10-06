// =============================================================================
// MongoDB Initialization Script for Job Application Tracker
// Executed automatically by official MongoDB container on first initialization
// when mounted into /docker-entrypoint-initdb.d/init-mongo.js
// =============================================================================

// Switch to job_tracker database
const jobDb = db.getSiblingDB('job_tracker');

// Create applications collection
jobDb.createCollection('applications');

// Ensure indexes for fast search, status filtering, and chronological sorting
jobDb.applications.createIndex({ company: 1 }, { name: 'idx_applications_company' });
jobDb.applications.createIndex({ status: 1 }, { name: 'idx_applications_status' });
jobDb.applications.createIndex({ appliedDate: -1 }, { name: 'idx_applications_appliedDate' });
jobDb.applications.createIndex({ createdAt: -1 }, { name: 'idx_applications_createdAt' });

// Insert initial seed applications
jobDb.applications.insertMany([
  {
    company: 'Google',
    position: 'Cloud Infrastructure Engineer',
    status: 'Interviewing',
    location: 'Mountain View, CA (Hybrid)',
    salary: '$165,000 - $190,000',
    appliedDate: '2026-09-28',
    jobUrl: 'https://careers.google.com/jobs/results/cloud-engineer',
    notes: 'Technical screen passed. System design and containerization round scheduled for next Thursday.',
    createdAt: new Date('2026-09-28T09:00:00Z'),
    updatedAt: new Date('2026-10-02T14:30:00Z')
  },
  {
    company: 'Stripe',
    position: 'Full Stack Software Engineer',
    status: 'Offered',
    location: 'Remote (US/Canada)',
    salary: '$180,000',
    appliedDate: '2026-09-15',
    jobUrl: 'https://stripe.com/jobs/full-stack-engineer',
    notes: 'Written offer received! Competitive equity package, reviewing details by Friday.',
    createdAt: new Date('2026-09-15T11:00:00Z'),
    updatedAt: new Date('2026-10-04T16:00:00Z')
  },
  {
    company: 'Docker Inc.',
    position: 'DevOps & Platform Engineer',
    status: 'Applied',
    location: 'Remote',
    salary: '$150,000 - $175,000',
    appliedDate: '2026-10-01',
    jobUrl: 'https://www.docker.com/careers',
    notes: 'Applied through team referral from Alex. Highlighted Docker Compose and multi-container experience in cover letter.',
    createdAt: new Date('2026-10-01T10:30:00Z'),
    updatedAt: new Date('2026-10-01T10:30:00Z')
  },
  {
    company: 'Datadog',
    position: 'Site Reliability Engineer',
    status: 'Interviewing',
    location: 'New York, NY (Hybrid)',
    salary: '$160,000 - $185,000',
    appliedDate: '2026-09-22',
    jobUrl: 'https://careers.datadoghq.com/detail/sre',
    notes: 'Completed recruiter chat and online coding challenge. Preparing for take-home architecture review.',
    createdAt: new Date('2026-09-22T13:45:00Z'),
    updatedAt: new Date('2026-09-29T11:15:00Z')
  },
  {
    company: 'Netflix',
    position: 'Senior Backend Engineer',
    status: 'Rejected',
    location: 'Los Gatos, CA',
    salary: '$220,000',
    appliedDate: '2026-09-10',
    jobUrl: 'https://jobs.netflix.com',
    notes: 'Position closed internally. Recruiter encouraged reapplying next quarter for platform team.',
    createdAt: new Date('2026-09-10T08:20:00Z'),
    updatedAt: new Date('2026-09-25T15:00:00Z')
  },
  {
    company: 'GitHub',
    position: 'Developer Experience Engineer',
    status: 'Applied',
    location: 'Remote',
    salary: '$155,000 - $170,000',
    appliedDate: '2026-10-03',
    jobUrl: 'https://github.com/about/careers',
    notes: 'Application submitted via career site with portfolio link.',
    createdAt: new Date('2026-10-03T15:00:00Z'),
    updatedAt: new Date('2026-10-03T15:00:00Z')
  }
]);

print('[MongoDB Init] Database job_tracker initialized with applications collection, indexes, and seed records.');
