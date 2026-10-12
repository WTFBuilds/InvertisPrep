'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { bugApi } from '@/lib/api';
import { TicketThread } from '@/components/admin/ticket-thread';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { 
  Bug, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  AlertTriangle,
  Play,
  Monitor,
  Cpu,
  Mail,
  User,
  Filter
} from 'lucide-react';

export default function AdminBugsPage() {
  const router = useRouter();
  const { user } = useAuth();
  // SRT can view bug reports but cannot change status or delete
  const canModify = hasPermission(user, 'bugs.manage');
  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [statusFilter, setStatusFilter] = useState<'pending' | 'active' | 'resolved' | 'dismissed' | 'all'>('pending');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const fetchBugs = async () => {
    try {
      setLoading(true);
      setError('');
      const statVal = statusFilter === 'all' ? undefined : statusFilter;
      const sevVal = severityFilter === 'all' ? undefined : severityFilter;
      
      const res = await bugApi.getAll(statVal, sevVal);
      setBugs(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bug reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [statusFilter, severityFilter]);

  const handleUpdateStatus = async (bugId: string, status: 'pending' | 'active' | 'resolved' | 'dismissed') => {
    try {
      const res = await bugApi.updateStatus(bugId, status);
      if (res.success) {
        setSuccess(`Bug status updated to ${status} successfully`);
        fetchBugs();
      } else {
        setError(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    if (!confirm('Are you sure you want to permanently delete this bug report?')) return;
    try {
      const res = await bugApi.delete(bugId);
      if (res.success) {
        setSuccess('Bug report deleted successfully');
        fetchBugs();
      } else {
        setError(res.message || 'Failed to delete bug report');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting bug report');
    }
  };

  const handleReply = async (bugId: string, body: string) => {
    const res = await bugApi.reply(bugId, body);
    if (res.success) {
      setSuccess('Reply sent to the reporter');
      fetchBugs();
    } else {
      setError(res.message || 'Failed to send reply');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low': 
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">Low</span>;
      case 'medium':
        return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">Medium</span>;
      case 'high':
        return <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">High</span>;
      case 'critical':
        return <span className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Critical</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">{severity}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return (
          <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">
            <Clock className="h-3.5 w-3.5" /> Pending
          </span>
        );
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            <Play className="h-3.5 w-3.5 fill-current" /> Active
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle className="h-3.5 w-3.5" /> Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
            <XCircle className="h-3.5 w-3.5" /> Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl min-h-screen bg-gray-50/50">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <Bug className="h-8 w-8 text-red-600" />
              Bug Reports Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track, organize, and resolve application bugs reported by users
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Notifications */}
        {error && (
          <Alert variant="destructive" className="mb-6 shadow-sm animate-fadeIn">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800 shadow-sm animate-fadeIn">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filter Controls Grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            {/* Status Tabs */}
            <div className="flex flex-wrap border-b border-gray-200 gap-2">
              {(['pending', 'active', 'resolved', 'dismissed', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setStatusFilter(filter);
                    setError('');
                    setSuccess('');
                  }}
                  className={`py-2 px-3.5 font-semibold text-sm border-b-2 transition-all capitalize -mb-[2px] cursor-pointer ${
                    statusFilter === filter
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Severity Select Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value as any);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm font-semibold border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-white cursor-pointer text-gray-700"
              >
                <option value="all">All Severities</option>
                <option value="low">Low Only</option>
                <option value="medium">Medium Only</option>
                <option value="high">High Only</option>
                <option value="critical">Critical Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bug Cards List */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mb-3" />
            <p className="text-gray-500 font-medium">Fetching bug reports...</p>
          </div>
        ) : bugs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Bug className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No bug reports found</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              There are no bug reports matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bugs.map((bug) => (
              <Card key={bug._id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{bug.title}</h3>
                      {getSeverityBadge(bug.severity)}
                      {getStatusBadge(bug.status)}
                    </div>
                    <p className="text-xs text-gray-400">
                      Reported {new Date(bug.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:self-center">
                    {canModify && (
                      <>
                    {bug.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(bug._id, 'active')}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                      >
                        <Play className="h-3 w-3 fill-current" /> Investigate
                      </Button>
                    )}
                    {(bug.status === 'pending' || bug.status === 'active') && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(bug._id, 'resolved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(bug._id, 'dismissed')}
                          className="border-gray-200 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5 text-gray-500" /> Dismiss
                        </Button>
                      </>
                    )}
                    {bug.status === 'dismissed' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(bug._id, 'pending')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1"
                      >
                        Re-open
                      </Button>
                    )}
                    {bug.status === 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(bug._id, 'pending')}
                        className="border-gray-200 hover:bg-gray-100 text-gray-700"
                      >
                        Re-open
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteBug(bug._id)}
                      className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 flex items-center gap-1 shadow-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Bug description */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Description</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {bug.description}
                    </p>
                  </div>

                  {/* Support thread + reply */}
                  <TicketThread
                    messages={bug.messages ?? []}
                    canReply={canModify}
                    onReply={async (body) => handleReply(bug._id, body)}
                    requesterName={bug.reportedBy?.name || 'Reporter'}
                  />

                  <hr className="border-gray-100" />

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* User Specs */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Reporter Details</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{bug.email}</span>
                        </div>
                        {bug.reportedBy && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>Logged-in User: <strong>{bug.reportedBy.name}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Browser Specs */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Browser Specs</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Monitor className="h-4 w-4 text-gray-400" />
                        <span>{bug.browser || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* OS Specs */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Device Specs</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Cpu className="h-4 w-4 text-gray-400" />
                        <span>{bug.device || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
