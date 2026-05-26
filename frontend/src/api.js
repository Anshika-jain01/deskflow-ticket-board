import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

export const fetchTickets = (params = {}) => API.get('/tickets', { params });
export const fetchStats = () => API.get('/tickets/stats');
export const createTicket = (data) => API.post('/tickets', data);
export const updateTicketStatus = (id, status) => API.patch(`/tickets/${id}`, { status });
export const deleteTicket = (id) => API.delete(`/tickets/${id}`);

export default API;
