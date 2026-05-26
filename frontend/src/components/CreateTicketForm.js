import React, { useState } from 'react';

const CreateTicketForm = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'medium',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.customerEmail.trim()) {
      e.customerEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) {
      e.customerEmail = 'Invalid email format';
    }
    return e;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        subject: form.subject.trim(),
        description: form.description.trim(),
        customerEmail: form.customerEmail.trim(),
        priority: form.priority,
      });
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || 'Failed to create ticket';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Ticket</h2>
        {apiError && <div className="error-banner" style={{ margin: '0 0 16px 0' }}>{apiError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              className={errors.subject ? 'input-error' : ''}
              value={form.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Brief summary of the issue"
            />
            {errors.subject && <div className="field-error">{errors.subject}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className={errors.description ? 'input-error' : ''}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the issue in detail"
            />
            {errors.description && <div className="field-error">{errors.description}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="customerEmail">Customer Email</label>
            <input
              id="customerEmail"
              type="text"
              className={errors.customerEmail ? 'input-error' : ''}
              value={form.customerEmail}
              onChange={(e) => handleChange('customerEmail', e.target.value)}
              placeholder="customer@example.com"
            />
            {errors.customerEmail && <div className="field-error">{errors.customerEmail}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketForm;
