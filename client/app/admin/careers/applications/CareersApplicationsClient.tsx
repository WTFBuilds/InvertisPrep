'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { careerApi } from '@/lib/api';
import { toast } from 'sonner';
import type { CareerApplication, CareerApplicationStatus, CareerDomain } from '@/types';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  Loader2,
  X,
  Check,
  Clock,
  Award,
  UserX,
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Target,
  Shield,
  Heart,
  Users,
  User,
  PenTool,
  Clapperboard,
  Headphones,
  Code2,
  Terminal,
  Megaphone,
  TrendingUp,
  Palette,
} from 'lucide-react';

const STATUSES: { value: CareerApplicationStatus; label: string; color: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  { value: 'under_review', label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Target },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Award },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: UserX },
  { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800 border-green-200', icon: Check },
];

const DOMAINS: CareerDomain[] = [
  'Canva designer',
  'Video Editor',
  'Support and Resource Team (SRT)',
  'Developers',
  'Content writer',
  'Technical support',
  'Social media manager',
  'Marketing',
];

const domainConfigs: Record<CareerDomain, { icon: React.ComponentType<{ className?: string }>; label: string; accentColor: string; borderColor: string }> = {
  'Canva designer': { icon: Palette, label: 'Canva Designer', accentColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'Video Editor': { icon: Clapperboard, label: 'Video Editor', accentColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'Support and Resource Team (SRT)': { icon: Headphones, label: 'SRT', accentColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'Developers': { icon: Code2, label: 'Developers', accentColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  'Content writer': { icon: PenTool, label: 'Content Writer', accentColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'Technical support': { icon: Terminal, label: 'Technical Support', accentColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  'Social media manager': { icon: Megaphone, label: 'Social Media', accentColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  'Marketing': { icon: TrendingUp, label: 'Marketing', accentColor: 'bg-amber-50', borderColor: 'border-amber-200' },
};

const getDomainConfig = (domain: CareerDomain) => {
  return domainConfigs[domain] || { icon: Briefcase, label: domain, accentColor: 'bg-gray-50', borderColor: 'border-gray-200' };
};

function DomainBadge({ domain }: { domain: CareerDomain }) {
  const config = getDomainConfig(domain);
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.borderColor} ${config.accentColor} text-gray-700`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: CareerApplicationStatus }) {
  const config = STATUSES.find(s => s.value === status) || STATUSES[0];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CareersApplicationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const hasManagePermission = hasPermission(user, 'careers.manage');

  // State
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ byStatus: Record<CareerApplicationStatus, number>; byDomain: Record<string, number>; recentWeek: number; total: number } | null>(null);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters — search is debounced so typing doesn't fire a request per keystroke
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<CareerApplicationStatus | ''>(searchParams.get('status') as CareerApplicationStatus || '');
  const [domainFilter, setDomainFilter] = useState<CareerDomain | ''>(searchParams.get('domain') as CareerDomain || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  // UI State
  const [selectedApp, setSelectedApp] = useState<CareerApplication | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Commit the debounced search value and rewind to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setMeta(p => (p.page === 1 ? p : { ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch functions
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await careerApi.list({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        domain: domainFilter || undefined,
        sortBy,
        sortOrder,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (response.success && response.data) {
        setApplications(response.data);
        setMeta(prev => ({ ...prev, total: response.meta.total, totalPages: response.meta.totalPages }));
      }
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, statusFilter, domainFilter, sortBy, sortOrder, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await careerApi.stats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial load + refetch on any query change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (domainFilter) params.set('domain', domainFilter);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    router.replace(`/admin/careers/applications?${params.toString()}`, { scroll: false });
  }, [search, statusFilter, domainFilter, sortBy, sortOrder, dateFrom, dateTo, router]);

  const handleStatusChange = async (id: string, newStatus: CareerApplicationStatus) => {
    if (!hasManagePermission) return;
    setUpdatingId(id);
    try {
      const response = await careerApi.update(id, { status: newStatus });
      if (response.success) {
        toast.success(`Status updated to ${STATUSES.find(s => s.value === newStatus)?.label}`);
        fetchApplications();
        fetchStats();
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNotesChange = async (id: string, reviewNotes: string) => {
    if (!hasManagePermission) return;
    try {
      await careerApi.update(id, { reviewNotes });
      toast.success('Notes saved');
      fetchApplications();
    } catch {
      toast.error('Failed to save notes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasManagePermission) return;
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      const response = await careerApi.delete(id);
      if (response.success) {
        toast.success('Application deleted');
        fetchApplications();
        fetchStats();
      }
    } catch {
      toast.error('Failed to delete application');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetail = async (app: CareerApplication) => {
    setDetailLoading(true);
    try {
      const response = await careerApi.get(app._id);
      if (response.success && response.data) {
        setSelectedApp(response.data);
      }
    } catch {
      toast.error('Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const hasActiveFilters = Boolean(statusFilter || domainFilter || dateFrom || dateTo);

  const resetPage = () => setMeta(p => (p.page === 1 ? p : { ...p, page: 1 }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      {/* Header — breadcrumb chrome comes from the admin layout */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium text-gray-900">Career Applications</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">View and manage career applications for InvertisPrep</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label="Total" value={stats.total} icon={FileText} color="text-gray-900 bg-gray-100" />
          <StatCard label="This Week" value={stats.recentWeek} icon={Clock} color="text-blue-600 bg-blue-50" />
          <StatCard label="Pending" value={stats.byStatus.pending || 0} icon={Clock} color="text-yellow-600 bg-yellow-50" />
          <StatCard label="Under Review" value={stats.byStatus.under_review || 0} icon={Target} color="text-blue-600 bg-blue-50" />
          <StatCard label="Shortlisted" value={stats.byStatus.shortlisted || 0} icon={Award} color="text-purple-600 bg-purple-50" />
          <StatCard label="Hired" value={stats.byStatus.hired || 0} icon={Check} color="text-green-600 bg-green-50" />
        </div>
      )}

      {/* Filters & Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 lg:flex-1">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, email, domain..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                hasActiveFilters ? 'bg-gray-100 border-gray-400 text-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                resetPage();
              }}
              options={[
                { value: 'createdAt', label: 'Sort by Date' },
                { value: 'fullName', label: 'Sort by Name' },
                { value: 'appliedDomain', label: 'Sort by Domain' },
                { value: 'status', label: 'Sort by Status' },
              ]}
              className="w-full sm:w-44"
            />
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`shrink-0 p-2 border rounded-md transition-colors ${sortOrder === 'asc' ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
              aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CareerApplicationStatus);
                resetPage();
              }}
              options={[{ value: '', label: 'All Statuses' }, ...STATUSES.map(s => ({ value: s.value, label: s.label }))]}
            />
            <Select
              label="Domain"
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value as CareerDomain);
                resetPage();
              }}
              options={[{ value: '', label: 'All Domains' }, ...DOMAINS.map(d => ({ value: d, label: getDomainConfig(d).label }))]}
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  resetPage();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  resetPage();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setDomainFilter('');
                  setDateFrom('');
                  setDateTo('');
                  setSearchInput('');
                  setSearch('');
                  resetPage();
                }}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Applications */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : applications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Applied</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{app.fullName}</p>
                          <p className="text-sm text-gray-500 break-all">{app.email}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" /> {app.whatsappNumber}
                          </p>
                          {/* Domain lives in its own column at lg+; inline here so it isn't lost at md */}
                          <div className="mt-1.5 lg:hidden">
                            <DomainBadge domain={app.appliedDomain} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <DomainBadge domain={app.appliedDomain} />
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">
                        {app.currentSemester}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-4 hidden xl:table-cell text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(app)}
                            disabled={detailLoading}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                            title="View Details"
                            aria-label="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasManagePermission && (
                            <>
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app._id, e.target.value as CareerApplicationStatus)}
                                disabled={updatingId === app._id}
                                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black max-w-32"
                              >
                                {STATUSES.map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDelete(app._id)}
                                disabled={deletingId === app._id}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                title="Delete"
                                aria-label="Delete"
                              >
                                {deletingId === app._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {applications.map((app) => (
                <div key={app._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{app.fullName}</p>
                      <p className="text-sm text-gray-500 break-all">{app.email}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 shrink-0" /> {app.whatsappNumber}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <DomainBadge domain={app.appliedDomain} />
                    <span className="text-xs text-gray-400">Sem {app.currentSemester}</span>
                  </div>
                  <p className="text-xs text-gray-400">Applied {formatDate(app.createdAt)}</p>
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => handleViewDetail(app)}
                      disabled={detailLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    {hasManagePermission && (
                      <>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value as CareerApplicationStatus)}
                          disabled={updatingId === app._id}
                          className="px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black flex-1 min-w-0"
                        >
                          {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(app._id)}
                          disabled={deletingId === app._id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          aria-label="Delete"
                        >
                          {deletingId === app._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600 order-2 sm:order-1">
                  Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setMeta(p => ({ ...p, page: p.page - 1 }))}
                    disabled={meta.page === 1 || loading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500 tabular-nums px-1">
                    {meta.page} / {meta.totalPages}
                  </span>
                  <button
                    onClick={() => setMeta(p => ({ ...p, page: p.page + 1 }))}
                    disabled={meta.page === meta.totalPages || loading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          updatingId={updatingId}
          hasManagePermission={hasManagePermission}
        />
      )}
    </div>
  );
}

// --- Components ---

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-medium text-gray-900 mt-1 tabular-nums">{value}</p>
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, className = '' }: { label?: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
            <div className="w-32 h-6 bg-gray-200 rounded" />
            <div className="w-24 h-6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center px-4">
      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
      <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
    </div>
  );
}

function ApplicationDetailModal({
  application,
  onClose,
  onStatusChange,
  onNotesChange,
  updatingId,
  hasManagePermission,
}: {
  application: CareerApplication;
  onClose: () => void;
  onStatusChange: (id: string, status: CareerApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  updatingId: string | null;
  hasManagePermission: boolean;
}) {
  const [notes, setNotes] = useState(application.reviewNotes || '');
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const statusConfig = STATUSES.find(s => s.value === application.status) || STATUSES[0];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-medium text-gray-900 break-words">{application.fullName}</h2>
            <p className="text-sm text-gray-500 mt-1 break-all">{application.email}</p>
            <div className="mt-2">
              <DomainBadge domain={application.appliedDomain} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Review Notes
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'details' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Status Selector */}
              {hasManagePermission && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color.split(' ').find(c => c.startsWith('text-')) || 'text-gray-500'}`} />
                    <span className="font-medium text-gray-900 text-sm">Current Status:</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <select
                    value={application.status}
                    onChange={(e) => onStatusChange(application._id, e.target.value as CareerApplicationStatus)}
                    disabled={updatingId === application._id}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white sm:max-w-44"
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Personal Info */}
                <DetailSection title="Personal Information" icon={User}>
                  <DetailRow label="Full Name" value={application.fullName} />
                  <DetailRow label="Email" value={application.email} icon={Mail} />
                  <DetailRow label="WhatsApp" value={application.whatsappNumber} icon={Phone} />
                  <DetailRow label="Department/Branch" value={application.departmentBranch} icon={Briefcase} />
                  <DetailRow label="Current Semester" value={application.currentSemester} />
                  <DetailRow label="Location" value={application.currentLocation === 'Other' ? (application.customLocation || '—') : application.currentLocation} icon={MapPin} />
                </DetailSection>

                {/* Application Info */}
                <DetailSection title="Application Details" icon={Target}>
                  <DetailRow label="Hybrid Work" value={application.hybridComfortable ? 'Yes, comfortable' : 'No, remote only'} />
                  <DetailRow label="Proficiency" value={application.proficiencyLevel} />
                  <DetailRow label="Has Projects" value={application.hasProjects ? 'Yes' : 'No'} />
                  <DetailRow label="Availability" value={application.availability} />
                  <DetailRow label="Heard From" value={application.heardFrom === 'Other' ? (application.customHeardFrom || '—') : application.heardFrom} />
                </DetailSection>

                {/* Interest Reason */}
                <DetailSection title="Interest Reason" icon={Heart} fullWidth>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">{application.interestReason}</p>
                </DetailSection>

                {/* Skills */}
                <DetailSection title="Skills & Experience" icon={Shield} fullWidth>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Skills</p>
                      <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap break-words">{application.skills}</p>
                    </div>
                    {application.hasProjects && application.projectDescription && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Project Description</p>
                        <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap break-words">{application.projectDescription}</p>
                      </div>
                    )}
                  </div>
                </DetailSection>

                {/* Links */}
                <DetailSection title="Links" icon={FileText} fullWidth>
                  <div className="space-y-3">
                    <DetailLink label="Resume (Google Drive)" url={application.resumeLink} icon={FileText} />
                    {application.portfolioLink && (
                      <DetailLink label="Portfolio / LinkedIn / GitHub" url={application.portfolioLink} icon={Users} />
                    )}
                  </div>
                </DetailSection>

                {/* Metadata */}
                <DetailSection title="Metadata" icon={Clock} fullWidth>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    <DetailRow label="Applied On" value={new Date(application.createdAt).toLocaleString('en-IN')} />
                    {application.submittedBy && (
                      <DetailRow label="Linked Account" value={`${application.submittedBy.name} (${application.submittedBy.studentId || 'No Student ID'})`} />
                    )}
                    {application.reviewedBy && (
                      <DetailRow label="Reviewed By" value={`${application.reviewedBy.name} • ${new Date(application.reviewedAt!).toLocaleString('en-IN')}`} />
                    )}
                  </div>
                </DetailSection>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-900">Review Notes (internal)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => hasManagePermission && onNotesChange(application._id, notes)}
                disabled={!hasManagePermission}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black resize-y disabled:bg-gray-50"
                placeholder={hasManagePermission ? "Add internal review notes..." : "Notes can only be added by users with manage permission"}
              />
              <p className="text-xs text-gray-500">Notes are saved automatically when you click outside. Only visible to admin team.</p>
              {application.reviewNotes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Previous Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{application.reviewNotes}</p>
                  {application.reviewedBy && (
                    <p className="text-xs text-gray-500 mt-2">By {application.reviewedBy.name} on {new Date(application.reviewedAt!).toLocaleString('en-IN')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, icon: Icon, children, fullWidth = false }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`p-4 bg-gray-50 rounded-xl ${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
        <Icon className="w-4 h-4 text-gray-500 shrink-0" />
        {title}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3 mb-3 last:mb-0">
      {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

function DetailLink({ label, url, icon: Icon }: { label: string; url: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 break-all">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span>{label}</span>
    </a>
  );
}
