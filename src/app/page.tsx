import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Home() {
  const session = await getSession();
  redirect(session?.role === "rep" ? "/rep" : session?.role === "partner_admin" ? "/partner" : "/login");
}
