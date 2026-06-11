import React from 'react';

/**
 * EulerLogo - Brand logo for Euler
 * Renders a Venn diagram with three overlapping circles and a striped center region.
 */
export function EulerLogo({ className = "w-8 h-8", style = {} }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="euler-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <pattern
          id="euler-logo-stripes"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="url(#euler-logo-grad)"
            strokeWidth="1.8"
          />
        </pattern>
      </defs>

      {/* Center overlapping striped region */}
      <path
        d="M 50 37.02 A 30 30 0 0 0 35 63 A 30 30 0 0 0 65 63 A 30 30 0 0 0 50 37.02 Z"
        fill="url(#euler-logo-stripes)"
      />

      {/* Outlines of the three circles */}
      <circle
        cx="50"
        cy="37.02"
        r="30"
        stroke="url(#euler-logo-grad)"
        strokeWidth="3.2"
      />
      <circle
        cx="35"
        cy="63"
        r="30"
        stroke="url(#euler-logo-grad)"
        strokeWidth="3.2"
      />
      <circle
        cx="65"
        cy="63"
        r="30"
        stroke="url(#euler-logo-grad)"
        strokeWidth="3.2"
      />
    </svg>
  );
}

/**
 * EulerLoader - Loading spinner animated logo
 * Staggers animations on the three circles of the Euler logo to create a pulsing/breathing effect.
 */
export function EulerLoader({ className = "w-6 h-6", style = {} }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="euler-loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <pattern
          id="euler-loader-stripes"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="url(#euler-loader-grad)"
            strokeWidth="1.8"
          />
        </pattern>
      </defs>

      <style>{`
        @keyframes pulseTop {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.85; }
          33% { transform: scale(1.06) translate(0, -2px); opacity: 1; }
          66% { transform: scale(0.96) translate(0, 1px); opacity: 0.65; }
        }
        @keyframes pulseLeft {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.85; }
          33% { transform: scale(0.96) translate(1px, 1px); opacity: 0.65; }
          66% { transform: scale(1.06) translate(-2px, 1px); opacity: 1; }
        }
        @keyframes pulseRight {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.85; }
          33% { transform: scale(0.96) translate(-1px, 1px); opacity: 0.65; }
          50% { transform: scale(1.06) translate(2px, 1px); opacity: 1; }
        }
        @keyframes pulseCenter {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .anim-top {
          animation: pulseTop 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: 50px 37px;
        }
        .anim-left {
          animation: pulseLeft 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: 35px 63px;
        }
        .anim-right {
          animation: pulseRight 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: 65px 63px;
        }
        .anim-center {
          animation: pulseCenter 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: 50px 54px;
        }
      `}</style>

      {/* Center overlapping striped region */}
      <path
        className="anim-center"
        d="M 50 37.02 A 30 30 0 0 0 35 63 A 30 30 0 0 0 65 63 A 30 30 0 0 0 50 37.02 Z"
        fill="url(#euler-loader-stripes)"
      />

      {/* Outlines of the three circles */}
      <circle
        className="anim-top"
        cx="50"
        cy="37.02"
        r="30"
        stroke="url(#euler-loader-grad)"
        strokeWidth="3.2"
      />
      <circle
        className="anim-left"
        cx="35"
        cy="63"
        r="30"
        stroke="url(#euler-loader-grad)"
        strokeWidth="3.2"
      />
      <circle
        className="anim-right"
        cx="65"
        cy="63"
        r="30"
        stroke="url(#euler-loader-grad)"
        strokeWidth="3.2"
      />
    </svg>
  );
}
