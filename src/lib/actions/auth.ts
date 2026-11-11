"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function loginAction(_prev: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Email ou mot de passe incorrect.";
    throw error; // lets the redirect through
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
