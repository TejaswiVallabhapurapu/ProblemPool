import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="relative bg-[#141414] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{getHeading()}</h3>
            {contentTitle && (
              <p className="text-xs text-neutral-400 line-clamp-1 max-w-[240px] mt-0.5">
                {contentTitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Success Banner */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <h4 className="text-base font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Thank you for keeping ProblemPool safe and constructive. Our moderation team will review this promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-2">
                Why are you reporting this? <span className="text-red-400">*</span>
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                      reason === r
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 hover:bg-white/[0.08] text-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-white w-3.5 h-3.5"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                Additional Details <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context to help our moderators..."
                maxLength={500}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:border-white/30 text-white placeholder-neutral-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
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
