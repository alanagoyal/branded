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

  const [showNamesDisplay, setShowNamesDisplay] = useState<boolean>(false);

  useEffect(() => {
    if (type === "brand-only") {
      setShowNamesDisplay(true);
    }
  }, [type]);

  function handleShowNamesDisplay() {
    router.push("/new");
    setShowNamesDisplay(!showNamesDisplay);
  }

  return (
    <div className="min-h-screen px-4 sm:px-8">
      <VerifySubscription user={user} />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold sm:text-left mb-4 sm:mb-0">
          Name Generator
        </h1>
        {showNamesDisplay ? (
          <Button variant="ghost" onClick={handleShowNamesDisplay}>
            Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={handleShowNamesDisplay}>
            Already have a name? Skip to the branding.
          </Button>
        )}
      </div>
      {showNamesDisplay ? (
        <BrandGenerator user={user} names={names ?? null} />
      ) : (
        <NameGenerator user={user} names={names ?? null} />
      )}
    </div>
  );
}
