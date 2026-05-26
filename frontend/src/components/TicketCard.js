import React from 'react';

const formatAge = (minutes) => {
  if (minutes < 1) return '< 1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
};

const TicketCard = ({ ticket, onMove, onDelete, movingId }) => {
  const { _id, subject, priority, ageMinutes, slaBreached, status } = ticket;
  const isMoving = movingId === _id;

  // Only show valid adjacent transitions
  const getActions = () => {
    switch (status) {
      case 'open':
        return [{ label: '→ In Progress', target: 'in_progress', type: 'forward' }];
      case 'in_progress':
        return [
          { label: '→ Resolved', target: 'resolved', type: 'forward' },
        ];
      case 'resolved':
        return [
          { label: '→ Closed', target: 'closed', type: 'forward' },
          { label: '← In Progress', target: 'in_progress', type: 'backward' },
        ];
      case 'closed':
        return [];
      default:
        return [];
    }
  };

  const actions = getActions();

  return (
    <div className="ticket-card">
      <div className="card-top">
        <span className="card-subject">{subject}</span>
        <span className={`priority-badge ${priority}`}>{priority}</span>
      </div>
      <div className="card-meta">
        <span className="age-text">🕐 {formatAge(ageMinutes)}</span>
        {slaBreached && <span className="sla-breach">⚠ SLA Breached</span>}
      </div>
      <div className="card-actions">
        {actions.map((action) => (
          <button
            key={action.target}
            className={`btn-move ${action.type}`}
            disabled={isMoving}
            onClick={() => onMove(_id, action.target)}
          >
            {isMoving ? '...' : action.label}
          </button>
        ))}
        <button
          className="btn-move delete"
          disabled={isMoving}
          onClick={() => onDelete(_id)}
          title="Delete ticket"
        >
          🗑
        </button>
      </div>
    </div>
  );
};

export default TicketCard;
