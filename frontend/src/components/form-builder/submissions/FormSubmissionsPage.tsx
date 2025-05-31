// src/components/form-builder/submissions/FormSubmissionsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Download,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  Calendar,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  submissionsService,
  type Submission,
  type SubmissionStats,
  type PaginationInfo,
} from '@/services/submissions';
import { formsService } from '@/services/forms';
import { deleteFormFile } from '@/services/fileUploadService';
import FileManager from '@/components/form-builder/FileManager';

// ===== UTILITY FUNCTIONS =====
const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 30) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ===== MAIN COMPONENT =====
const FormSubmissionsPage: React.FC = () => {
  const params = useParams();
  const formId = params?.formId as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formStructure, setFormStructure] = useState<any>(null);
  const [fieldLabelsMap, setFieldLabelsMap] = useState<Record<string, string>>(
    {}
  );
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    unread: 0,
    pending: 0,
    processed: 0,
    failed: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // Function to create field labels map from form structure
  const createFieldLabelsMap = (formData: any) => {
    const labelsMap: Record<string, string> = {};

    if (formData?.pages && Array.isArray(formData.pages)) {
      formData.pages.forEach((page: any) => {
        if (page.fields && Array.isArray(page.fields)) {
          page.fields.forEach((field: any) => {
            if (field.id && field.label) {
              labelsMap[field.id] = field.label;
            }
          });
        }
      });
    }

    console.log('🏷️ Created field labels map:', labelsMap);
    return labelsMap;
  };

  // Function to fetch form structure
  const fetchFormStructure = useCallback(async () => {
    if (!formId) return;

    try {
      console.log('📋 Fetching form structure for:', formId);
      const response = await formsService.getForm(formId);
      if (response.success && response.data) {
        setFormStructure(response.data);
        const labelsMap = createFieldLabelsMap(response.data);
        setFieldLabelsMap(labelsMap);
        console.log('✅ Form structure fetched and labels mapped');
      }
    } catch (error: any) {
      console.error('❌ Error fetching form structure:', error);
    }
  }, [formId]);

  // API call to fetch submissions
  const fetchSubmissions = useCallback(
    async (page = 1, limit = 20) => {
      if (!formId) {
        console.error('❌ No formId provided');
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Fetching submissions for form:', formId);

        const filters = {
          page,
          limit,
          sortBy: 'submittedAt',
          sortOrder: 'desc' as const,
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(readFilter !== 'all' && {
            isRead: readFilter === 'read' ? 'true' : 'false',
          }),
        };

        const response = await submissionsService.getSubmissions(
          formId,
          filters
        );

        if (response.success) {
          const processedSubmissions = (response.data.submissions || []).map(
            (submission: any) => {
              const id = submission.id || submission._id;
              if (!id) {
                console.warn('⚠️ Submission missing ID:', submission);
              }

              return {
                ...submission,
                id: id ? String(id) : '',
              };
            }
          );

          console.log(
            '🔍 Processed submissions sample:',
            processedSubmissions.slice(0, 2)
          );

          setSubmissions(processedSubmissions);
          setStats(
            response.data.stats || {
              total: 0,
              unread: 0,
              pending: 0,
              processed: 0,
              failed: 0,
            }
          );
          setPagination(
            response.data.pagination || {
              current: 1,
              pages: 1,
              total: 0,
              limit: 20,
            }
          );
          console.log(
            '✅ Submissions fetched successfully:',
            processedSubmissions.length
          );
        }
      } catch (error: any) {
        console.error('❌ Error fetching submissions:', error);
        toast.error(error.message || 'Failed to fetch submissions');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    },
    [formId, searchTerm, statusFilter, readFilter]
  );

  // Download CSV export
  const handleDownloadCsv = async () => {
    if (!formId) return;

    setDownloadingCsv(true);
    try {
      console.log('📥 Starting CSV download for form:', formId);

      const blob = await submissionsService.exportCSV(formId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form-submissions-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('CSV file downloaded successfully');
      console.log('✅ CSV download completed');
    } catch (error: any) {
      console.error('❌ Error downloading CSV:', error);
      toast.error(error.message || 'Failed to download CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Mark submission as read/unread
  const handleToggleRead = async (submissionId: string, isRead: boolean) => {
    try {
      if (!submissionId || submissionId.trim() === '') {
        throw new Error('Invalid submission ID');
      }

      console.log('🔄 Toggling read status:', {
        submissionId,
        currentStatus: isRead,
        newStatus: !isRead,
      });

      await submissionsService.updateReadStatus(submissionId, !isRead);

      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, isRead: !isRead } : sub
        )
      );

      setStats(prev => ({
        ...prev,
        unread: !isRead ? prev.unread - 1 : prev.unread + 1,
      }));

      toast.success(`Submission marked as ${!isRead ? 'read' : 'unread'}`);
      console.log('✅ Read status updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating read status:', error);
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, isRead: isRead } : sub
        )
      );
      toast.error(error.message || 'Failed to update read status');
    }
  };

  // Delete submission
  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      if (!submissionId || submissionId.trim() === '') {
        throw new Error('Invalid submission ID');
      }

      console.log('🗑️ Deleting submission:', submissionId);
      setDeleting(true);

      await submissionsService.deleteSubmission(submissionId);

      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));

      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        unread:
          submissions.find(s => s.id === submissionId)?.isRead === false
            ? prev.unread - 1
            : prev.unread,
      }));

      toast.success('Submission deleted successfully');
      console.log('✅ Submission deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting submission:', error);
      toast.error(error.message || 'Failed to delete submission');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
    }
  };

  // ✅ NEW: Delete individual file with enhanced error handling
  const handleDeleteFile = async (
    file: any,
    submissionId: string,
    fieldId: string
  ) => {
    try {
      if (!file?.publicId) {
        throw new Error('Invalid file data');
      }

      console.log('🗑️ Deleting file:', {
        publicId: file.publicId,
        submissionId,
        fieldId,
        fileName: file.originalName,
      });

      // Delete from cloud storage
      const resourceType = file.mimeType?.startsWith('image/')
        ? 'image'
        : 'raw';
      await deleteFormFile(file.publicId, resourceType);

      // Update local state - remove file from submission data
      setSubmissions(prev =>
        prev.map(sub => {
          if (sub.id === submissionId) {
            const updatedData = { ...sub.data };
            const fieldFiles = updatedData[fieldId];

            if (Array.isArray(fieldFiles)) {
              // Multiple files - remove the specific file
              updatedData[fieldId] = fieldFiles.filter(
                f => f.publicId !== file.publicId
              );
              if (updatedData[fieldId].length === 0) {
                delete updatedData[fieldId]; // Remove field if no files left
              }
            } else if (fieldFiles?.publicId === file.publicId) {
              // Single file - remove the field
              delete updatedData[fieldId];
            }

            return { ...sub, data: updatedData };
          }
          return sub;
        })
      );

      // Also update selectedSubmission if it's currently displayed
      if (selectedSubmission?.id === submissionId) {
        const updatedData = { ...selectedSubmission.data };
        const fieldFiles = updatedData[fieldId];

        if (Array.isArray(fieldFiles)) {
          updatedData[fieldId] = fieldFiles.filter(
            f => f.publicId !== file.publicId
          );
          if (updatedData[fieldId].length === 0) {
            delete updatedData[fieldId];
          }
        } else if (fieldFiles?.publicId === file.publicId) {
          delete updatedData[fieldId];
        }

        setSelectedSubmission({ ...selectedSubmission, data: updatedData });
      }

      // toast.success('File deleted successfully');
      console.log('✅ File deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting file:', error);
      toast.error(error.message || 'Failed to delete file');
      throw error; // Re-throw for FileManager error handling
    }
  };

  // Confirm delete functions
  const confirmDelete = (submissionId: string) => {
    setSubmissionToDelete(submissionId);
    setShowDeleteDialog(true);
  };

  // View submission details
  const handleViewSubmission = async (submission: Submission) => {
    try {
      console.log('👁️ Viewing submission:', {
        id: submission.id,
        isRead: submission.isRead,
        data: submission.data,
      });

      setSelectedSubmission(submission);
      setShowSubmissionModal(true);

      if (!submission.isRead) {
        handleToggleRead(submission.id, submission.isRead).catch(error => {
          console.warn(
            '⚠️ Failed to mark submission as read when viewing:',
            error
          );
        });
      }
    } catch (error: any) {
      console.error('❌ Error viewing submission:', error);
      toast.error('Failed to view submission details');
    }
  };

  // Extract data for table display
  const extractSubmissionData = (data: Record<string, any>) => {
    const extracted: Record<string, string> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        if (value.firstName && value.lastName) {
          extracted[key] = `${value.firstName} ${value.lastName}`;
        } else if (value.street && value.city) {
          extracted[key] = `${value.street}, ${value.city}`;
        } else if (
          Array.isArray(value) &&
          value.length > 0 &&
          value[0]?.originalName
        ) {
          // Handle file arrays
          extracted[key] = `📎 ${value.length} file(s)`;
        } else if (value.originalName && value.url) {
          // Single file
          extracted[key] = `📎 ${value.originalName}`;
        } else {
          extracted[key] = JSON.stringify(value);
        }
      } else {
        extracted[key] = String(value || '');
      }
    });

    return extracted;
  };

  // Get all unique field names from submissions with proper labels
  const getAllFieldNames = () => {
    const fieldNames = new Set<string>();
    submissions.forEach(submission => {
      Object.keys(submission.data).forEach(key => fieldNames.add(key));
    });
    return Array.from(fieldNames);
  };

  // Get field display name using the labels map
  const getFieldLabel = (fieldId: string): string => {
    if (fieldLabelsMap[fieldId]) {
      return fieldLabelsMap[fieldId];
    }

    const commonFields: Record<string, string> = {
      name: 'Name',
      fullName: 'Full Name',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      emailAddress: 'Email Address',
      phone: 'Phone',
      phoneNumber: 'Phone Number',
      address: 'Address',
      message: 'Message',
      subject: 'Subject',
      company: 'Company',
      website: 'Website',
    };

    if (commonFields[fieldId]) {
      return commonFields[fieldId];
    }

    if (
      fieldId.match(
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
      )
    ) {
      return 'Custom Field';
    }

    return fieldId
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Processed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            <AlertCircle className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant='destructive' className='bg-red-100 text-red-800'>
            <XCircle className='w-3 h-3 mr-1' />
            Failed
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  // Get common field display names and icons
  const getFieldDisplayInfo = (fieldId: string) => {
    const label = getFieldLabel(fieldId);
    const labelLower = label.toLowerCase();
    let icon = null;

    if (labelLower.includes('name')) {
      icon = <User className='w-4 h-4' />;
    } else if (labelLower.includes('email')) {
      icon = <Mail className='w-4 h-4' />;
    } else if (labelLower.includes('phone')) {
      icon = <Phone className='w-4 h-4' />;
    }

    return { label, icon };
  };

  // ✅ ENHANCED: Check if value is a file field
  const isFileField = (value: any): boolean => {
    if (!value || typeof value !== 'object') return false;

    // Single file
    if (value.originalName && value.url && value.publicId) return true;

    // Array of files
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value[0]?.originalName &&
      value[0]?.url
    )
      return true;

    return false;
  };

  // ✅ NEW: Render field value with FileManager for files
  const renderFieldValue = (fieldId: string, value: any) => {
    const { label } = getFieldDisplayInfo(fieldId);

    // Check if this is a file field
    if (isFileField(value)) {
      return (
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-600'>{label}</label>
          <FileManager
            files={value}
            fieldLabel={undefined} // We already show the label above
            fieldId={fieldId}
            submissionId={selectedSubmission!.id}
            onFileDelete={async file => {
              await handleDeleteFile(file, selectedSubmission!.id, fieldId);
            }}
            onFileDownload={async file => {
              // Custom download with analytics tracking
              try {
                const response = await fetch(file.url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.originalName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success('File downloaded successfully');
              } catch (error) {
                toast.error('Failed to download file');
                throw error;
              }
            }}
            showActions={true}
            compact={true}
            readOnly={false}
          />
        </div>
      );
    }

    // Handle other object types
    if (value && typeof value === 'object') {
      return (
        <div className='border-b border-gray-200 pb-3'>
          <label className='text-sm font-medium text-gray-600'>{label}</label>
          <div className='mt-1'>
            <pre className='text-sm bg-gray-100 p-2 rounded overflow-x-auto'>
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    // Regular text field
    return (
      <div className='border-b border-gray-200 pb-3'>
        <label className='text-sm font-medium text-gray-600'>{label}</label>
        <div className='mt-1'>
          <p className='text-sm'>{String(value) || 'N/A'}</p>
        </div>
      </div>
    );
  };

  // Initialize data on component mount
  useEffect(() => {
    if (formId) {
      console.log('🚀 Component mounted, fetching data for formId:', formId);

      const initializeData = async () => {
        await fetchFormStructure();
        await fetchSubmissions();
      };

      initializeData();
    } else {
      console.warn('⚠️ No formId available');
      setLoading(false);
    }
  }, [formId, fetchFormStructure, fetchSubmissions]);

  useEffect(() => {
    if (formId && formStructure) {
      fetchSubmissions();
    }
  }, [
    formId,
    searchTerm,
    statusFilter,
    readFilter,
    fetchSubmissions,
    formStructure,
  ]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  const fieldNames = getAllFieldNames();

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Form Submissions</h1>
          <p className='text-gray-600 mt-1'>
            Manage and view all form submissions
          </p>
        </div>
        <Button
          onClick={handleDownloadCsv}
          disabled={downloadingCsv || submissions.length === 0}
          className='bg-[#102035] hover:bg-slate-700 font-semibold text-white flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed'
        >
          <Download className='w-4 h-4 mr-2' />
          {downloadingCsv ? 'Downloading...' : 'Download CSV'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-[#102035]'>
              {stats.total}
            </div>
            <p className='text-sm text-gray-600'>Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-orange-600'>
              {stats.unread}
            </div>
            <p className='text-sm text-gray-600'>Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-yellow-600'>
              {stats.pending}
            </div>
            <p className='text-sm text-gray-600'>Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-green-600'>
              {stats.processed}
            </div>
            <p className='text-sm text-gray-600'>Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-red-600'>
              {stats.failed}
            </div>
            <p className='text-sm text-gray-600'>Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className='mb-6'>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Search submissions...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent className='bg-[#102035] text-white'>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='processed'>Processed</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='failed'>Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder='Read Status' />
              </SelectTrigger>
              <SelectContent className='bg-[#102035] text-white'>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='read'>Read</SelectItem>
                <SelectItem value='unread'>Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='w-5 h-5' />
            Submissions ({stats.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <Calendar className='w-16 h-16 mx-auto' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No submissions yet
              </h3>
              <p className='text-gray-600'>
                Submissions will appear here once users start submitting your
                form.
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[180px]'>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4' />
                        Submission Date
                      </div>
                    </TableHead>
                    {fieldNames.slice(0, 3).map((fieldId, index) => {
                      const { label, icon } = getFieldDisplayInfo(fieldId);
                      return (
                        <TableHead key={`header-${fieldId}-${index}`}>
                          <div className='flex items-center gap-2'>
                            {icon}
                            {label}
                          </div>
                        </TableHead>
                      );
                    })}
                    <TableHead className='w-[100px]'>Status</TableHead>
                    <TableHead className='w-[80px]'>Read</TableHead>
                    <TableHead className='w-[80px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission, submissionIndex) => {
                    const extractedData = extractSubmissionData(
                      submission.data
                    );
                    return (
                      <TableRow
                        key={`submission-${submission.id}-${submissionIndex}`}
                        className={`${
                          !submission.isRead
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : ''
                        } hover:bg-gray-50 cursor-pointer`}
                        onClick={() => handleViewSubmission(submission)}
                      >
                        <TableCell>
                          <div>
                            <div className='font-medium text-sm'>
                              {formatDateTime(submission.submittedAt)}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {formatTimeAgo(submission.submittedAt)}
                            </div>
                          </div>
                        </TableCell>
                        {fieldNames.slice(0, 3).map((fieldId, fieldIndex) => (
                          <TableCell
                            key={`cell-${submission.id}-${fieldId}-${fieldIndex}`}
                            className='max-w-[200px]'
                          >
                            <div
                              className='truncate'
                              title={extractedData[fieldId] || 'N/A'}
                            >
                              {extractedData[fieldId] || 'N/A'}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell>
                          {getStatusBadge(submission.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleRead(
                                submission.id,
                                submission.isRead
                              );
                            }}
                            className='p-1'
                          >
                            {submission.isRead ? (
                              <Eye className='w-4 h-4 text-green-600' />
                            ) : (
                              <EyeOff className='w-4 h-4 text-gray-400' />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={e => {
                                e.stopPropagation();
                                confirmDelete(submission.id);
                              }}
                              className='p-1 text-red-600 hover:text-red-700 hover:bg-red-50'
                              title='Delete submission'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='p-1'
                                >
                                  <MoreHorizontal className='w-4 h-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align='end'
                                className='bg-[#102035] text-white'
                              >
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleViewSubmission(submission);
                                  }}
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleToggleRead(
                                      submission.id,
                                      submission.isRead
                                    );
                                  }}
                                >
                                  Mark as{' '}
                                  {submission.isRead ? 'Unread' : 'Read'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className='flex items-center justify-between mt-6'>
              <div className='text-sm text-gray-600'>
                Showing {(pagination.current - 1) * pagination.limit + 1} to{' '}
                {Math.min(
                  pagination.current * pagination.limit,
                  pagination.total
                )}{' '}
                of {pagination.total} submissions
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    fetchSubmissions(pagination.current - 1, pagination.limit)
                  }
                  disabled={pagination.current === 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    fetchSubmissions(pagination.current + 1, pagination.limit)
                  }
                  disabled={pagination.current === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className='max-w-6xl max-h-[85vh] overflow-y-auto bg-white'>
          <DialogHeader>
            <DialogTitle className='flex items-center justify-between'>
              <span>Submission Details</span>
              <Badge variant='outline' className='ml-2'>
                ID: {selectedSubmission?.id}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className='space-y-6'>
              {/* Submission Info */}
              <div className='grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Submitted At
                  </label>
                  <p className='text-sm'>
                    {formatDateTime(selectedSubmission.submittedAt)}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Status
                  </label>
                  <div className='mt-1'>
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
                {selectedSubmission.ipAddress && (
                  <div>
                    <label className='text-sm font-medium text-gray-600'>
                      IP Address
                    </label>
                    <p className='text-sm'>{selectedSubmission.ipAddress}</p>
                  </div>
                )}
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Read Status
                  </label>
                  <p className='text-sm'>
                    {selectedSubmission.isRead ? 'Read' : 'Unread'}
                  </p>
                </div>
              </div>

              {/* Submission Data */}
              <div>
                <h3 className='text-lg font-semibold mb-4'>Submission Data</h3>
                <div className='space-y-6'>
                  {Object.entries(selectedSubmission.data).length === 0 ? (
                    <p className='text-gray-500 italic'>No data submitted</p>
                  ) : (
                    Object.entries(selectedSubmission.data).map(
                      ([fieldId, value], index) => (
                        <div key={`field-${fieldId}-${index}`}>
                          {renderFieldValue(fieldId, value)}
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* File Statistics */}
              {Object.values(selectedSubmission.data).some(value =>
                isFileField(value)
              ) && (
                <div className='bg-blue-50 rounded-lg p-4'>
                  <h4 className='font-medium text-blue-900 mb-2'>
                    File Summary
                  </h4>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-blue-700'>Total Files:</span>
                      <span className='ml-2 font-medium'>
                        {Object.values(selectedSubmission.data).reduce(
                          (count, value) => {
                            if (!isFileField(value)) return count;
                            return (
                              count + (Array.isArray(value) ? value.length : 1)
                            );
                          },
                          0
                        )}
                      </span>
                    </div>
                    <div>
                      <span className='text-blue-700'>Total Size:</span>
                      <span className='ml-2 font-medium'>
                        {formatFileSize(
                          Object.values(selectedSubmission.data).reduce(
                            (size, value) => {
                              if (!isFileField(value)) return size;
                              if (Array.isArray(value)) {
                                return (
                                  size +
                                  value.reduce(
                                    (s, file) => s + (file.size || 0),
                                    0
                                  )
                                );
                              }
                              return size + (value.size || 0);
                            },
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div className='flex justify-between items-center pt-4 border-t'>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() =>
                      handleToggleRead(
                        selectedSubmission.id,
                        selectedSubmission.isRead
                      )
                    }
                  >
                    Mark as {selectedSubmission.isRead ? 'Unread' : 'Read'}
                  </Button>

                  {/* Download All Files Button */}
                  {Object.values(selectedSubmission.data).some(value =>
                    isFileField(value)
                  ) && (
                    <Button
                      variant='outline'
                      onClick={async () => {
                        try {
                          // Collect all files from submission
                          const allFiles: any[] = [];
                          Object.values(selectedSubmission.data).forEach(
                            value => {
                              if (isFileField(value)) {
                                if (Array.isArray(value)) {
                                  allFiles.push(...value);
                                } else {
                                  allFiles.push(value);
                                }
                              }
                            }
                          );

                          // Download each file
                          for (const file of allFiles) {
                            const response = await fetch(file.url);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.originalName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);

                            // Small delay between downloads
                            await new Promise(resolve =>
                              setTimeout(resolve, 500)
                            );
                          }

                          toast.success(`Downloaded ${allFiles.length} files`);
                        } catch {
                          toast.error('Failed to download files');
                        }
                      }}
                      className='bg-blue-500 hover:bg-blue-600 text-white'
                    >
                      <Download className='w-4 h-4 mr-2' />
                      Download All Files
                    </Button>
                  )}
                </div>
                <Button
                  variant='destructive'
                  onClick={() => confirmDelete(selectedSubmission.id)}
                  className='bg-red-600 hover:bg-red-700'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete Submission
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Submission Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='bg-white text-gray-900'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this submission? This action
              cannot be undone. The submission data and all associated files
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSubmissionToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (submissionToDelete) {
                  handleDeleteSubmission(submissionToDelete);
                }
              }}
              disabled={deleting}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {deleting ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete Submission
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormSubmissionsPage;
