import React, { useState, useEffect, useCallback } from 'react';
import { fetchTickets, fetchStats, createTicket, updateTicketStatus, deleteTicket } from './api';
import StatsStrip from './components/StatsStrip';
import Board from './components/Board';
import CreateTicketForm from './components/CreateTicketForm';

function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [movingId, setMovingId] = useState(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('');
  const [breachedFilter, setBreachedFilter] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      setError('');
      const params = {};
      if (priorityFilter) params.priority = priorityFilter;
      if (breachedFilter) params.breached = 'true';
      const res = await fetchTickets(params);
      // Backend now returns array directly (or res.data could be array)
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setTickets(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, breachedFilter]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchStats();
      // Backend returns { byStatus, byPriority, totalBreachedOpen } directly
      const data = res.data.data || res.data;
      setStats(data);
    } catch (err) {
      // Stats failure is non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleCreate = async (data) => {
    await createTicket(data);
    await Promise.all([loadTickets(), loadStats()]);
  };

  const handleMove = async (id, newStatus) => {
    setMovingId(id);
    try {
      await updateTicketStatus(id, newStatus);
      await Promise.all([loadTickets(), loadStats()]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to move ticket';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setMovingId(null);
    }
  };

  const handleDelete = async (id) => {
    setMovingId(id);
    try {
      await deleteTicket(id);
      await Promise.all([loadTickets(), loadStats()]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete ticket';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>DeskFlow <span>Support Ticket Triage Board</span></h1>
        <button className="btn-create" onClick={() => setShowForm(true)}>
          + New Ticket
        </button>
      </header>

      {/* Stats */}
      <StatsStrip stats={stats} loading={statsLoading} />

      {/* Filters */}
      <div className="filters-bar">
        <label>Priority:</label>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <label className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={breachedFilter}
            onChange={(e) => setBreachedFilter(e.target.checked)}
          />
          Show SLA Breached Only
        </label>
      </div>

      {/* Error */}
      {error && <div className="error-banner">{error}</div>}

      {/* Board */}
      {loading ? (
        <div className="loading-overlay">
          <div className="spinner"></div>
          Loading tickets...
        </div>
      ) : (
        <Board tickets={tickets} onMove={handleMove} onDelete={handleDelete} movingId={movingId} />
      )}

      {/* Create modal */}
      {showForm && (
        <CreateTicketForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

export default App;
