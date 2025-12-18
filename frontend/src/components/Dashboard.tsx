import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import ResumeUpload from './ResumeUpload';
import ResumeList from './ResumeList';
import ApplicationForm from './ApplicationForm';
import ApplicationsList from './ApplicationsList';
import AgentChat from './AgentChat';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth0();
  const [resumeRefreshTrigger, setResumeRefreshTrigger] = useState(0);
  const [applicationRefreshTrigger, setApplicationRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'applications' | 'resumes' | 'assistant'>('applications');

  const handleResumeUploadComplete = () => {
    setResumeRefreshTrigger((prev) => prev + 1);
  };

  const handleApplicationSubmitSuccess = () => {
    setApplicationRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <h1 className="app-logo">ApplyFlow</h1>
          <div className="nav-actions">
            <span className="user-email">{user?.email}</span>
            <button onClick={() => logout()} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Applications
          </button>
          <button
            className={`tab-btn ${activeTab === 'resumes' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumes')}
          >
            <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Resumes
          </button>
          <button
            className={`tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveTab('assistant')}
          >
            <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Assistant
          </button>
        </div>

        {activeTab === 'applications' ? (
          <div className="tab-content">
            <div className="content-grid">
              <div className="main-section">
                <ApplicationsList refreshTrigger={applicationRefreshTrigger} />
              </div>
              <div className="sidebar-section">
                <ApplicationForm onSubmitSuccess={handleApplicationSubmitSuccess} />
              </div>
            </div>
          </div>
        ) : activeTab === 'resumes' ? (
          <div className="tab-content">
            <div className="resumes-section">
              <div className="section-card">
                <h2 className="section-title">Upload Resume</h2>
                <ResumeUpload onUploadComplete={handleResumeUploadComplete} />
              </div>
              <div className="section-card">
                <ResumeList refreshTrigger={resumeRefreshTrigger} />
              </div>
            </div>
          </div>
        ) : (
          <div className="tab-content">
            <AgentChat />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
