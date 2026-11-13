"use client";

import { useActionState, useEffect, useRef } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  /** Fafana ny formulaire (email + password) rehefa miditra na miverina amin'ny login. */
  function clearForm() {
    if (formRef.current) formRef.current.reset();
    if (emailRef.current) emailRef.current.value = "";
    if (passwordRef.current) passwordRef.current.value = "";
  }

  useEffect(() => {
    clearForm();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) clearForm();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      clearForm();
    };
  }, []);

  useEffect(() => {
    if (error && passwordRef.current) {
      passwordRef.current.value = "";
    }
  }, [error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" autoComplete="off">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          required
          defaultValue=""
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          defaultValue=""
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
