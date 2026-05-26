const mongoose = require('mongoose');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// SLA targets in minutes
const SLA_TARGETS = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320,
};

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: VALID_PRIORITIES,
        message: 'Priority must be one of: low, medium, high, urgent',
      },
    },
    status: {
      type: String,
      enum: {
        values: VALID_STATUSES,
        message: 'Status must be one of: open, in_progress, resolved, closed',
      },
      default: 'open',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Disable automatic timestamps since we handle createdAt manually
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Computed derived fields at read time
ticketSchema.methods.toJSONWithDerived = function () {
  const obj = this.toObject({ virtuals: true });
  const now = new Date();
  const slaTarget = SLA_TARGETS[this.priority];

  // ageMinutes: for resolved tickets use resolvedAt, else use now
  let ageEnd;
  if (this.status === 'resolved' && this.resolvedAt) {
    ageEnd = this.resolvedAt;
  } else {
    ageEnd = now;
  }
  const ageMinutes = Math.floor((ageEnd - this.createdAt) / (1000 * 60));

  // slaBreached:
  // - If still unresolved (open or in_progress): breached if ageMinutes > slaTarget
  // - If resolved: breached if (resolvedAt - createdAt) > slaTarget
  // - If closed: breached if resolved after sla target (use resolvedAt if exists, else age now)
  let slaBreached;
  if (this.status === 'resolved' || this.status === 'closed') {
    if (this.resolvedAt) {
      const resolvedAge = Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60));
      slaBreached = resolvedAge > slaTarget;
    } else {
      slaBreached = ageMinutes > slaTarget;
    }
  } else {
    // open or in_progress — unresolved
    slaBreached = ageMinutes > slaTarget;
  }

  obj.ageMinutes = ageMinutes;
  obj.slaBreached = slaBreached;

  // Remove mongoose internals
  delete obj.__v;
  delete obj.id; // keep _id

  return obj;
};

// Static helper to compute derived fields for plain objects (used in stats)
ticketSchema.statics.SLA_TARGETS = SLA_TARGETS;
ticketSchema.statics.VALID_PRIORITIES = VALID_PRIORITIES;
ticketSchema.statics.VALID_STATUSES = VALID_STATUSES;

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
