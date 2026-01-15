import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import { createElement } from "react";

// Register font (using system font fallback)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1a1a2e",
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 8,
    marginTop: 20,
  },
  h2: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  h3: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 12,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
  listItem: {
    marginBottom: 4,
    paddingLeft: 15,
  },
  bullet: {
    position: "absolute",
    left: 0,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 15,
  },
  italic: {
    fontStyle: "italic",
    color: "#6b7280",
    fontSize: 10,
  },
  bold: {
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 9,
    color: "#6b7280",
  },
});

function parseMarkdownToPDF(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactElement[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      listItems.forEach((item, idx) => {
        elements.push(
          createElement(
            View,
            { key: `list-${elements.length}-${idx}`, style: styles.listItem },
            createElement(Text, { style: styles.bullet }, "•  "),
            createElement(Text, {}, item)
          )
        );
      });
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        createElement(
          Text,
          { key: `h1-${elements.length}`, style: styles.h1 },
          line.slice(2)
        )
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        createElement(
          Text,
          { key: `h2-${elements.length}`, style: styles.h2 },
          line.slice(3)
        )
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        createElement(
          Text,
          { key: `h3-${elements.length}`, style: styles.h3 },
          line.slice(4)
        )
      );
    } else if (line.startsWith("---")) {
      flushList();
      elements.push(
        createElement(View, { key: `hr-${elements.length}`, style: styles.hr })
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      flushList();
      elements.push(
        createElement(
          Text,
          { key: `italic-${elements.length}`, style: styles.italic },
          line.slice(1, -1)
        )
      );
    } else if (line.trim()) {
      flushList();
      // Remove markdown bold markers for plain text
      const cleanLine = line.replace(/\*\*(.+?)\*\*/g, "$1");
      elements.push(
        createElement(
          Text,
          { key: `p-${elements.length}`, style: styles.paragraph },
          cleanLine
        )
      );
    }
  }

  flushList();
  return elements;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!document || document.userId !== session.user.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const title =
    document.type === "DISCOVERY"
      ? "Discovery Document"
      : "Your Shared Vision";

  const filename =
    document.type === "DISCOVERY"
      ? "discovery-document.pdf"
      : "shared-vision.pdf";

  try {
    const pdfContent = parseMarkdownToPDF(document.content);

    const PDFDocument = createElement(
      Document,
      {},
      createElement(
        Page,
        { size: "A4", style: styles.page },
        ...pdfContent,
        createElement(
          Text,
          { style: styles.footer },
          `${title} - ${document.user.partnerAName} & ${document.user.partnerBName} | Leadership in Love`
        )
      )
    );

    const buffer = await renderToBuffer(PDFDocument);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
