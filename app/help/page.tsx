import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SUPPORT_ISSUES_URL, SUPPORT_NEW_ISSUE_URL } from "@/lib/support";

export default function HelpPage() {
  return (
    <div className="w-full max-w-2xl px-4 py-8 min-h-[60vh] space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Help</h1>
        <p className="text-muted-foreground">
          Found a bug or have a question? Create an issue on GitHub.
          Include what happened, what you expected, and how to reproduce it.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button asChild>
            <a href={SUPPORT_NEW_ISSUE_URL}>Create a GitHub issue</a>
          </Button>
          <a href={SUPPORT_ISSUES_URL} className="text-sm underline">View existing issues</a>
        </div>
        <p className="text-sm text-muted-foreground">
          You&apos;ll need a GitHub account. Issues are public, so don&apos;t include
          passwords, API keys, payment details, or other personal information.
        </p>
      </section>
      <section className="border-t pt-6 space-y-2">
        <h2 className="text-lg font-semibold">Delete your account</h2>
        <p className="text-sm text-muted-foreground">
          Open <Link href="/account" className="underline">Account</Link> and choose
          {" "}Delete account. If you have a subscription, schedule cancellation in
          Manage billing first.
        </p>
      </section>
    </div>
  );
}
