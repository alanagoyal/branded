import { login } from "./actions";
import Link from "next/link";

import { LoginForm } from "@/components/login-form";

export default async function Login() {
  return (
    <>
      <div className="container mx-auto flex flex-col items-center justify-center p-4">
        <div className="w-full min-h-screen max-w-md flex flex-col space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to sign in
            </p>
          </div>
          <LoginForm login={login} />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link
              href="/signup"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign Up
            </Link>{" "}
          </p>
        </div>
      </div>
    </>
  );
}
