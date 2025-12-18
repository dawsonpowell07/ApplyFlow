import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './ApplicationForm.css';

interface ApplicationFormProps {
  onSubmitSuccess: () => void;
}

function ApplicationForm({ onSubmitSuccess }: ApplicationFormProps) {
  const { getAccessTokenSilently } = useAuth0();
  const [formData, setFormData] = useState({
    job_title: '',
    company: '',
    pay: '',
    location: '',
    resume_id: '',
    resume_used: '',
    job_url: '',
    status: 'applied'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showResumeSelector, setShowResumeSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.job_title || !formData.company) {
      setError('Job title and company are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const token = await getAccessTokenSilently();

      const payload = {
        ...formData,
        pay: formData.pay ? parseInt(formData.pay) : undefined
      };

      const response = await fetch('https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      setFormData({
        job_title: '',
        company: '',
        pay: '',
        location: '',
        resume_id: '',
        resume_used: '',
        job_url: '',
        status: 'applied'
      });

      onSubmitSuccess();
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeSelect = (resumeId: string, fileName: string) => {
    setFormData({ ...formData, resume_id: resumeId, resume_used: fileName });
    setShowResumeSelector(false);
  };

  return (
    <div className="application-form-container">
      <h3 className="form-title">Add New Application</h3>
      <form onSubmit={handleSubmit} className="application-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="job_title">Job Title *</label>
            <input
              type="text"
              id="job_title"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="Software Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">Company *</label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Corp"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pay">Salary</label>
            <input
              type="number"
              id="pay"
              value={formData.pay}
              onChange={(e) => setFormData({ ...formData, pay: e.target.value })}
              placeholder="100000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="San Francisco, CA"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="job_url">Job URL</label>
          <input
            type="url"
            id="job_url"
            value={formData.job_url}
            onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
            placeholder="https://example.com/jobs/123"
          />
        </div>

        <div className="form-group">
          <label htmlFor="resume">Resume Used</label>
          <div className="resume-selector">
            {formData.resume_used ? (
              <div className="selected-resume">
                <span>{formData.resume_used}</span>
                <button
                  type="button"
                  className="change-resume-btn"
                  onClick={() => setShowResumeSelector(true)}
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="select-resume-btn"
                onClick={() => setShowResumeSelector(true)}
              >
                Select Resume
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Add Application'}
        </button>
      </form>

      {showResumeSelector && (
        <div className="modal-overlay" onClick={() => setShowResumeSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Resume</h3>
              <button className="modal-close" onClick={() => setShowResumeSelector(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <ResumeListForSelector onSelect={handleResumeSelect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini resume list for selection modal
function ResumeListForSelector({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const { getAccessTokenSilently } = useAuth0();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch('https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/resumes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setResumes(data);
        }
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  if (loading) return <div className="loading">Loading resumes...</div>;
  if (resumes.length === 0) return <div className="empty">No resumes available. Please upload one first.</div>;

  return (
    <div className="resume-selector-list">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="resume-selector-item"
          onClick={() => onSelect(resume.id, resume.file_name)}
        >
          <svg className="resume-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{resume.file_name}</span>
        </div>
      ))}
    </div>
  );
}

export default ApplicationForm;
