"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { PortalLink } from "@/lib/plans";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (pending || confirmation !== "DELETE") return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Account deletion failed.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again or email hi@basecase.vc.");
      setPending(false);
      return;
    }

    // Remove browser auth state too; a cleanup failure must not report a
    // completed deletion as failed. Reload to discard cached account data.
    try {
      await createClient().auth.signOut({ scope: "local" });
    } catch {
      // The account is already gone; do not show a false deletion failure.
    }
    window.location.replace("/account/deleted");
  }

  return (
    <section className="mt-8 border-t pt-6 space-y-3">
      <h2 className="text-lg font-semibold">Delete account</h2>
      <p className="text-sm text-muted-foreground">
        Permanently delete your account and saved names, logos, and documents.
        If you have a subscription, cancel it in billing first. You can delete
        your account once cancellation is scheduled.
      </p>
      <p className="text-sm">
        <a href={PortalLink} className="underline">Manage billing</a>
        {" · "}<a href="mailto:hi@basecase.vc" className="underline">Contact support</a>
      </p>
      <Dialog open={open} onOpenChange={(value) => {
        if (pending) return;
        setOpen(value);
        setConfirmation("");
        setError("");
      }}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete account</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Your saved work and access will be removed
              immediately, including any remaining paid time. Billing records
              and previously exported or shared files are not deleted.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={deleteAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">Type DELETE to confirm</Label>
              <Input id="delete-confirmation" autoComplete="off" value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)} disabled={pending} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Keep account</Button>
              <Button type="submit" variant="destructive" disabled={pending || confirmation !== "DELETE"}>
                {pending ? "Deleting…" : "Permanently delete account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
