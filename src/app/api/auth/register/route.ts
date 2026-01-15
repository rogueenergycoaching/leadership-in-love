import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, partnerAName, partnerBName } = body;

    if (!email || !password || !partnerAName || !partnerBName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        partnerAName,
        partnerBName,
      },
    });

    // Create initial sessions for both partners and both rounds
    await prisma.session.createMany({
      data: [
        { userId: user.id, partnerRole: "A", round: "ROUND_1" },
        { userId: user.id, partnerRole: "B", round: "ROUND_1" },
        { userId: user.id, partnerRole: "A", round: "ROUND_2" },
        { userId: user.id, partnerRole: "B", round: "ROUND_2" },
      ],
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        partnerAName: user.partnerAName,
        partnerBName: user.partnerBName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
