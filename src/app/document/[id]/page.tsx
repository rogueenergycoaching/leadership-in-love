import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DocumentContent } from "@/components/DocumentContent";

async function getDocument(id: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!document || document.userId !== userId) {
    return null;
  }

  return document;
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const document = await getDocument(id, session.user.id);

  if (!document) {
    redirect("/dashboard");
  }

  const title =
    document.type === "DISCOVERY"
      ? "Discovery Document"
      : "Your Shared Vision";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Leadership in Love
            </Link>
            <p className="text-sm text-muted">{title}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm py-2">
              Back to Dashboard
            </Link>
            <Link
              href={`/api/documents/${document.id}/pdf`}
              className="btn-accent text-sm py-2"
              target="_blank"
            >
              Download PDF
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <DocumentContent content={document.content} />
      </main>
    </div>
  );
}
