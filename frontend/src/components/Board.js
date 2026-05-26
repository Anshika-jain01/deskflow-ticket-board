import React from 'react';
import TicketCard from './TicketCard';

const COLUMNS = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const Board = ({ tickets, onMove, onDelete, movingId }) => {
  const grouped = {
    open: [],
    in_progress: [],
    resolved: [],
    closed: [],
  };

  tickets.forEach((t) => {
    if (grouped[t.status]) {
      grouped[t.status].push(t);
    }
  });

  return (
    <div className="board">
      {COLUMNS.map((col) => (
        <div key={col.key} className={`column ${col.key}`}>
          <div className="column-header">
            <h2>{col.label}</h2>
            <span className="count-badge">{grouped[col.key].length}</span>
          </div>
          <div className="column-body">
            {grouped[col.key].length === 0 ? (
              <div className="empty-column">No tickets</div>
            ) : (
              grouped[col.key].map((ticket) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  onMove={onMove}
                  onDelete={onDelete}
                  movingId={movingId}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Board;
