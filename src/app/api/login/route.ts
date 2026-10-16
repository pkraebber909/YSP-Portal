import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import "@/lib/db";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const userId = String(form.get("userId") || "");
  if (userId !== "phineas" && userId !== "cyclones-admin") return new Response("Unknown demo workspace", { status: 400 });
  const response = new NextResponse(null, { status: 303, headers: { Location: userId === "phineas" ? "/rep" : "/partner" } });
  response.cookies.set("ysp_session", createSession(userId), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 24 * 60 * 60 });
  return response;
}
