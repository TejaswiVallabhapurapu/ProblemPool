import React from 'react';
import { Link } from 'react-router-dom';
import './AnimatedButton.css';

/**
 * AnimatedButton - A modern shader/ThreeUI-inspired button component
 * Features dynamic rainbow/indigo conic rotating borders, glassmorphic surfaces,
 * animated ambient neon glows, and interactive specular shimmer sweeps.
 *
 * @param {Object} props
 * @param {string} [props.to] - React Router destination path (e.g., '/signup', '/login')
 * @param {string} [props.href] - External link URL
 * @param {string} [props.type='button'] - Button HTML type ('button', 'submit', 'reset')
 * @param {'signup' | 'login' | 'primary' | 'secondary'} [props.variant='signup'] - Visual theme variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size
 * @param {boolean} [props.fullWidth=false] - Whether to span 100% of parent width
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.loading=false] - Loading spinner state
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {'left' | 'right'} [props.iconPosition='right'] - Icon placement
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button label / content
 */
const AnimatedButton = ({
  to,
  href,
  type = 'button',
  variant = 'signup',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  onClick,
  className = '',
  children,
  ...rest
}) => {
  // Normalize variant names
  const normalizedVariant =
    variant === 'primary' || variant === 'signup' ? 'signup' : 'login';

  const sizeClass = `shader-size-${size}`;
  const variantClass = `shader-variant-${normalizedVariant}`;
  const widthClass = fullWidth ? 'shader-full-width w-full' : '';

  const combinedClasses = `shader-btn-wrapper ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  const content = (
    <>
      {/* Ambient glowing backdrop */}
      <span className="shader-btn-glow" aria-hidden="true" />

      {/* Rotating conic gradient border mask */}
      <span className="shader-border-container" aria-hidden="true">
        <span className="shader-border-spinner" />
      </span>

      {/* Inner glass/pill container with label & shimmer */}
      <span className="shader-btn-inner">
        {/* Shimmer sweep on hover */}
        <span className="shader-btn-shimmer" aria-hidden="true" />

        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin text-current"
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
            <span>{children}</span>
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
      <Link to={to} className={combinedClasses} onClick={onClick} {...rest}>
        {content}
      </Link>
    );
  }

  // If `href` is supplied, render as anchor
  if (href && !disabled) {
    return (
      <a href={href} className={combinedClasses} onClick={onClick} {...rest}>
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
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  );
};

export default AnimatedButton;
