import React from 'react';
import './Loader.css';

/**
 * Reusable Loader Component
 * Exact implementation of Uiverse.io Shoh2008 two-ball push animation.
 */
export const Loader = ({ size = 'lg', className = '', style = {} }) => {
  const sizeClass = size === 'xs' || size === 'tiny'
    ? 'loader--xs'
    : size === 'sm' || size === 'small'
    ? 'loader--sm'
    : size === 'md' || size === 'medium'
    ? 'loader--md'
    : 'loader--lg';

  return (
    <span
      className={`loader ${sizeClass} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Reusable LoaderContainer for page-level or section-level centering
 */
export const LoaderContainer = ({
  minHeight = '60vh',
  fullPage = false,
  message = '',
  size = 'lg',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`loader-container ${fullPage ? 'loader-container--full' : ''} ${className}`}
      style={{ minHeight: fullPage ? '100vh' : minHeight, ...style }}
      role="status"
      aria-label={message || 'Loading content'}
    >
      <Loader size={size} />
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};

export default Loader;
