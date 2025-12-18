'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applicationsApi, type Application } from '@/lib/api-client';
import { Loader2, Trash2, Plus } from 'lucide-react';

export default function ApplicationsTab() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Application>>({
    job_title: '',
    company: '',
    pay: undefined,
    location: '',
    job_url: '',
    status: 'applied',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsApi.list();
      setApplications(response.applications || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.job_title?.trim()) {
      newErrors.job_title = 'Job title is required';
    }

    if (!formData.company?.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (formData.job_url && !isValidUrl(formData.job_url)) {
      newErrors.job_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await applicationsApi.create(formData);
      await loadApplications();
      setFormData({
        job_title: '',
        company: '',
        pay: undefined,
        location: '',
        job_url: '',
        status: 'applied',
      });
      setShowForm(false);
      setErrors({});
    } catch (error) {
      console.error('Failed to create application:', error);
      alert('Failed to create application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await applicationsApi.delete(id);
      await loadApplications();
    } catch (error) {
      console.error('Failed to delete application:', error);
      alert('Failed to delete application. Please try again.');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-green-200 text-green-900';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(221,83%,15%)]">Job Applications</h2>
          <p className="text-gray-600 mt-1">Track your job applications</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-[hsl(221,83%,15%)] hover:bg-[hsl(221,83%,20%)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Application</CardTitle>
            <CardDescription>Add a new job application to track</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder="Software Engineer"
                    className={errors.job_title ? 'border-red-500' : ''}
                  />
                  {errors.job_title && <p className="text-sm text-red-500">{errors.job_title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">
                    Company <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Tech Corp"
                    className={errors.company ? 'border-red-500' : ''}
                  />
                  {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay">Salary</Label>
                  <Input
                    id="pay"
                    type="number"
                    value={formData.pay || ''}
                    onChange={(e) => setFormData({ ...formData, pay: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="120000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_url">Job URL</Label>
                  <Input
                    id="job_url"
                    value={formData.job_url}
                    onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                    placeholder="https://example.com/jobs/123"
                    className={errors.job_url ? 'border-red-500' : ''}
                  />
                  {errors.job_url && <p className="text-sm text-red-500">{errors.job_url}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Application['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="interviewing">Interviewing</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[hsl(221,83%,15%)] hover:bg-[hsl(221,83%,20%)]">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(221,83%,15%)]" />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No applications yet. Click &quot;Add Application&quot; to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[hsl(221,83%,15%)]">{app.job_title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium mb-1">{app.company}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {app.location && <span>📍 {app.location}</span>}
                      {app.pay && <span>💰 ${app.pay.toLocaleString()}</span>}
                      {app.created_at && (
                        <span>📅 {new Date(app.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[hsl(221,83%,15%)] hover:underline mt-2 inline-block"
                      >
                        View Job Posting →
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => app.id && handleDelete(app.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
