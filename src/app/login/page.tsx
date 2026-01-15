import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-primary">
            Leadership in Love
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="card">
            <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
            <LoginForm />
            <p className="text-center text-muted mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Get Started
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
