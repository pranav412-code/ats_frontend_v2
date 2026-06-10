export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(pw)) {
    return 'Password must contain at least one letter.';
  }
  if (!/\d/.test(pw)) {
    return 'Password must contain at least one digit.';
  }
  return null;
}
