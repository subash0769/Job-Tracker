const VALID_STATUSES = ['Applied', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn'];

/**
 * Validates and sanitizes job application payload
 * @param {Object} data - Raw request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
function validateApplicationInput(data = {}) {
  const errors = [];
  const sanitized = {};

  // Company: Required, string, 1-100 chars
  if (data.company === undefined || data.company === null || String(data.company).trim() === '') {
    errors.push('Company name is required');
  } else {
    const company = String(data.company).trim();
    if (company.length < 1 || company.length > 100) {
      errors.push('Company name must be between 1 and 100 characters');
    } else {
      sanitized.company = company;
    }
  }

  // Position: Required, string, 1-100 chars
  if (data.position === undefined || data.position === null || String(data.position).trim() === '') {
    errors.push('Position/Title is required');
  } else {
    const position = String(data.position).trim();
    if (position.length < 1 || position.length > 100) {
      errors.push('Position/Title must be between 1 and 100 characters');
    } else {
      sanitized.position = position;
    }
  }

  // Status: Optional, defaults to 'Applied', must be in VALID_STATUSES
  if (data.status !== undefined && data.status !== null && String(data.status).trim() !== '') {
    const status = String(data.status).trim();
    if (!VALID_STATUSES.includes(status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    } else {
      sanitized.status = status;
    }
  } else {
    sanitized.status = 'Applied';
  }

  // Location: Optional, max 100 chars
  if (data.location !== undefined && data.location !== null) {
    const location = String(data.location).trim();
    if (location.length > 100) {
      errors.push('Location cannot exceed 100 characters');
    } else {
      sanitized.location = location || null;
    }
  } else {
    sanitized.location = null;
  }

  // Salary: Optional, max 60 chars
  if (data.salary !== undefined && data.salary !== null) {
    const salary = String(data.salary).trim();
    if (salary.length > 60) {
      errors.push('Salary cannot exceed 60 characters');
    } else {
      sanitized.salary = salary || null;
    }
  } else {
    sanitized.salary = null;
  }

  // Applied Date: Optional string (YYYY-MM-DD), default to today
  if (data.appliedDate !== undefined && data.appliedDate !== null && String(data.appliedDate).trim() !== '') {
    const dateStr = String(data.appliedDate).trim();
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      errors.push('Applied date must be a valid date (YYYY-MM-DD)');
    } else {
      // Normalize to YYYY-MM-DD
      sanitized.appliedDate = dateStr.slice(0, 10);
    }
  } else {
    const today = new Date().toISOString().slice(0, 10);
    sanitized.appliedDate = today;
  }

  // Job URL: Optional, max 300 chars, basic URL check
  if (data.jobUrl !== undefined && data.jobUrl !== null && String(data.jobUrl).trim() !== '') {
    const url = String(data.jobUrl).trim();
    if (url.length > 300) {
      errors.push('Job URL cannot exceed 300 characters');
    } else if (!/^https?:\/\/.+/i.test(url)) {
      errors.push('Job URL must be a valid HTTP or HTTPS link (e.g. https://...)');
    } else {
      sanitized.jobUrl = url;
    }
  } else {
    sanitized.jobUrl = null;
  }

  // Notes: Optional, max 1000 chars
  if (data.notes !== undefined && data.notes !== null) {
    const notes = String(data.notes).trim();
    if (notes.length > 1000) {
      errors.push('Notes cannot exceed 1000 characters');
    } else {
      sanitized.notes = notes || null;
    }
  } else {
    sanitized.notes = null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

module.exports = {
  VALID_STATUSES,
  validateApplicationInput,
};
