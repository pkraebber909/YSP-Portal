import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("ysp_session")?.value;
  if (token) deleteSession(token);
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete("ysp_session");
  return response;
}
