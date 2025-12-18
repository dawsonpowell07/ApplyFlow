import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './ApplicationsList.css';

interface Application {
  id: string;
  job_title: string;
  company: string;
  pay?: number;
  location?: string;
  resume_used?: string;
  resume_id?: string;
  job_url?: string;
  status: string;
  created_at?: string;
}

interface ApplicationsListProps {
  refreshTrigger: number;
}

function ApplicationsList({ refreshTrigger }: ApplicationsListProps) {
  const { getAccessTokenSilently } = useAuth0();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchApplications = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const url = filter === 'all'
        ? 'https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/applications'
        : `https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/applications?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications, refreshTrigger]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: '#3182ce',
      interviewing: '#d69e2e',
      offer: '#38a169',
      accepted: '#38a169',
      rejected: '#e53e3e'
    };
    return colors[status] || '#718096';
  };

  if (loading) {
    return (
      <div className="applications-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="applications-list-container">
      <div className="applications-header">
        <h3 className="applications-title">Your Applications</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'applied' ? 'active' : ''}`}
            onClick={() => setFilter('applied')}
          >
            Applied
          </button>
          <button
            className={`filter-btn ${filter === 'interviewing' ? 'active' : ''}`}
            onClick={() => setFilter('interviewing')}
          >
            Interviewing
          </button>
          <button
            className={`filter-btn ${filter === 'offer' ? 'active' : ''}`}
            onClick={() => setFilter('offer')}
          >
            Offer
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="applications-empty">
          <p>No applications found</p>
          <p className="empty-subtext">Add your first job application to get started</p>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div className="card-header">
                <div className="card-title-section">
                  <h4 className="card-job-title">{app.job_title}</h4>
                  <p className="card-company">{app.company}</p>
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(app.status) }}
                >
                  {app.status}
                </span>
              </div>

              <div className="card-details">
                {app.location && (
                  <div className="detail-item">
                    <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{app.location}</span>
                  </div>
                )}

                {app.pay && (
                  <div className="detail-item">
                    <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>${app.pay.toLocaleString()}</span>
                  </div>
                )}

                {app.resume_used && (
                  <div className="detail-item">
                    <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{app.resume_used}</span>
                  </div>
                )}

                {app.job_url && (
                  <div className="detail-item">
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="job-link">
                      <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Job Posting
                    </a>
                  </div>
                )}
              </div>

              {app.created_at && (
                <div className="card-footer">
                  <span className="created-date">
                    Added {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApplicationsList;
