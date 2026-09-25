import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { submitReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassAiButton from './GlassAiButton';

const REPORT_REASONS = [
  'Spam',
  'Duplicate',
  'Offensive content',
  'Incorrect/inappropriate content',
  'Personal information',
  'Other',
];

const ReportModal = ({
  isOpen,
  onClose,
  contentType, // 'problem' | 'answer' | 'review' | 'user'
  contentId,
  contentTitle = '',
}) => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!contentType || !contentId || !reason) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitReport(
        {
          contentType,
          contentId,
          reason,
          description: description.trim(),
        },
        token
      );

      if (res && res.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setDescription('');
          onClose();
        }, 2200);
      } else {
        setError(res?.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unable to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const getHeading = () => {
    switch (contentType) {
      case 'problem':
        return 'Report Problem';
      case 'answer':
        return 'Report Answer';
      case 'review':
        return 'Report Review';
      case 'user':
        return 'Report User Profile';
      default:
        return 'Report Content';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Flag className="w-5 h-5 fill-rose-600 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{getHeading()}</h3>
              {contentTitle && (
                <p className="text-xs text-slate-500 line-clamp-1 max-w-[240px]">
                  {contentTitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Report Submitted</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thank you for keeping ProblemPool safe and constructive. Our moderation team will review this promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                Why are you reporting this? <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                      reason === r
                        ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 ring-1 ring-indigo-200'
                        : 'bg-slate-50/40 border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Additional Details <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context to help our moderators..."
                maxLength={500}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-900 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <GlassAiButton
                type="button"
                onClick={onClose}
                variant="glass"
                size="sm"
              >
                Cancel
              </GlassAiButton>
              <GlassAiButton
                type="submit"
                disabled={submitting}
                loading={submitting}
                variant="danger"
                size="sm"
                icon={ShieldAlert}
              >
                Submit Report
              </GlassAiButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
