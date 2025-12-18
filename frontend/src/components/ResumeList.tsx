import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './ResumeList.css';

interface Resume {
  id: string;
  file_name: string;
  upload_status: string;
  created_at?: string;
}

interface ResumeListProps {
  refreshTrigger: number;
  onSelectResume?: (resumeId: string, fileName: string) => void;
  selectedResumeId?: string;
}

function ResumeList({ refreshTrigger, onSelectResume, selectedResumeId }: ResumeListProps) {
  const { getAccessTokenSilently } = useAuth0();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/resumes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
  }, [getAccessTokenSilently]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes, refreshTrigger]);

  if (loading) {
    return (
      <div className="resumes-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="resumes-empty">
        <p>No resumes uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="resumes-list">
      <h3 className="resumes-title">Your Resumes</h3>
      <div className="resumes-grid">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className={`resume-item ${selectedResumeId === resume.id ? 'selected' : ''} ${onSelectResume ? 'clickable' : ''}`}
            onClick={() => onSelectResume?.(resume.id, resume.file_name)}
          >
            <svg className="resume-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="resume-info">
              <p className="resume-name">{resume.file_name}</p>
              <span className={`resume-status ${resume.upload_status}`}>
                {resume.upload_status}
              </span>
            </div>
            {selectedResumeId === resume.id && (
              <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResumeList;
