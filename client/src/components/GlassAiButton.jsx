import React from 'react';
import { Link } from 'react-router-dom';
import './GlassAiButton.css';

/**
 * GlassAiButton - DesignCode ThreeUI Inspired Glass AI Action Button
 *
 * Implements modern ThreeUI glassmorphic aesthetics:
 * - Specular top-edge glass reflections
 * - Conic interactive ambient shader auras
 * - Specular shimmer hover sweeps
 * - Full React Router Link and HTML button compatibility
 * - Supports loading spinners, disabled states, icons, and sizing
 */
export const GlassAiButton = ({
  children,
  onClick,
  type = 'button',
  to,
  href,
  variant = 'primary', // 'primary' | 'glass' | 'secondary' | 'danger' | 'success' | 'dark'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  style = {},
  ...rest
}) => {
  const sizeClass = `glass-ai-size-${size}`;
  const variantClass = `glass-ai-variant-${variant}`;
  const widthClass = fullWidth ? 'glass-ai-full-width w-full' : '';
  const disabledClass = disabled || loading ? 'is-disabled' : '';

  const combinedClasses = `glass-ai-btn ${variantClass} ${sizeClass} ${widthClass} ${disabledClass} ${className}`.trim();

  const content = (
    <>
      {/* 1. Ambient Glow Aura */}
      <span className="glass-ai-aura" aria-hidden="true" />

      {/* 2. Glass Surface Container */}
      <span className="glass-ai-surface">
        {/* Top Edge Specular Reflection */}
        <span className="glass-ai-specular" aria-hidden="true" />

        {/* Shimmer Sweep on Hover */}
        <span className="glass-ai-shimmer" aria-hidden="true" />

        {/* Content & Spinner */}
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 animate-spin text-current shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="inline-flex shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5">
                {icon}
              </span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="inline-flex shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                {icon}
              </span>
            )}
          </>
        )}
      </span>
    </>
  );

  // If `to` is supplied, render as React Router Link
  if (to && !disabled) {
    return (
      <Link to={to} className={combinedClasses} style={style} onClick={onClick} {...rest}>
        {content}
      </Link>
    );
  }

  // If `href` is supplied, render as external anchor
  if (href && !disabled) {
    return (
      <a href={href} className={combinedClasses} style={style} onClick={onClick} {...rest}>
        {content}
      </a>
    );
  }

  // Otherwise render standard HTML button
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={combinedClasses}
      style={style}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  );
};

export default GlassAiButton;
