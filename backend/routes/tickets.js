const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { computeDerivedFields, ticketToResponse } = require('../helpers/sla');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// Status transition map
// Forward: open → in_progress → resolved → closed
// Backward: ONLY resolved → in_progress
const ALLOWED_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

const isValidTransition = (from, to) => {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed && allowed.includes(to);
};

// ─────────────────────────────────────────────
// POST /tickets — Create a ticket
// ─────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { subject, description, customerEmail, priority, status } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!customerEmail || !customerEmail.trim()) {
      return res.status(400).json({ error: 'Customer email is required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(customerEmail.trim())) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!priority) {
      return res.status(400).json({ error: 'Priority is required' });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const ticket = await Ticket.create({
      subject: subject.trim(),
      description: description.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      priority,
      status: status || 'open',
    });

    return res.status(201).json(ticketToResponse(ticket));
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /tickets/stats — Aggregate stats (BEFORE /:id)
// ─────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const tickets = await Ticket.find({});

    const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    let totalBreachedOpen = 0;

    tickets.forEach((ticket) => {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;

      const { slaBreached } = computeDerivedFields(ticket);
      if (slaBreached && (ticket.status === 'open' || ticket.status === 'in_progress')) {
        totalBreachedOpen += 1;
      }
    });

    return res.status(200).json({ byStatus, byPriority, totalBreachedOpen });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /tickets — List with combined filters
// ?status=, ?priority=, ?breached=true
// ─────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, breached } = req.query;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority filter. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    let tickets = await Ticket.find(query).sort({ createdAt: -1 });

    // Compute derived fields for every ticket
    let result = tickets.map(ticketToResponse);

    // Post-filter by breached (must be after derived computation)
    if (breached === 'true') {
      result = result.filter((t) => t.slaBreached === true);
    }

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// PATCH /tickets/:id — Update status
// ─────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === status) {
      return res.status(400).json({ error: `Ticket is already in '${status}' status` });
    }

    if (!isValidTransition(ticket.status, status)) {
      return res.status(400).json({
        error: `Invalid status transition: '${ticket.status}' → '${status}'. Allowed transitions from '${ticket.status}': [${ALLOWED_TRANSITIONS[ticket.status].join(', ') || 'none'}]`,
      });
    }

    // Auto-set resolvedAt when moving TO resolved
    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
    }

    // Auto-clear resolvedAt when moving FROM resolved BACK to in_progress
    if (ticket.status === 'resolved' && status === 'in_progress') {
      ticket.resolvedAt = null;
    }

    ticket.status = status;
    await ticket.save();

    return res.status(200).json(ticketToResponse(ticket));
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────
// DELETE /tickets/:id — Delete a ticket
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    return res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    next(err);
  }
});

module.exports = router;
