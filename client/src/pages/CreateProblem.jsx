import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProblem, checkSimilarProblems, improveProblemWithAI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { POPULAR_CATEGORIES } from '../components/CategoryFilter';
import MarkdownRenderer from '../components/MarkdownRenderer';
import MarkdownToolbar from '../components/MarkdownToolbar';
import GlassAiButton from '../components/GlassAiButton';
import ParticlesBackground from '../components/ParticlesBackground';
import { Loader } from '../components/Loader';
import { Tag, Plus, X, Sparkles, Search, ExternalLink, CheckCircle2, MessageSquare, AlertCircle, ChevronDown, ChevronUp, Wand2, Lightbulb, Check } from 'lucide-react';

const SUGGESTED_TAGS = [
  'React',
  'Node.js',
  'MongoDB',
  'JavaScript',
  'Python',
  'Java',
  'Express',
  'SQL',
  'DSA',
  'AI/ML',
  'Web Development',
  'Career',
];

const CreateProblem = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    allowTeamUp: false,
  });

  const [descTab, setDescTab] = useState('write');
  const descriptionTextareaRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Duplicate / Similar problems states
  const [similarProblems, setSimilarProblems] = useState([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const [dismissedSimilar, setDismissedSimilar] = useState(false);
  const lastCheckedTitle = useRef('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // AI Problem Assistant states
  const [improvingAi, setImprovingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [appliedFields, setAppliedFields] = useState({});

  const handleImproveWithAI = async () => {
    const titleVal = formData.title.trim();
    const descVal = formData.description.trim();

    if (!titleVal && !descVal) {
      setAiError('Please enter at least a rough title or description first so AI can assist you.');
      return;
    }

    setImprovingAi(true);
    setAiError(null);
    setAppliedFields({});

    try {
      const res = await improveProblemWithAI(
        {
          title: titleVal,
          description: descVal,
          category: formData.category,
          tags,
        },
        token
      );

      if (res?.success && res.suggestion) {
        setAiSuggestion(res.suggestion);
      } else {
        setAiError(res?.message || 'Unable to generate suggestions at this time.');
      }
    } catch (err) {
      setAiError(err.message || 'AI assistant request failed. Please check connection and try again.');
    } finally {
      setImprovingAi(false);
    }
  };

  const handleApplyTitle = () => {
    if (aiSuggestion?.improvedTitle) {
      setFormData((prev) => ({ ...prev, title: aiSuggestion.improvedTitle }));
      setAppliedFields((prev) => ({ ...prev, title: true }));
      if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: null }));
    }
  };

  const handleApplyDescription = () => {
    if (aiSuggestion?.improvedDescription) {
      setFormData((prev) => ({ ...prev, description: aiSuggestion.improvedDescription }));
      setAppliedFields((prev) => ({ ...prev, description: true }));
      if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: null }));
    }
  };

  const handleApplyTags = () => {
    if (aiSuggestion?.suggestedTags && Array.isArray(aiSuggestion.suggestedTags)) {
      const newTags = [...tags];
      aiSuggestion.suggestedTags.forEach((st) => {
        const clean = st.toLowerCase().trim();
        if (clean && !newTags.includes(clean) && newTags.length < 10) {
          newTags.push(clean);
        }
      });
      setTags(newTags);
      setAppliedFields((prev) => ({ ...prev, tags: true }));
    }
  };

  const handleApplyCategory = () => {
    if (aiSuggestion?.suggestedCategory) {
      setFormData((prev) => ({ ...prev, category: aiSuggestion.suggestedCategory }));
      setAppliedFields((prev) => ({ ...prev, category: true }));
      if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: null }));
    }
  };

  const handleApplyAll = () => {
    handleApplyTitle();
    handleApplyDescription();
    handleApplyTags();
    handleApplyCategory();
  };

  // Debounced search for similar problems as user types title
  useEffect(() => {
    const cleanTitle = formData.title.trim();

    if (cleanTitle.length < 4) {
      setSimilarProblems([]);
      setCheckingSimilar(false);
      return;
    }

    if (cleanTitle === lastCheckedTitle.current) return;

    setDismissedSimilar(false);
    setCheckingSimilar(true);

    const timer = setTimeout(async () => {
      try {
        const res = await checkSimilarProblems(
          {
            title: cleanTitle,
            description: formData.description,
            category: formData.category,
            tags,
          },
          token
        );
        lastCheckedTitle.current = cleanTitle;
        if (res?.success && Array.isArray(res.similarProblems)) {
          setSimilarProblems(res.similarProblems);
        } else {
          setSimilarProblems([]);
        }
      } catch (err) {
        console.warn('Duplicate check skipped:', err);
      } finally {
        setCheckingSimilar(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.title, formData.category, tags, token]);

  const handleManualCheckSimilar = async () => {
    const cleanTitle = formData.title.trim();
    if (!cleanTitle || cleanTitle.length < 3) return;
    setCheckingSimilar(true);
    setDismissedSimilar(false);
    try {
      const res = await checkSimilarProblems(
        {
          title: cleanTitle,
          description: formData.description,
          category: formData.category,
          tags,
        },
        token
      );
      if (res?.success && Array.isArray(res.similarProblems)) {
        setSimilarProblems(res.similarProblems);
      }
    } catch (err) {
      console.warn('Similar check failed:', err);
    } finally {
      setCheckingSimilar(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddTag = (rawTag) => {
    const clean = rawTag.trim().toLowerCase().replace(/[^a-z0-9+#.-]/g, '');
    if (!clean) return;
    if (clean.length > 30) return;
    if (tags.includes(clean)) return;
    if (tags.length >= 10) return;

    setTags((prev) => [...prev, clean]);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Problem title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 15) {
      errors.description = 'Description must be at least 15 characters long';
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required (e.g. city, district, or neighborhood)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await createProblem(
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          location: formData.location.trim(),
          tags,
          allowTeamUp: Boolean(formData.allowTeamUp),
        },
        token
      );
      // Successful creation: navigate to /problems
      navigate('/problems');
    } catch (err) {
      setError(err.message || 'Failed to post problem. Please verify connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = POPULAR_CATEGORIES.filter((c) => c !== 'All');

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Header */}
        <div className="mb-8">
        <Link
          to="/problems"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Problems</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Post a Problem
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Share a challenge, error, or question with the ProblemPool community.
            </p>
          </div>
          {user && (
            <div className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg self-start sm:self-auto font-medium">
              Posting as <span className="font-bold">{user.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <div className="font-semibold">Submission failed</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* AI Problem Assistant Banner / Action Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/40 border border-indigo-100/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>AI Problem Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Powered by AI
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Draft your question and let AI suggest an improved title, structured description, tags & category.
              </p>
            </div>
          </div>

          <GlassAiButton
            type="button"
            onClick={handleImproveWithAI}
            disabled={improvingAi || (!formData.title.trim() && !formData.description.trim())}
            loading={improvingAi}
            variant="primary"
            size="sm"
            icon={Sparkles}
          >
            {improvingAi ? 'Improving draft...' : '✨ Improve My Problem'}
          </GlassAiButton>
        </div>

        {/* AI Error Notification */}
        {aiError && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAiError(null)}
              className="text-amber-600 hover:text-amber-900 font-bold ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AI Suggestions Review & Action Box */}
        {aiSuggestion && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 border border-indigo-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">AI Improvement Suggestions</h4>
                  <p className="text-[11px] text-slate-500">
                    Review and click the buttons below to selectively apply what you like. Your original input is never changed automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <GlassAiButton
                  type="button"
                  onClick={handleApplyAll}
                  variant="primary"
                  size="xs"
                  icon={Check}
                >
                  Apply All
                </GlassAiButton>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition cursor-pointer"
                  title="Dismiss AI suggestions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Improved Title */}
              {aiSuggestion.improvedTitle && (
                <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span>Suggested Title</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyTitle}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        appliedFields.title
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      {appliedFields.title ? '✓ Applied' : 'Use Title'}
                    </button>
                  </div>
                  <p className="text-slate-900 font-semibold">{aiSuggestion.improvedTitle}</p>
                </div>
              )}

              {/* 2. Missing Information Questions */}
              {aiSuggestion.missingInformation && aiSuggestion.missingInformation.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80">
                  <div className="font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing Information / Questions to Consider Adding:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-800/90 pl-1">
                    {aiSuggestion.missingInformation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Suggested Category & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Category */}
                {aiSuggestion.suggestedCategory && (
                  <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Recommended Category</span>
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                        {aiSuggestion.suggestedCategory}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCategory}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        appliedFields.category
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      {appliedFields.category ? '✓ Applied' : 'Use Category'}
                    </button>
                  </div>
                )}

                {/* Tags */}
                {aiSuggestion.suggestedTags && aiSuggestion.suggestedTags.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-2xs flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-700">Suggested Tags</span>
                      <button
                        type="button"
                        onClick={handleApplyTags}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          appliedFields.tags
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                        }`}
                      >
                        {appliedFields.tags ? '✓ Applied' : 'Use Tags'}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {aiSuggestion.suggestedTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="px-2 py-0.5 rounded bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-[10px] font-semibold transition cursor-pointer"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Improved Description */}
              {aiSuggestion.improvedDescription && (
                <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span>Structured Description Template</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyDescription}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        appliedFields.description
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                      }`}
                    >
                      {appliedFields.description ? '✓ Applied' : 'Use Description'}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                    {aiSuggestion.improvedDescription}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Problem Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="title" className="block text-sm font-semibold text-slate-900">
                Problem Title <span className="text-rose-500">*</span>
              </label>
              {checkingSimilar && (
                <span className="text-xs text-indigo-600 font-medium flex items-center gap-2">
                  <Loader size="sm" />
                  <span>Checking for similar questions...</span>
                </span>
              )}
            </div>

            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., How to connect MongoDB Atlas with Express securely?"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.title
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/40 focus:bg-white'
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.title}</p>
            )}

            {/* Possible Similar Problems Suggestion Box */}
            {similarProblems.length > 0 && !dismissedSimilar && (
              <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-50/80 to-amber-50/30 border border-amber-200/90 shadow-xs animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <span className="text-base">🔎</span>
                    <span>Possible Similar Problems ({similarProblems.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedSimilar(true)}
                    className="text-xs text-amber-800/80 hover:text-amber-950 font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/70 hover:bg-amber-200/70 transition cursor-pointer"
                  >
                    <span>Dismiss</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-amber-800/90 mb-3.5 leading-relaxed">
                  We found existing community questions with similar titles or keywords. Checking them might give you an instant solution:
                </p>

                <div className="space-y-2.5 mb-3.5">
                  {similarProblems.map((sim) => {
                    const isSolved = sim.status === 'Solved' || Boolean(sim.bestAnswer);
                    const isAnswered = sim.status === 'Answered' || sim.answersCount > 0;

                    return (
                      <div
                        key={sim._id}
                        className="p-3.5 rounded-xl bg-white border border-amber-200/70 shadow-2xs hover:border-indigo-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSolved
                                  ? 'bg-amber-100 text-amber-800'
                                  : isAnswered
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isSolved ? '🏆 Solved' : isAnswered ? '💡 Answered' : '❓ Open'}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {sim.category || 'General'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-slate-400" />
                              <span>{sim.answersCount || 0} answers</span>
                            </span>
                          </div>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {sim.title}
                          </h5>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`/problems/${sim._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition"
                          >
                            <span>View Problem</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                  <span className="text-amber-800/80 font-medium">
                    Different problem? You can proceed with posting.
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissedSimilar(true)}
                    className="font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    Continue Posting →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 focus:outline-none transition-all cursor-pointer ${
                fieldErrors.category
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/40 focus:bg-white'
              }`}
            >
              <option value="">Select a category</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.category}</p>
            )}
          </div>

          {/* Tags Input with Chips */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Tags <span className="text-xs text-slate-400 font-normal">(Add up to 10 tags to help others find your problem)</span>
            </label>

            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/40 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-in fade-in zoom-in duration-100"
                >
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="p-0.5 text-indigo-400 hover:text-indigo-700 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {tags.length < 10 && (
                <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? 'Type a tag and press Enter...' : 'Add another tag...'}
                    className="w-full bg-transparent px-2 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {tagInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddTag(tagInput)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 shrink-0"
                    >
                      Add
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Popular Tag Suggestions */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Suggestions:</span>
              </span>
              {SUGGESTED_TAGS.filter((st) => !tags.includes(st.toLowerCase())).slice(0, 6).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddTag(st)}
                  className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                >
                  +{st}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Location / Context <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Global / Remote / Hyderabad, India"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.location
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/40 focus:bg-white'
              }`}
            />
            {fieldErrors.location && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.location}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="description" className="block text-sm font-semibold text-slate-900">
                Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 font-medium">Markdown & code blocks supported</span>
            </div>

            <div
              className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs ${
                fieldErrors.description
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'
              }`}
            >
              <MarkdownToolbar
                textareaRef={descriptionTextareaRef}
                value={formData.description}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, description: val }));
                  if (fieldErrors.description) {
                    setFieldErrors((prev) => ({ ...prev, description: null }));
                  }
                }}
                activeTab={descTab}
                setActiveTab={setDescTab}
              />

              {descTab === 'write' ? (
                <textarea
                  ref={descriptionTextareaRef}
                  id="description"
                  name="description"
                  rows={8}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the problem in detail: error messages, code context (e.g. ```java ... ```), environment setup, and what you have already tried..."
                  className="w-full px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent font-mono"
                />
              ) : (
                <div className="p-4 min-h-[200px] max-h-[450px] overflow-y-auto bg-slate-50/50">
                  {formData.description.trim() ? (
                    <MarkdownRenderer content={formData.description} />
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Nothing to preview yet. Switch back to Write mode and type some markdown or code blocks.
                    </p>
                  )}
                </div>
              )}
            </div>

            {fieldErrors.description && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.description}</p>
            )}
          </div>

          {/* 🤝 Allow Team Up Toggle Setting */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-start gap-3.5 shadow-sm transition-all hover:border-white/20">
            <div className="pt-0.5">
              <input
                type="checkbox"
                id="allowTeamUp"
                name="allowTeamUp"
                checked={formData.allowTeamUp}
                onChange={(e) => setFormData((prev) => ({ ...prev, allowTeamUp: e.target.checked }))}
                className="w-5 h-5 rounded-md accent-white bg-[#1e1e1e] border-white/20 text-white cursor-pointer"
              />
            </div>
            <label htmlFor="allowTeamUp" className="cursor-pointer select-none">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>🤝</span>
                  <span>Allow Team Up</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#222222] text-slate-300 border border-white/10">
                  Collaborative Solving
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Allow a small group of users (up to 5 members) to collaborate on this problem in a dedicated workspace, create shared tasks, and submit a joint answer.
              </p>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <GlassAiButton
              to="/problems"
              variant="glass"
              size="md"
            >
              Cancel
            </GlassAiButton>
            <GlassAiButton
              type="submit"
              disabled={loading}
              loading={loading}
              variant="primary"
              size="md"
            >
              Post Problem
            </GlassAiButton>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
};

export default CreateProblem;
