"use client";
import { useState } from "react";
import { CopyIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "./ui/use-toast";

export function Share({ idString }: { idString: string; type?: string }) {
  const [createdLink, setCreatedLink] = useState<{ ids: string; url: string } | null>(null);
  const link = createdLink?.ids === idString ? createdLink.url : "";
  const [busy, setBusy] = useState(false);
  async function createLink() {
    setBusy(true);
    try {
      const ids = idString.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
      const response = await fetch("/api/name-shares", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create a share link");
      setCreatedLink({ ids: idString, url: `${window.location.origin}${data.path}` });
    } catch (error) {
      toast({ variant: "destructive", description: error instanceof Error ? error.message : "Unable to share names" });
    } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(link); toast({ description: "Copied to clipboard" }); }
    catch { toast({ variant: "destructive", description: "Unable to copy to clipboard" }); }
  }
  return <Popover><PopoverTrigger asChild><Button className="w-full" variant="ghost">Share</Button></PopoverTrigger>
    <PopoverContent align="end" className="w-[350px] space-y-4">
      <h3 className="text-lg font-semibold">Share names</h3>
      <p className="text-sm text-muted-foreground">Anyone with this link can view these names and their descriptions.</p>
      {link ? <div className="flex gap-2"><Input aria-label="Share link" value={link} readOnly /><Button size="sm" onClick={copy}><CopyIcon /><span className="sr-only">Copy</span></Button></div>
        : <Button disabled={busy} onClick={createLink}>{busy ? "Creating link…" : "Create share link"}</Button>}
    </PopoverContent>
  </Popover>;
}
