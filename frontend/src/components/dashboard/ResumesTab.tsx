'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resumesApi, type Resume } from '@/lib/api-client';
import { Loader2, Upload, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function ResumesTab() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await resumesApi.list();
      setResumes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load resumes:', error);
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type (PDF only for resumes)
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);

      // Step 1: Get presigned upload URL
      const { upload_url, s3_key } = await resumesApi.getUploadUrl(file.name);

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Create resume record in DynamoDB
      await resumesApi.create({
        file_name: file.name,
        s3_key: s3_key,
        upload_status: 'completed',
      });

      // Reload resumes list
      await loadResumes();
    } catch (error) {
      console.error('Failed to upload resume:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(221,83%,15%)]">Resumes</h2>
        <p className="text-gray-600 mt-1">Upload and manage your resumes</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>Drag and drop your resume or click to browse (PDF only, max 10MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-[hsl(221,83%,15%)] bg-blue-50'
                : 'border-gray-300 hover:border-[hsl(221,83%,15%)]'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-[hsl(221,83%,15%)]" />
                <p className="text-gray-600">Uploading your resume...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-700">Drop your resume here</p>
                  <p className="text-sm text-gray-500 mt-1">or</p>
                </div>
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-[hsl(221,83%,15%)] hover:bg-[hsl(221,83%,20%)]"
                  >
                    Browse Files
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumes List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(221,83%,15%)]" />
        </div>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No resumes uploaded yet. Upload your first resume above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[hsl(221,83%,15%)]">Your Resumes</h3>
          <div className="grid gap-3">
            {resumes.map((resume) => (
              <Card key={resume.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-10 w-10 text-[hsl(221,83%,15%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{resume.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(resume.upload_status)}
                        <span className="text-xs text-gray-500 capitalize">{resume.upload_status}</span>
                        {resume.created_at && (
                          <span className="text-xs text-gray-400">
                            • {new Date(resume.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
