"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="btn-secondary text-sm py-2"
    >
      Sign Out
    </button>
  );
}
