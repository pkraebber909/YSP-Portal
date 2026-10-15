import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyLogin } from "@/lib/auth";
import "@/lib/db";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const userId = String(form.get("userId") || "");
  const password = String(form.get("password") || "");
  if (!verifyLogin(userId, password)) return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  const response = NextResponse.redirect(new URL(userId === "phineas" ? "/rep" : "/partner", request.url), 303);
  response.cookies.set("ysp_session", createSession(userId), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 24 * 60 * 60 });
  return response;
}
