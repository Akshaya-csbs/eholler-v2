/**
 * Password Strength Utility
 * 
 * Provides friendly, real-time password strength feedback for signup and password reset.
 * Does NOT enforce restrictive character complexity (uppercase, symbols) unless the user
 * chooses to add them or Clerk's server-side policy explicitly requires them.
 */

export interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  feedback: string;
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: '',
      feedback: 'Enter at least 8 characters.',
      color: 'bg-slate-200',
    };
  }

  if (password.length < 8) {
    return {
      score: 1,
      label: 'Too short',
      feedback: 'Password must be at least 8 characters long.',
      color: 'bg-rose-500',
    };
  }

  // Common trivial sequence checks
  const lower = password.toLowerCase();
  const commonTrivial = [
    'password',
    '12345678',
    '123456789',
    'qwertyui',
    'admin123',
    'welcome1',
    'letmein1',
    'abcdefgh',
  ];

  if (commonTrivial.some((w) => lower.includes(w)) || /^(.)\1+$/.test(password)) {
    return {
      score: 1,
      label: 'Weak',
      feedback: 'Your password is too weak. Please choose a stronger password.',
      color: 'bg-rose-500',
    };
  }

  let points = 1; // base points for meeting 8 characters

  // Length progressions
  if (password.length >= 10) points++;
  if (password.length >= 14) points++;

  // Variety (optional helpers that improve score without being mandatory)
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const varietyCount = [hasLetters, hasNumbers, hasSymbols, hasMixedCase].filter(Boolean).length;
  if (varietyCount >= 3) {
    points++;
  }

  const score = Math.min(4, Math.max(1, points));

  if (score === 1) {
    return {
      score: 1,
      label: 'Weak',
      feedback: 'Your password is too weak. Please choose a stronger password.',
      color: 'bg-rose-500',
    };
  }

  if (score === 2) {
    return {
      score: 2,
      label: 'Fair',
      feedback: 'Fair password. Adding numbers or length makes it stronger.',
      color: 'bg-amber-500',
    };
  }

  if (score === 3) {
    return {
      score: 3,
      label: 'Good',
      feedback: 'Good password.',
      color: 'bg-emerald-500',
    };
  }

  return {
    score: 4,
    label: 'Strong',
    feedback: 'Strong password!',
    color: 'bg-green-600',
  };
}

/**
 * Maps Clerk error codes to clear, friendly user-facing messages.
 */
export function formatClerkPasswordError(err: any): string {
  const codeError = err.errors?.[0];
  const code = codeError?.code;

  if (code === 'form_password_pwned' || code === 'form_password_pwned__sign_in') {
    return 'This password has appeared in a known data breach and is unsafe. Please choose a different password.';
  }

  if (code === 'form_password_not_strong_enough' || code === 'form_password_validation_failed') {
    return 'Your password is too weak. Please choose a stronger password.';
  }

  if (code === 'form_password_length_too_short') {
    return (
      codeError?.longMessage ||
      codeError?.message ||
      'Password does not meet the minimum length required by your security policy.'
    );
  }

  return (
    codeError?.longMessage ||
    codeError?.message ||
    err.message ||
    'Failed to set password. Please check security requirements and try again.'
  );
}

