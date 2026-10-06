/**
 * Job Application Tracker - Vanilla JavaScript Application
 * Interacts with Node.js + Express + MongoDB REST API
 */

(function () {
  'use strict';

  // Base API path
  const API_BASE = (window.API_URL || '').replace(/\/+$/, '') + '/api';

  // Application State
  const state = {
    applications: [],
    stats: { total: 0, applied: 0, interviewing: 0, offered: 0, rejected: 0, withdrawn: 0 },
    searchTerm: '',
    statusFilter: 'All',
    sortBy: 'newest',
    editingApplication: null,
    deletingApplication: null,
    isLoading: true,
  };

  // DOM Elements
  const elements = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    headerStatus: document.getElementById('headerStatus'),

    // Stats
    statTotal: document.getElementById('statTotal'),
    statApplied: document.getElementById('statApplied'),
    statInterviewing: document.getElementById('statInterviewing'),
    statOffered: document.getElementById('statOffered'),
    statRejected: document.getElementById('statRejected'),
    statCards: document.querySelectorAll('.stat-card'),

    // Create Form
    createForm: document.getElementById('createApplicationForm'),
    createCompany: document.getElementById('createCompany'),
    createPosition: document.getElementById('createPosition'),
    createStatus: document.getElementById('createStatus'),
    createAppliedDate: document.getElementById('createAppliedDate'),
    createLocation: document.getElementById('createLocation'),
    createSalary: document.getElementById('createSalary'),
    createJobUrl: document.getElementById('createJobUrl'),
    createNotes: document.getElementById('createNotes'),
    createCompanyError: document.getElementById('createCompanyError'),
    createPositionError: document.getElementById('createPositionError'),
    createAppliedDateError: document.getElementById('createAppliedDateError'),
    createJobUrlError: document.getElementById('createJobUrlError'),
    createNotesError: document.getElementById('createNotesError'),
    createSubmitBtn: document.getElementById('createSubmitBtn'),
    createResetBtn: document.getElementById('createResetBtn'),

    // Toolbar & Filter
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    statusFilter: document.getElementById('statusFilter'),
    sortBy: document.getElementById('sortBy'),
    countBadge: document.getElementById('countBadge'),

    // Views
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    emptyTitle: document.getElementById('emptyTitle'),
    emptyDesc: document.getElementById('emptyDesc'),
    tableView: document.getElementById('tableView'),
    applicationsTableBody: document.getElementById('applicationsTableBody'),
    cardsView: document.getElementById('cardsView'),

    // Edit Modal
    editModal: document.getElementById('editModal'),
    editApplicationForm: document.getElementById('editApplicationForm'),
    editApplicationId: document.getElementById('editApplicationId'),
    editCompany: document.getElementById('editCompany'),
    editPosition: document.getElementById('editPosition'),
    editStatus: document.getElementById('editStatus'),
    editAppliedDate: document.getElementById('editAppliedDate'),
    editLocation: document.getElementById('editLocation'),
    editSalary: document.getElementById('editSalary'),
    editJobUrl: document.getElementById('editJobUrl'),
    editNotes: document.getElementById('editNotes'),
    editCompanyError: document.getElementById('editCompanyError'),
    editPositionError: document.getElementById('editPositionError'),
    editAppliedDateError: document.getElementById('editAppliedDateError'),
    editJobUrlError: document.getElementById('editJobUrlError'),
    editNotesError: document.getElementById('editNotesError'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteApplicationCompany: document.getElementById('deleteApplicationCompany'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),
  };

  // ==========================================================================
  // Helper: Format Date
  // ==========================================================================
  function getTodayString() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      // Avoid timezone shift by splitting YYYY-MM-DD
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // Toast Notifications
  // ==========================================================================
  function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const msgSpan = document.createElement('div');
    msgSpan.className = 'toast-message';
    msgSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';

    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);
    elements.toastContainer.appendChild(toast);

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.2s ease-in';
      setTimeout(() => toast.remove(), 200);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }

  // ==========================================================================
  // Health & MongoDB Connectivity Check
  // ==========================================================================
  async function checkHealth() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const data = await response.json();
        if (data.database === 'connected') {
          elements.statusDot.className = 'status-indicator connected';
          elements.statusText.textContent = 'MongoDB Connected';
          elements.headerStatus.title = `Service OK (${new Date().toLocaleTimeString()})`;
          return true;
        }
      }
      throw new Error('Database ping check unsuccessful');
    } catch (err) {
      elements.statusDot.className = 'status-indicator error';
      elements.statusText.textContent = 'DB Disconnected';
      elements.headerStatus.title = `Error: ${err.message}`;
      return false;
    }
  }

  // ==========================================================================
  // Fetch Applications & Stats from API
  // ==========================================================================
  async function loadData() {
    try {
      const params = new URLSearchParams();
      if (state.searchTerm) params.append('search', state.searchTerm);
      if (state.statusFilter && state.statusFilter !== 'All') params.append('status', state.statusFilter);
      if (state.sortBy) params.append('sort', state.sortBy);

      const [appsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/applications?${params.toString()}`),
        fetch(`${API_BASE}/applications/stats`),
      ]);

      if (!appsRes.ok) {
        throw new Error(`Failed to load applications (HTTP ${appsRes.status})`);
      }

      state.applications = await appsRes.json();

      if (statsRes.ok) {
        state.stats = await statsRes.json();
      }

      state.isLoading = false;
      renderAll();
    } catch (err) {
      console.error('Error fetching data:', err);
      state.isLoading = false;
      elements.loadingState.style.display = 'none';
      elements.emptyState.style.display = 'block';
      elements.emptyTitle.textContent = 'Connection Error';
      elements.emptyDesc.textContent =
        'Could not connect to the backend server or MongoDB database. Ensure your containers or local services are running.';
      showToast('Error connecting to backend API', 'error');
    }
  }

  // ==========================================================================
  // Render Stats & Badges
  // ==========================================================================
  function renderStats() {
    elements.statTotal.textContent = state.stats.total || 0;
    elements.statApplied.textContent = state.stats.applied || 0;
    elements.statInterviewing.textContent = state.stats.interviewing || 0;
    elements.statOffered.textContent = state.stats.offered || 0;
    elements.statRejected.textContent = (state.stats.rejected || 0) + (state.stats.withdrawn || 0);

    const count = state.applications.length;
    elements.countBadge.textContent = `${count} ${count === 1 ? 'application' : 'applications'}`;
  }

  // ==========================================================================
  // Render Applications Table and Cards
  // ==========================================================================
  function getStatusBadgeClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'applied':
        return 'badge-applied';
      case 'interviewing':
        return 'badge-interviewing';
      case 'offered':
        return 'badge-offered';
      case 'rejected':
        return 'badge-rejected';
      case 'withdrawn':
        return 'badge-withdrawn';
      default:
        return 'badge-applied';
    }
  }

  function renderTable(items) {
    elements.applicationsTableBody.innerHTML = '';

    items.forEach((item) => {
      const tr = document.createElement('tr');

      const urlLink = item.jobUrl
        ? `<a href="${escapeHtml(item.jobUrl)}" target="_blank" rel="noopener noreferrer" title="View job posting" aria-label="Open job posting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>`
        : '';

      const locationText = item.location ? `<div class="role-location">${escapeHtml(item.location)}</div>` : '';
      const notesPreview = item.notes ? `<div class="notes-preview" title="${escapeHtml(item.notes)}">${escapeHtml(item.notes)}</div>` : '';

      tr.innerHTML = `
        <td>
          <div class="company-cell">
            <span>${escapeHtml(item.company)}</span>
            ${urlLink}
          </div>
        </td>
        <td>
          <div class="role-title">${escapeHtml(item.position)}</div>
          ${locationText}
          ${notesPreview}
        </td>
        <td>
          <span class="badge ${getStatusBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
        </td>
        <td>
          <span style="color: var(--text-muted); font-size: 0.8125rem;">${formatDate(item.appliedDate)}</span>
        </td>
        <td>
          <span class="salary-text">${escapeHtml(item.salary || '—')}</span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-icon primary edit-btn" data-id="${item.id}" title="Edit application" aria-label="Edit application">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button type="button" class="btn-icon danger delete-btn" data-id="${item.id}" title="Delete application" aria-label="Delete application">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;

      elements.applicationsTableBody.appendChild(tr);
    });
  }

  function renderCards(items) {
    elements.cardsView.innerHTML = '';

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'app-card-item';

      const urlLink = item.jobUrl
        ? `<a href="${escapeHtml(item.jobUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); font-size: 0.8125rem;">View Posting ↗</a>`
        : '';

      const notesHtml = item.notes
        ? `<div class="app-card-notes">${escapeHtml(item.notes)}</div>`
        : '';

      card.innerHTML = `
        <div class="app-card-header">
          <div>
            <h3 class="app-card-company">${escapeHtml(item.company)}</h3>
            <div class="app-card-role">${escapeHtml(item.position)}</div>
          </div>
          <span class="badge ${getStatusBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <div class="app-card-meta">
          ${item.location ? `<span>📍 ${escapeHtml(item.location)}</span>` : ''}
          ${item.salary ? `<span>💰 ${escapeHtml(item.salary)}</span>` : ''}
          <span>📅 Applied: ${formatDate(item.appliedDate)}</span>
          ${urlLink}
        </div>
        ${notesHtml}
        <div class="app-card-actions">
          <button type="button" class="btn btn-secondary edit-btn" data-id="${item.id}" style="padding: 0.4rem 0.75rem; font-size: 0.8125rem;">
            Edit
          </button>
          <button type="button" class="btn btn-danger delete-btn" data-id="${item.id}" style="padding: 0.4rem 0.75rem; font-size: 0.8125rem;">
            Delete
          </button>
        </div>
      `;

      elements.cardsView.appendChild(card);
    });
  }

  function renderAll() {
    renderStats();

    if (state.isLoading) {
      elements.loadingState.style.display = 'block';
      elements.emptyState.style.display = 'none';
      elements.tableView.style.display = 'none';
      elements.cardsView.style.display = 'none';
      return;
    }

    elements.loadingState.style.display = 'none';

    if (state.applications.length === 0) {
      elements.emptyState.style.display = 'block';
      elements.tableView.style.display = 'none';
      elements.cardsView.style.display = 'none';

      if (state.searchTerm || (state.statusFilter && state.statusFilter !== 'All')) {
        elements.emptyTitle.textContent = 'No matching applications';
        elements.emptyDesc.textContent = 'Try adjusting your search query or status filter to see more results.';
      } else {
        elements.emptyTitle.textContent = 'No applications yet';
        elements.emptyDesc.textContent = 'Your tracker is empty. Fill out the form on the left to track your first job application!';
      }
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.tableView.style.display = 'block';
    elements.cardsView.style.display = 'flex';

    renderTable(state.applications);
    renderCards(state.applications);
  }

  // ==========================================================================
  // Form Validation & Submission (Create Application)
  // ==========================================================================
  function resetCreateFormErrors() {
    elements.createCompanyError.style.display = 'none';
    elements.createPositionError.style.display = 'none';
    elements.createAppliedDateError.style.display = 'none';
    elements.createJobUrlError.style.display = 'none';
    elements.createNotesError.style.display = 'none';
  }

  function validateCreateForm() {
    resetCreateFormErrors();
    let isValid = true;

    const company = elements.createCompany.value.trim();
    if (!company) {
      elements.createCompanyError.textContent = 'Company name is required';
      elements.createCompanyError.style.display = 'block';
      isValid = false;
    } else if (company.length > 100) {
      elements.createCompanyError.textContent = 'Company name cannot exceed 100 characters';
      elements.createCompanyError.style.display = 'block';
      isValid = false;
    }

    const position = elements.createPosition.value.trim();
    if (!position) {
      elements.createPositionError.textContent = 'Position/Role is required';
      elements.createPositionError.style.display = 'block';
      isValid = false;
    } else if (position.length > 100) {
      elements.createPositionError.textContent = 'Position cannot exceed 100 characters';
      elements.createPositionError.style.display = 'block';
      isValid = false;
    }

    const jobUrl = elements.createJobUrl.value.trim();
    if (jobUrl && !/^https?:\/\/.+/i.test(jobUrl)) {
      elements.createJobUrlError.textContent = 'Please enter a valid URL starting with http:// or https://';
      elements.createJobUrlError.style.display = 'block';
      isValid = false;
    }

    return isValid;
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!validateCreateForm()) return;

    elements.createSubmitBtn.disabled = true;
    elements.createSubmitBtn.textContent = 'Saving...';

    const payload = {
      company: elements.createCompany.value.trim(),
      position: elements.createPosition.value.trim(),
      status: elements.createStatus.value,
      appliedDate: elements.createAppliedDate.value || getTodayString(),
      location: elements.createLocation.value.trim() || null,
      salary: elements.createSalary.value.trim() || null,
      jobUrl: elements.createJobUrl.value.trim() || null,
      notes: elements.createNotes.value.trim() || null,
    };

    try {
      const response = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create application');
      }

      const created = await response.json();
      showToast(`Tracked application for ${created.company}!`, 'success');
      elements.createForm.reset();
      elements.createAppliedDate.value = getTodayString();
      await loadData();
    } catch (err) {
      console.error('Create application error:', err);
      showToast(err.message, 'error');
    } finally {
      elements.createSubmitBtn.disabled = false;
      elements.createSubmitBtn.textContent = 'Save Application';
    }
  }

  // ==========================================================================
  // Edit Application Modal Handlers
  // ==========================================================================
  function openEditModal(appId) {
    const item = state.applications.find((a) => a.id === appId);
    if (!item) return;

    state.editingApplication = item;
    elements.editApplicationId.value = item.id;
    elements.editCompany.value = item.company;
    elements.editPosition.value = item.position;
    elements.editStatus.value = item.status;
    elements.editAppliedDate.value = item.appliedDate ? item.appliedDate.slice(0, 10) : '';
    elements.editLocation.value = item.location || '';
    elements.editSalary.value = item.salary || '';
    elements.editJobUrl.value = item.jobUrl || '';
    elements.editNotes.value = item.notes || '';

    // Clear errors
    elements.editCompanyError.style.display = 'none';
    elements.editPositionError.style.display = 'none';
    elements.editJobUrlError.style.display = 'none';

    elements.editModal.style.display = 'flex';
    elements.editCompany.focus();
  }

  function closeEditModal() {
    elements.editModal.style.display = 'none';
    state.editingApplication = null;
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!state.editingApplication) return;

    const company = elements.editCompany.value.trim();
    const position = elements.editPosition.value.trim();
    const jobUrl = elements.editJobUrl.value.trim();

    if (!company) {
      elements.editCompanyError.textContent = 'Company name is required';
      elements.editCompanyError.style.display = 'block';
      return;
    }
    if (!position) {
      elements.editPositionError.textContent = 'Position/Role is required';
      elements.editPositionError.style.display = 'block';
      return;
    }
    if (jobUrl && !/^https?:\/\/.+/i.test(jobUrl)) {
      elements.editJobUrlError.textContent = 'Please enter a valid URL starting with http:// or https://';
      elements.editJobUrlError.style.display = 'block';
      return;
    }

    elements.saveEditBtn.disabled = true;
    elements.saveEditBtn.textContent = 'Updating...';

    const payload = {
      company,
      position,
      status: elements.editStatus.value,
      appliedDate: elements.editAppliedDate.value || getTodayString(),
      location: elements.editLocation.value.trim() || null,
      salary: elements.editSalary.value.trim() || null,
      jobUrl: jobUrl || null,
      notes: elements.editNotes.value.trim() || null,
    };

    try {
      const response = await fetch(`${API_BASE}/applications/${state.editingApplication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update application');
      }

      showToast(`Updated application for ${payload.company}`, 'success');
      closeEditModal();
      await loadData();
    } catch (err) {
      console.error('Update error:', err);
      showToast(err.message, 'error');
    } finally {
      elements.saveEditBtn.disabled = false;
      elements.saveEditBtn.textContent = 'Update Application';
    }
  }

  // ==========================================================================
  // Delete Application Modal Handlers
  // ==========================================================================
  function openDeleteModal(appId) {
    const item = state.applications.find((a) => a.id === appId);
    if (!item) return;

    state.deletingApplication = item;
    elements.deleteApplicationCompany.textContent = `${item.company} (${item.position})`;
    elements.deleteModal.style.display = 'flex';
    elements.confirmDeleteBtn.focus();
  }

  function closeDeleteModal() {
    elements.deleteModal.style.display = 'none';
    state.deletingApplication = null;
  }

  async function handleConfirmDelete() {
    if (!state.deletingApplication) return;

    elements.confirmDeleteBtn.disabled = true;
    elements.confirmDeleteBtn.textContent = 'Deleting...';

    try {
      const response = await fetch(`${API_BASE}/applications/${state.deletingApplication.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete application');
      }

      showToast(`Deleted ${state.deletingApplication.company} application`, 'info');
      closeDeleteModal();
      await loadData();
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.message, 'error');
    } finally {
      elements.confirmDeleteBtn.disabled = false;
      elements.confirmDeleteBtn.textContent = 'Delete Application';
    }
  }

  // ==========================================================================
  // Global Event Delegation (Edit/Delete buttons)
  // ==========================================================================
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      const appId = editBtn.getAttribute('data-id');
      openEditModal(appId);
      return;
    }

    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const appId = deleteBtn.getAttribute('data-id');
      openDeleteModal(appId);
      return;
    }

    // Modal backdrop click to close
    if (e.target === elements.editModal) {
      closeEditModal();
    }
    if (e.target === elements.deleteModal) {
      closeDeleteModal();
    }
  });

  // ==========================================================================
  // Filter & Search Controls
  // ==========================================================================
  let searchTimeout = null;
  elements.searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    elements.searchClearBtn.style.display = state.searchTerm ? 'block' : 'none';

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadData();
    }, 250);
  });

  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchTerm = '';
    elements.searchClearBtn.style.display = 'none';
    loadData();
  });

  elements.statusFilter.addEventListener('change', (e) => {
    state.statusFilter = e.target.value;
    loadData();
  });

  elements.sortBy.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    loadData();
  });

  // Quick stat filter cards click
  elements.statCards.forEach((card) => {
    card.addEventListener('click', () => {
      const filterValue = card.getAttribute('data-filter');
      if (filterValue) {
        state.statusFilter = filterValue;
        elements.statusFilter.value = filterValue;
        loadData();
      }
    });
    card.style.cursor = 'pointer';
  });

  // Form Reset
  elements.createResetBtn.addEventListener('click', () => {
    elements.createForm.reset();
    elements.createAppliedDate.value = getTodayString();
    resetCreateFormErrors();
  });

  // Modal Buttons
  elements.createForm.addEventListener('submit', handleCreateSubmit);
  elements.editApplicationForm.addEventListener('submit', handleEditSubmit);
  elements.closeEditModalBtn.addEventListener('click', closeEditModal);
  elements.cancelEditBtn.addEventListener('click', closeEditModal);

  elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Keyboard navigation: Escape key closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.editModal.style.display === 'flex') closeEditModal();
      if (elements.deleteModal.style.display === 'flex') closeDeleteModal();
    }
  });

  // ==========================================================================
  // Initialize Application
  // ==========================================================================
  async function init() {
    // Set default applied date to today
    elements.createAppliedDate.value = getTodayString();

    // Check MongoDB health and start polling every 15s
    await checkHealth();
    setInterval(checkHealth, 15000);

    // Initial load
    await loadData();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
