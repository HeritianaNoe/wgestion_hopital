"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { THEME_COOKIE, isTheme } from "@/lib/theme";

/** Enregistre le thème dans un cookie (1 an). Tout utilisateur connecté peut changer son thème. */
export async function setThemeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const theme = formData.get("theme");
  if (!isTheme(theme)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  });

  revalidatePath("/", "layout");
}
