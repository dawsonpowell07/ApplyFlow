import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './ResumeUpload.css';

interface Resume {
  id: string;
  file_name: string;
  upload_status: string;
  created_at?: string;
}

interface ResumeUploadProps {
  onUploadComplete: () => void;
}

function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const { getAccessTokenSilently } = useAuth0();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const uploadResume = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress('Getting upload URL...');

      const token = await getAccessTokenSilently();

      // Step 1: Get pre-signed URL
      const uploadUrlResponse = await fetch('https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/resumes/upload-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type
        })
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { presigned_url, resume_id } = await uploadUrlResponse.json();

      // Step 2: Upload file to S3
      setUploadProgress('Uploading file...');
      const s3Response = await fetch(presigned_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!s3Response.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Confirm upload
      setUploadProgress('Confirming upload...');
      const confirmResponse = await fetch('https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com/resumes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resume_id })
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      setUploadProgress('Upload complete!');
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
        onUploadComplete();
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 3000);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadResume(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadResume(e.target.files[0]);
    }
  };

  return (
    <div className="resume-upload-container">
      <div
        className={`dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="resume-file-input"
          className="file-input"
          onChange={handleFileInput}
          accept=".pdf,.doc,.docx"
          disabled={uploading}
        />
        <label htmlFor="resume-file-input" className="dropzone-label">
          {uploading ? (
            <>
              <div className="upload-spinner"></div>
              <p className="upload-text">{uploadProgress}</p>
            </>
          ) : (
            <>
              <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="dropzone-text">
                {dragActive ? 'Drop your resume here' : 'Drag & drop your resume or click to browse'}
              </p>
              <p className="dropzone-subtext">PDF, DOC, DOCX</p>
            </>
          )}
        </label>
      </div>
    </div>
  );
}

export default ResumeUpload;
