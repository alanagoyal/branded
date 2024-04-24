"use client";
import { useEffect, useMemo, useState } from "react";
import { NameGenerator } from "./name-generator";
import { Button } from "./ui/button";
import VerifySubscription from "./verify-subscription";
import BrandGenerator from "./brand-generator";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewGeneration({
  user,
  names,
}: {
  user: any;
  names: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = useMemo(() => searchParams.get("type"), [searchParams]);

  function handleShowNamesDisplay() {
    if (type === "brand-only") {
      router.push("/new");
    } else if (type === null) {
      router.push("/new?type=brand-only");
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-8">
      <VerifySubscription user={user} />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold sm:text-left mb-4 sm:mb-0">
          {type === "brand-only" ? "Brand Generator" : "Name Generator"}
        </h1>
        {type === "brand-only" ? (
          <Button variant="ghost" onClick={handleShowNamesDisplay}>
            Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={handleShowNamesDisplay}>
            Already have a name? Skip to the branding.
          </Button>
        )}
      </div>
      {type === "brand-only" ? (
        <BrandGenerator user={user} names={names ?? null} />
      ) : (
        <NameGenerator user={user} names={names ?? null} />
      )}
    </div>
  );
}
