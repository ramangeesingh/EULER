// src/components/shared/UserAvatar.jsx
// Reusable user avatar: shows Google profile picture, or a gradient initial fallback.

import { useState, useMemo } from 'react';

/**
 * Derives the best available avatar URL from a Supabase user object.
 * Checks user_metadata.avatar_url → user_metadata.picture → null
 */
export function getAvatarUrl(user) {
  if (!user) return null;
  return (
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null
  );
}

/**
 * Derives the display initial from a Supabase user object.
 * Checks user_metadata.name → user_metadata.full_name → email prefix → '?'
 */
export function getDisplayInitial(user) {
  if (!user) return '?';
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    '';
  return (name.trim()[0] || '?').toUpperCase();
}

/**
 * Derives a display name from a Supabase user object.
 */
export function getDisplayName(user) {
  if (!user) return 'User';
  return (
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User'
  );
}

// Gradient palette for initial avatars (cycles by initial char code)
const GRADIENTS = [
  'linear-gradient(135deg, #2563EB, #3B82F6)',
  'linear-gradient(135deg, #7C3AED, #8B5CF6)',
  'linear-gradient(135deg, #0891B2, #06B6D4)',
  'linear-gradient(135deg, #059669, #10B981)',
  'linear-gradient(135deg, #DC2626, #EF4444)',
  'linear-gradient(135deg, #D97706, #F59E0B)',
];

function pickGradient(initial) {
  const code = (initial || 'U').charCodeAt(0);
  return GRADIENTS[code % GRADIENTS.length];
}

/**
 * UserAvatar — displays either a real profile picture (from Google OAuth etc.)
 * or a colored circle with the user's first initial as a fallback.
 *
 * Props:
 *   user       — Supabase user object (from useAuth())
 *   size       — number in px, default 32
 *   className  — extra CSS classes
 *   style      — extra inline styles
 */
export function UserAvatar({ user, size = 32, className = '', style = {} }) {
  const avatarUrl = useMemo(() => getAvatarUrl(user), [user]);
  const initial   = useMemo(() => getDisplayInitial(user), [user]);
  const [imgError, setImgError] = useState(false);

  const showImage = avatarUrl && !imgError;

  const baseStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1.5px solid rgba(37, 99, 235, 0.45)',
    boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.15), 0 2px 8px rgba(37, 99, 235, 0.2)',
    flexShrink: 0,
    ...style,
  };

  if (showImage) {
    return (
      <div className={className} style={baseStyle}>
        <img
          src={avatarUrl}
          alt="avatar"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Fallback: colored initial circle
  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        background: pickGradient(initial),
        color: '#fff',
        fontSize: Math.max(10, Math.round(size * 0.4)),
        fontWeight: 700,
        letterSpacing: '-0.01em',
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
}
