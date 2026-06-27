export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: "number",
    label: "At least one number",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: "special",
    label: "At least one special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

export interface PasswordValidationResult {
  score: number; // 0 to 5
  metRequirements: Record<string, boolean>;
  strength: "very-weak" | "weak" | "medium" | "strong" | "very-strong";
  label: string;
  colorClass: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  const metRequirements: Record<string, boolean> = {};
  let score = 0;

  for (const req of PASSWORD_REQUIREMENTS) {
    const isMet = req.test(password);
    metRequirements[req.id] = isMet;
    if (isMet) {
      score += 1;
    }
  }

  let strength: PasswordValidationResult["strength"] = "very-weak";
  let label = "Very Weak";
  let colorClass = "bg-destructive"; // red

  if (score === 2) {
    strength = "weak";
    label = "Weak";
    colorClass = "bg-orange-500";
  } else if (score === 3) {
    strength = "medium";
    label = "Medium";
    colorClass = "bg-amber-500";
  } else if (score === 4) {
    strength = "strong";
    label = "Strong";
    colorClass = "bg-primary/70"; // lighter green
  } else if (score === 5) {
    strength = "very-strong";
    label = "Very Strong";
    colorClass = "bg-primary"; // deep green
  }

  return {
    score,
    metRequirements,
    strength,
    label,
    colorClass,
  };
}
