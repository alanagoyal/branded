"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_EMAIL, supportMailto, type SupportDraft } from "@/lib/support";

export function CaseForm({ subject: initialSubject, description: initialDescription }: SupportDraft) {
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState(initialDescription);

  return (
    <Card id="support-email">
      <CardHeader>
        <CardTitle className="text-xl">Email support</CardTitle>
        <p className="text-sm text-muted-foreground">
          Send your request to <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          {" "}The button opens a draft in your email app. Review it and send it there; nothing is submitted here.
          {" "}If no email app opens, copy these details into an email to the address above.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="support-subject">Subject</Label>
          <Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-description">Description</Label>
          <Textarea id="support-description" className="min-h-[220px]" placeholder="Describe the issue and include your account email if relevant." value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild><a href={supportMailto(subject, description)}>Open email draft</a></Button>
      </CardFooter>
    </Card>
  );
}
