export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export const getPasswordRequirements = (password: string): PasswordRequirements => ({
  length: password.length >= PASSWORD_MIN_LENGTH,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[!@#$%^&*(),.?":{}|<> ]/.test(password),
});

export const isPasswordValid = (password: string): boolean => {
  const reqs = getPasswordRequirements(password);
  return Object.values(reqs).every(val => val === true);
};
