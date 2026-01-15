import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
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

      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <h2 className="text-2xl font-bold text-center mb-2">Get Started</h2>
            <p className="text-muted text-center mb-6">
              Create a shared account for you and your partner
            </p>
            <RegisterForm />
            <p className="text-center text-muted mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
