import React from 'react';

const StatsStrip = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="stats-strip">
        <div className="stat-item"><span className="stat-label">Loading stats...</span></div>
      </div>
    );
  }

  const { byStatus, byPriority, totalBreachedOpen } = stats;

  return (
    <div className="stats-strip">
      <div className="stat-item">
        <span className="stat-label">Open</span>
        <span className="stat-value">{byStatus.open}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">In Progress</span>
        <span className="stat-value">{byStatus.in_progress}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Resolved</span>
        <span className="stat-value">{byStatus.resolved}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Closed</span>
        <span className="stat-value">{byStatus.closed}</span>
      </div>
      <div className={`stat-item${totalBreachedOpen > 0 ? ' breached' : ''}`}>
        <span className="stat-label">⚠ SLA Breached</span>
        <span className="stat-value">{totalBreachedOpen}</span>
      </div>
    </div>
  );
};

export default StatsStrip;
