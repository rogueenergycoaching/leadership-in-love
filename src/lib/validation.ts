export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!email.includes("@")) return "Please enter a valid email address";
  if (email.length > 254) return "Email is too long";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";

  return null;
}

export function validateName(name: string, fieldName: string): string | null {
  if (!name) return `${fieldName} is required`;
  if (name.trim().length < 1) return `${fieldName} is required`;
  if (name.length > 50) return `${fieldName} is too long (max 50 characters)`;

  // Only allow letters (including accented), spaces, hyphens, and apostrophes
  // This prevents HTML/script injection in names
  const nameRegex = /^[\p{L}\s\-']+$/u;
  if (!nameRegex.test(name)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }

  return null;
}

const VALID_GENDERS = ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"];

export function validateGender(gender: string, fieldName: string): string | null {
  if (!gender) return `${fieldName} is required`;
  if (!VALID_GENDERS.includes(gender)) return `${fieldName} must be a valid option`;
  return null;
}

export function validateRegistration(data: {
  email: string;
  password: string;
  confirmPassword: string;
  partnerAName: string;
  partnerBName: string;
  partnerAGender: string;
  partnerBGender: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  const partnerAError = validateName(data.partnerAName, "Partner 1 name");
  if (partnerAError) errors.partnerAName = partnerAError;

  const partnerBError = validateName(data.partnerBName, "Partner 2 name");
  if (partnerBError) errors.partnerBName = partnerBError;

  const partnerAGenderError = validateGender(data.partnerAGender, "Partner 1 gender");
  if (partnerAGenderError) errors.partnerAGender = partnerAGenderError;

  const partnerBGenderError = validateGender(data.partnerBGender, "Partner 2 gender");
  if (partnerBGenderError) errors.partnerBGender = partnerBGenderError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLogin(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  if (!data.password) errors.password = "Password is required";

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
