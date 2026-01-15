import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            Leadership in Love
          </h1>
          <Link href="/login" className="btn-secondary">
            Sign In
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Reconnect with Your Shared Goals
          </h2>
          <p className="text-xl text-muted mb-8">
            Leadership in Love helps couples rediscover their dreams, explore
            their differences with curiosity, and build practical strategies to
            pursue their goals together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary">
              I Already Have an Account
            </Link>
          </div>
        </div>
      </section>

      <footer className="p-6 text-center text-muted text-sm">
        <p>&copy; {new Date().getFullYear()} Leadership in Love</p>
      </footer>
    </main>
  );
}
