// SLA targets in minutes by priority
const SLA_TARGETS = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320,
};

const getSlaMinutes = (priority) => {
  return SLA_TARGETS[priority] || 4320;
};

const computeDerivedFields = (ticket) => {
  const now = new Date();
  const createdAt = new Date(ticket.createdAt);
  const slaTarget = getSlaMinutes(ticket.priority);

  let ageEnd;
  if ((ticket.status === 'resolved' || ticket.status === 'closed') && ticket.resolvedAt) {
    ageEnd = new Date(ticket.resolvedAt);
  } else {
    ageEnd = now;
  }

  const ageMinutes = Math.floor((ageEnd - createdAt) / (1000 * 60));

  let slaBreached;
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    if (ticket.resolvedAt) {
      const resolvedAge = Math.floor((new Date(ticket.resolvedAt) - createdAt) / (1000 * 60));
      slaBreached = resolvedAge > slaTarget;
    } else {
      slaBreached = ageMinutes > slaTarget;
    }
  } else {
    slaBreached = ageMinutes > slaTarget;
  }

  return {
    ageMinutes,
    slaBreached,
  };
};

// Convert a mongoose doc or plain object to response with derived fields
const ticketToResponse = (ticket) => {
  const obj = typeof ticket.toObject === 'function' ? ticket.toObject() : { ...ticket };
  const derived = computeDerivedFields(obj);
  obj.ageMinutes = derived.ageMinutes;
  obj.slaBreached = derived.slaBreached;
  delete obj.__v;
  delete obj.id;
  return obj;
};

module.exports = { SLA_TARGETS, getSlaMinutes, computeDerivedFields, ticketToResponse };
