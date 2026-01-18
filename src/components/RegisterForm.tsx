"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { validateRegistration } from "@/lib/validation";

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: (formData.get("email") as string).trim(),
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      partnerAName: (formData.get("partnerAName") as string).trim(),
      partnerBName: (formData.get("partnerBName") as string).trim(),
      partnerAGender: formData.get("partnerAGender") as string,
      partnerBGender: formData.get("partnerBGender") as string,
    };

    // Client-side validation
    const validation = validateRegistration(data);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          partnerAName: data.partnerAName,
          partnerBName: data.partnerBName,
          partnerAGender: data.partnerAGender,
          partnerBGender: data.partnerBGender,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setServerError(
          "Account created, but sign-in failed. Please try logging in."
        );
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setServerError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClassName = (fieldName: string) =>
    `input-field ${errors[fieldName] ? "border-red-500 focus:ring-red-500" : ""}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={inputClassName("email")}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className={inputClassName("password")}
          placeholder="At least 8 characters"
        />
        {errors.password && (
          <p className="text-red-600 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium mb-2"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={inputClassName("confirmPassword")}
          placeholder="Re-enter your password"
        />
        {errors.confirmPassword && (
          <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <p className="text-sm text-muted mb-4">Partner Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="partnerAName"
                className="block text-sm font-medium mb-2"
              >
                Partner 1 Name
              </label>
              <input
                id="partnerAName"
                name="partnerAName"
                type="text"
                autoComplete="given-name"
                className={inputClassName("partnerAName")}
                placeholder="First name"
              />
              {errors.partnerAName && (
                <p className="text-red-600 text-sm mt-1">{errors.partnerAName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="partnerAGender"
                className="block text-sm font-medium mb-2"
              >
                Gender
              </label>
              <select
                id="partnerAGender"
                name="partnerAGender"
                className={inputClassName("partnerAGender")}
              >
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              {errors.partnerAGender && (
                <p className="text-red-600 text-sm mt-1">{errors.partnerAGender}</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="partnerBName"
                className="block text-sm font-medium mb-2"
              >
                Partner 2 Name
              </label>
              <input
                id="partnerBName"
                name="partnerBName"
                type="text"
                autoComplete="off"
                className={inputClassName("partnerBName")}
                placeholder="First name"
              />
              {errors.partnerBName && (
                <p className="text-red-600 text-sm mt-1">{errors.partnerBName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="partnerBGender"
                className="block text-sm font-medium mb-2"
              >
                Gender
              </label>
              <select
                id="partnerBGender"
                name="partnerBGender"
                className={inputClassName("partnerBGender")}
              >
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              {errors.partnerBGender && (
                <p className="text-red-600 text-sm mt-1">{errors.partnerBGender}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
