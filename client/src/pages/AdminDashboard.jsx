import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Users,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Flag,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  Trash2,
  UserX,
  UserCheck,
  Check,
  X,
  ExternalLink,
  Clock,
  ChevronRight,
  AlertOctagon,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassAiButton from '../components/GlassAiButton';
import ParticlesBackground from '../components/ParticlesBackground';
import {
  getAdminStats,
  getAdminReports,
  updateReportStatus,
  removeReportedContent,
  getAdminUsers,
  toggleUserSuspension,
} from '../services/api';

const STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Reviewed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Dismissed: 'bg-slate-100 text-slate-700 border-slate-200',
  Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const AdminDashboard = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('reports'); // 'overview' | 'reports' | 'users'
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportFilterStatus, setReportFilterStatus] = useState('All');
  const [reportFilterType, setReportFilterType] = useState('All');
  const [reportFilterReason, setReportFilterReason] = useState('All');
  const [reportPage, setReportPage] = useState(1);
  const [totalReportCount, setTotalReportCount] = useState(0);

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilterStatus, setUserFilterStatus] = useState('All');
  const [userFilterRole, setUserFilterRole] = useState('All');

  // Modals & Action states
  const [selectedReport, setSelectedReport] = useState(null);
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [removeContentModal, setRemoveContentModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isAdmin = Boolean(user && user.role === 'admin');

  // Fetch stats
  const fetchStats = async () => {
    if (!token || !isAdmin) return;
    setStatsLoading(true);
    try {
      const res = await getAdminStats(token);
      if (res && res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    if (!token || !isAdmin) return;
    setReportsLoading(true);
    try {
      const res = await getAdminReports(
        {
          status: reportFilterStatus,
          contentType: reportFilterType,
          reason: reportFilterReason,
          page: reportPage,
          limit: 30,
        },
        token
      );
      if (res && res.success) {
        setReports(res.reports || []);
        setTotalReportCount(res.totalCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    if (!token || !isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await getAdminUsers(
        {
          search: userSearch,
          status: userFilterStatus,
          role: userFilterRole,
          limit: 50,
        },
        token
      );
      if (res && res.success) {
        setUsersList(res.users || []);
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && token) {
      fetchStats();
      fetchReports();
    }
  }, [isAdmin, token]);

  useEffect(() => {
    if (isAdmin && token) {
      fetchReports();
    }
  }, [reportFilterStatus, reportFilterType, reportFilterReason, reportPage]);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin && token) {
      fetchUsers();
    }
  }, [activeTab, userFilterStatus, userFilterRole]);

  // Handle report status change (Reviewed, Dismissed, Resolved)
  const handleUpdateStatus = async (reportId, newStatus) => {
    setActionLoading(true);
    try {
      const res = await updateReportStatus(reportId, { status: newStatus }, token);
      if (res && res.success) {
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
        );
        showToast(`Report marked as ${newStatus}`);
        fetchStats();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update report status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle permanent content removal
  const handleRemoveContent = async () => {
    if (!removeContentModal || !token) return;
    setActionLoading(true);
    try {
      const res = await removeReportedContent(removeContentModal._id, token);
      if (res && res.success) {
        showToast('Reported content removed and related reports resolved');
        setRemoveContentModal(null);
        fetchReports();
        fetchStats();
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove content');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle user suspension toggle
  const handleToggleSuspend = async () => {
    if (!suspendModalUser || !token) return;
    setActionLoading(true);
    const nextState = !suspendModalUser.isSuspended;

    try {
      const res = await toggleUserSuspension(
        suspendModalUser._id,
        {
          isSuspended: nextState,
          reason: suspendReason || 'Violation of community moderation guidelines',
        },
        token
      );

      if (res && res.success) {
        showToast(`User ${nextState ? 'suspended' : 'unsuspended'} successfully`);
        setSuspendModalUser(null);
        setSuspendReason('');
        fetchReports();
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update suspension status');
    } finally {
      setActionLoading(false);
    }
  };

  // Non-admin guard view
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          You must be signed in with an authorized <span className="font-semibold text-slate-900">Administrator</span> account to access the ProblemPool Moderation Dashboard.
        </p>
        <GlassAiButton
          to="/dashboard"
          variant="dark"
          size="md"
        >
          Return to Dashboard
        </GlassAiButton>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
            <span>Admin Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>🛡️ Moderation Dashboard</span>
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Review community reports, moderate content, and manage user suspensions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchStats();
            if (activeTab === 'reports') fetchReports();
            if (activeTab === 'users') fetchUsers();
          }}
          className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto cursor-pointer"
          title="Refresh dashboard"
        >
          <RefreshCw
            className={`w-4 h-4 ${reportsLoading || statsLoading || usersLoading ? 'animate-spin text-indigo-600' : ''}`}
          />
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Users</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Problems</span>
            <HelpCircle className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.totalProblems || 0}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Answers</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.totalAnswers || 0}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solved</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.solvedProblems || 0}</p>
        </div>

        <div className="bg-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending</span>
            <Flag className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-900">{stats?.pendingReports || 0}</p>
        </div>

        <div className="bg-rose-50/50 p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Suspended</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-900">{stats?.suspendedUsers || 0}</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Moderation Reports</span>
          {stats?.pendingReports > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
              {stats.pendingReports} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
          {stats?.suspendedUsers > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800">
              {stats.suspendedUsers} suspended
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MODERATION REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={reportFilterStatus}
                  onChange={(e) => setReportFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>

              {/* Content Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Type:</span>
                <select
                  value={reportFilterType}
                  onChange={(e) => setReportFilterType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Problem">Problem</option>
                  <option value="Answer">Answer</option>
                  <option value="Review">Review</option>
                  <option value="User">User Profile</option>
                </select>
              </div>

              {/* Reason Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Reason:</span>
                <select
                  value={reportFilterReason}
                  onChange={(e) => setReportFilterReason(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Reasons</option>
                  <option value="Spam">Spam</option>
                  <option value="Duplicate">Duplicate</option>
                  <option value="Offensive content">Offensive content</option>
                  <option value="Incorrect/inappropriate content">Incorrect/inappropriate content</option>
                  <option value="Personal information">Personal information</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <span className="text-slate-400 font-medium">
              Showing {reports.length} of {totalReportCount} reports
            </span>
          </div>

          {/* Reports Table / List */}
          {reportsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Queue is Clear</h3>
              <p className="text-xs text-slate-500">
                No reports matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 font-bold text-slate-700">
                      <th className="py-3.5 px-4">Reporter</th>
                      <th className="py-3.5 px-4">Reported Content / Target</th>
                      <th className="py-3.5 px-4">Reason & Details</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((rep) => {
                      const statusClass = STATUS_COLORS[rep.status] || STATUS_COLORS.Pending;
                      const targetAuthor = rep.targetAuthor;

                      return (
                        <tr key={rep._id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Reporter */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-bold text-slate-900">
                              {rep.reportedBy?.name || 'Anonymous'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {rep.reportedBy?.email}
                            </div>
                          </td>

                          {/* Reported Content Preview */}
                          <td className="py-4 px-4 align-top max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                {rep.contentType}
                              </span>
                              {rep.isContentDeleted && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Deleted
                                </span>
                              )}
                            </div>

                            {rep.contentDetails ? (
                              <div>
                                {rep.contentDetails.title && (
                                  <p className="font-bold text-slate-900 line-clamp-1 mb-0.5">
                                    {rep.contentDetails.title}
                                  </p>
                                )}
                                {rep.contentDetails.snippet && (
                                  <p className="text-slate-600 line-clamp-2 text-[11px] mb-1">
                                    "{rep.contentDetails.snippet}"
                                  </p>
                                )}
                                {rep.contentDetails.url && !rep.isContentDeleted && (
                                  <a
                                    href={rep.contentDetails.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                                  >
                                    <span>View target</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Content unavailable</span>
                            )}

                            {targetAuthor && (
                              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span>Author:</span>
                                <span className="font-semibold text-slate-700">
                                  {targetAuthor.name}
                                </span>
                                {targetAuthor.isSuspended && (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                                    Suspended
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Reason */}
                          <td className="py-4 px-4 align-top max-w-xs">
                            <div className="font-bold text-rose-700 mb-0.5">{rep.reason}</div>
                            {rep.description ? (
                              <p className="text-slate-600 line-clamp-2 text-[11px]">
                                {rep.description}
                              </p>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                No description provided
                              </span>
                            )}
                            {rep.actionTaken && (
                              <div className="mt-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 p-1 rounded">
                                Action: {rep.actionTaken}
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 align-top whitespace-nowrap text-slate-500">
                            {new Date(rep.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusClass}`}
                            >
                              {rep.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Resolve Button */}
                              {rep.status !== 'Resolved' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(rep._id, 'Resolved')}
                                  title="Mark as Resolved"
                                  className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Dismiss Button */}
                              {rep.status !== 'Dismissed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(rep._id, 'Dismissed')}
                                  title="Dismiss Report"
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Remove Content Button */}
                              {!rep.isContentDeleted && rep.contentType !== 'user' && (
                                <button
                                  type="button"
                                  onClick={() => setRemoveContentModal(rep)}
                                  title="Delete reported content permanently"
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Suspend Target User Button */}
                              {targetAuthor && targetAuthor._id !== user._id && (
                                <button
                                  type="button"
                                  onClick={() => setSuspendModalUser(targetAuthor)}
                                  title={
                                    targetAuthor.isSuspended
                                      ? 'Unsuspend author'
                                      : 'Suspend author'
                                  }
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    targetAuthor.isSuspended
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  }`}
                                >
                                  {targetAuthor.isSuspended ? (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchUsers();
                }}
                placeholder="Search by name, email, username..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={userFilterStatus}
                  onChange={(e) => setUserFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Users</option>
                  <option value="Active">Active Only</option>
                  <option value="Suspended">Suspended Only</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Role:</span>
                <select
                  value={userFilterRole}
                  onChange={(e) => setUserFilterRole(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading users...</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 font-bold text-slate-700">
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Reputation</th>
                      <th className="py-3.5 px-4">Problems / Answers</th>
                      <th className="py-3.5 px-4">Joined</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => {
                      const isSelf = u._id === user._id;

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {u.role || 'user'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {u.reputation || 0} pts
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            <span>{u.problemsCount || 0} probs</span> •{' '}
                            <span>{u.answersCount || 0} answers</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-3.5 px-4">
                            {u.isSuspended ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                🚫 Suspended
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✅ Active
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {!isSelf ? (
                              <GlassAiButton
                                type="button"
                                onClick={() => setSuspendModalUser(u)}
                                variant={u.isSuspended ? "success" : "danger"}
                                size="xs"
                              >
                                {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                              </GlassAiButton>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Current user</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove Content Confirmation Modal */}
      {removeContentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Delete Reported {removeContentModal.contentType}?
            </h3>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              This will permanently delete this {removeContentModal.contentType} and its associated replies, votes, and activity. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <GlassAiButton
                type="button"
                onClick={() => setRemoveContentModal(null)}
                variant="glass"
                size="sm"
              >
                Cancel
              </GlassAiButton>
              <GlassAiButton
                type="button"
                onClick={handleRemoveContent}
                disabled={actionLoading}
                loading={actionLoading}
                variant="danger"
                size="sm"
                icon={Trash2}
              >
                Yes, Delete Content
              </GlassAiButton>
            </div>
          </div>
        </div>
      )}

      {/* User Suspension Modal */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <UserX className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {suspendModalUser.isSuspended
                ? `Unsuspend "${suspendModalUser.name}"?`
                : `Suspend "${suspendModalUser.name}"?`}
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {suspendModalUser.isSuspended
                ? 'Unsuspending will restore the user’s ability to post, answer, review, and participate in ProblemPool.'
                : 'Suspended users cannot post problems, answer questions, write reviews, or submit votes. Their existing contributions remain intact.'}
            </p>

            {!suspendModalUser.isSuspended && (
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Reason for Suspension
                </label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Repeated spamming, offensive language..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-900"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <GlassAiButton
                type="button"
                onClick={() => setSuspendModalUser(null)}
                variant="glass"
                size="sm"
              >
                Cancel
              </GlassAiButton>
              <GlassAiButton
                type="button"
                onClick={handleToggleSuspend}
                disabled={actionLoading}
                loading={actionLoading}
                variant={suspendModalUser.isSuspended ? 'success' : 'danger'}
                size="sm"
                icon={suspendModalUser.isSuspended ? UserCheck : UserX}
              >
                {suspendModalUser.isSuspended ? 'Yes, Unsuspend User' : 'Yes, Suspend User'}
              </GlassAiButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
