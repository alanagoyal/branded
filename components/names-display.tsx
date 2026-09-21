"use client";
import type { NameRecord } from "@/lib/name-records";
import { createClient } from "@/utils/supabase/client";
import { readProviderResponse } from "@/lib/provider-response";
import { downloadPdf, PDF_DATA_PREFIX } from "@/lib/pdf-download";
import { showProviderError } from "./provider-error";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { toast } from "./ui/use-toast";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { useRouter } from "next/navigation";
import { ToastAction } from "./ui/toast";

const ActionButton = ({
  nameId,
  processing,
  action,
  icon,
  text,
  onClick,
  status,
}: {
  nameId: string;
  processing: string[];
  action: React.ReactNode;
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  status?:
    | "default"
    | "noTrademarks"
    | "trademarksFound"
    | "noNpmPackages"
    | "npmPackagesFound"
    | "noDomains"
    | "domainsFound";
}) => {
  let content = (
    <>
      {icon}
      <span className="ml-2">{text}</span>
    </>
  );

  if (processing.includes(nameId)) {
    content = (
      <>
        {action}
        <span className="ml-2">{text}</span>
      </>
    );
  } else if (status === "noTrademarks") {
    content = (
      <>
        <Icons.checkmark />
        <span className="ml-2">No trademarks found</span>
      </>
    );
  } else if (status === "trademarksFound") {
    content = (
      <>
        <Icons.alert />
        <span className="ml-2">Trademark(s) detected</span>
      </>
    );
  } else if (status === "noNpmPackages") {
    content = (
      <>
        <Icons.cross />
        <span className="ml-2">Package name is not available</span>
      </>
    );
  } else if (status === "npmPackagesFound") {
    content = (
      <>
        <Icons.checkmark />
        <span className="ml-2">Package name is available</span>
      </>
    );
  } else if (status === "noDomains") {
    content = (
      <>
        <Icons.cross />
        <span className="ml-2">No domain names available</span>
      </>
    );
  } else if (status === "domainsFound") {
    content = (
      <>
        <Icons.checkmark />
        <span className="ml-2">Domain names available</span>
      </>
    );
  }

  return (
    <Button
      variant="ghost"
      disabled={processing.includes(nameId)}
      onClick={onClick}
    >
      {content}
    </Button>
  );
};

const ResultLinks = ({
  results,
  nameId,
}: {
  results: { [key: string]: any[] };
  nameId: string;
}) => (
  <>
    {results[nameId] &&
      Object.keys(results).length > 0 &&
      results[nameId].map((result, idx) => (
        <div key={idx} className="flex items-center justify-center w-full">
          <Link
            href={result.purchaseLink || result.link}
            target="_blank"
            className="text-sm cursor-pointer"
          >
            {result.domain || result.keyword || result.npmName}
          </Link>
        </div>
      ))}
  </>
);

export function NamesDisplay({
  namesList,
  showRemoveButton,
  onRemoveName,
  user,
  verticalLayout = false,
}: {
  namesList: NameRecord[];
  showRemoveButton: boolean;
  onRemoveName?: (id: string) => void;
  user: any;
  verticalLayout: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [processingDomains, setProcessingDomains] = useState<string[]>([]);
  const [processingNpm, setProcessingNpm] = useState<string[]>([]);
  const [processingTrademark, setProcessingTrademark] = useState<string[]>([]);
  const [favoritedNames, setFavoritedNames] = useState<{
    [key: string]: boolean;
  }>({});
  const [domainResults, setDomainResults] = useState<{
    [key: string]: { domain: string; purchaseLink: string }[];
  }>({});
  const [npmResults, setNpmResults] = useState<{
    [key: string]: { npmName: string; purchaseLink: string }[];
  }>({});
  const [trademarkResults, setTrademarkResults] = useState<{
    [key: string]: { keyword: string; description: string; link: string }[];
  }>({});
  const [processingLogo, setProcessingLogo] = useState<string[]>([]);
  const [logoResults, setLogoResults] = useState<{
    [key: string]: string;
  }>({});
  const [processingOnePager, setProcessingOnePager] = useState<string[]>([]);
  const [onePager, setOnePager] = useState<{ [key: string]: string }>({});
  const [ownedNameIds, setOwnedNameIds] = useState<string[]>([]);
  const idString = namesList.map(({ id }) => id).join(",");


  const signUpLink = idString
    ? `/signup?ids=${idString.replace(/,/g, "")}`
    : "/signup";

  useEffect(() => {
    let active = true;
    setOwnedNameIds([]);
    async function getOwner() {
      const { data } = await supabase
        .from("names")
        .select("id")
        .in("id", namesList.map(({ id }) => id))
        .eq("created_by", user.id);
      if (active) setOwnedNameIds((data ?? []).map(({ id }) => id));
    }
    if (user && namesList.length) {
      getOwner();
    }

    async function fetchFavoritedStatus() {
      const { data: favoritedData, error } = await supabase
        .from("names")
        .select("id, favorited")
        .eq("created_by", user.id);
      if (error) {
        toast({
          variant: "destructive",
          description: "Error fetching favorited status",
        });
        console.error("Error fetching favorited status:", error.message);
        return;
      }
      if (favoritedData) {
        const favoritedMap: { [key: string]: boolean } = {};
        favoritedData.forEach((item: { id: string; favorited: boolean }) => {
          favoritedMap[item.id] = item.favorited;
        });
        if (active) setFavoritedNames(favoritedMap);
      }
    }
    if (user) {
      fetchFavoritedStatus();
    }
    return () => { active = false; };
  }, [namesList, user]);

  async function toggleFavoriteName(nameId: string) {
    try {
      const isFavorited = favoritedNames[nameId] || false;
      setFavoritedNames((prevState) => ({
        ...prevState,
        [nameId]: !isFavorited,
      }));

      const { error } = await supabase
        .from("names")
        .update({ favorited: !isFavorited })
        .eq("id", nameId);

      if (error) throw error;

      toast({
        description: isFavorited
          ? "Removed from favorites"
          : "Added to favorites",
      });
      router.refresh();
    } catch (error) {
      showProviderError(error);
    }
  }

  async function findDomainNames(name: string, nameId: string) {
    try {
      setProcessingDomains((prev) => [...prev, nameId]);
      const showingAvailability = domainResults[nameId];

      if (showingAvailability) {
        setDomainResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[nameId];
          return updatedResults;
        });
      } else {
        const domainStatus: {
          domain: string;
          purchaseLink: string;
        }[] = [];

        const { data: domainData, error: domainError } = await supabase
          .from("domains")
          .select()
          .eq("name_id", nameId);

        if (domainData && domainData.length > 0) {
          domainData.forEach((result) => {
            domainStatus.push({
              domain: result.domain_name,
              purchaseLink: result.purchase_link,
            });
          });
        } else {
          const parsedName = name.split(" ")[0];
          const sanitizedName = parsedName.replace(/[^\w\s]/gi, "");
          const response = await fetch(
            `/find-domain-availability?query=${sanitizedName}`
          );

          const data = await readProviderResponse(response);

          for (const result of data.availabilityResults) {
            if (result.available) {
              const domain = result.domain;
              const purchaseLink = `https://namecheap.pxf.io/c/5390613/386170/5618?u=https%3A%2F%2Fwww.namecheap.com%2Fdomains%2Fregistration%2Fresults.aspx%3Fdomain%3D${domain}
              `;
              const updates = {
                domain_name: domain,
                purchase_link: purchaseLink,
                created_at: new Date(),
                name_id: nameId,
                created_by: user.id,
              };
              let { data, error } = await supabase
                .from("domains")
                .insert(updates);
              if (error) throw error;
              domainStatus.push({ domain, purchaseLink });
            }
          }
        }
        setDomainResults((prev) => ({
          ...prev,
          [nameId]: domainStatus,
        }));
      }
    } catch (error) {
      showProviderError(error);
    } finally {
      setProcessingDomains((prev) => prev.filter((n) => n !== nameId));
    }
  }

  async function checkTrademarks(name: string, nameId: string) {
    try {
      setProcessingTrademark((prev) => [...prev, nameId]);
      const showingAvailability = trademarkResults[nameId];
      if (showingAvailability) {
        setTrademarkResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[nameId];
          return updatedResults;
        });
      } else {
        const trademarkStatus: {
          keyword: string;
          description: string;
          link: string;
        }[] = [];
        const { data: trademarkData, error: trademarkError } = await supabase
          .from("trademarks")
          .select()
          .eq("name_id", nameId);

        if (trademarkData && trademarkData.length > 0) {
          trademarkData.forEach((result) => {
            trademarkStatus.push({
              keyword: result.keyword,
              description: result.description,
              link: result.link,
            });
          });
        } else {
          const response = await fetch(
            `/find-trademarks?searchTerm=${encodeURIComponent(name)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await readProviderResponse(response);

          if (data.items.length > 0) {
            for (const item of data.items.slice(0, 5)) {
              if (item.status_label === "Live/Registered") {
                const { keyword, description, serial_number: serial } = item;
                const link = `https://tsdr.uspto.gov/#caseNumber=${serial}&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch`;

                const updates = {
                  keyword,
                  description,
                  link,
                  created_at: new Date(),
                  name_id: nameId,
                  created_by: user.id,
                };

                const { error } = await supabase
                  .from("trademarks")
                  .insert(updates);
                if (error) throw error;

                trademarkStatus.push({ keyword, description, link });
              }
            }
          }
        }
        setTrademarkResults((prev) => ({ ...prev, [nameId]: trademarkStatus }));
      }
    } catch (error) {
      showProviderError(error);
    } finally {
      setProcessingTrademark((prev) => prev.filter((n) => n !== nameId));
    }
  }

  async function findNpmNames(name: string, nameId: string) {
    try {
      setProcessingNpm((prev) => [...prev, nameId]);
      const showingAvailability = npmResults[nameId];
      if (showingAvailability) {
        setNpmResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[nameId];
          return updatedResults;
        });
      } else {
        const npmAvailability: {
          npmName: string;
          purchaseLink: string;
        }[] = [];

        const { data: npmData, error } = await supabase
          .from("npm_names")
          .select()
          .eq("name_id", nameId);

        if (npmData && npmData.length > 0) {
          for (const result of npmData) {
            const npmCommand = result.npm_name;
            const purchaseLink = result.purchase_link;
            npmAvailability.push({ npmName: npmCommand, purchaseLink });
          }
        } else {
          const response = await fetch(
            `/find-npm-availability?query=${name.toLowerCase()}`
          );

          const data = await readProviderResponse(response);

          if (data.available) {
            const npmCommand = `npm i ${name.toLowerCase()}`;
            const purchaseLink = `https://docs.npmjs.com/creating-a-package-json-file`;
            const updates = {
              npm_name: npmCommand,
              purchase_link: purchaseLink,
              created_at: new Date(),
              name_id: nameId,
              created_by: user.id,
            };
            let { data, error } = await supabase
              .from("npm_names")
              .insert(updates);
            if (error) throw error;
            npmAvailability.push({ npmName: npmCommand, purchaseLink });
          }
        }
        setNpmResults((prev) => ({
          ...prev,
          [nameId]: npmAvailability,
        }));
      }
    } catch (error) {
      showProviderError(error);
    } finally {
      setProcessingNpm((prev) => prev.filter((n) => n !== nameId));
    }
  }

  async function generateLogo(name: string, nameId: string) {
    try {
      setProcessingLogo((prev) => [...prev, nameId]);
      const showingAvailability = logoResults[nameId];

      if (showingAvailability) {
        setLogoResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[nameId];
          return updatedResults;
        });
      } else {
        let logoUrl = "";

        const { data: logoData, error } = await supabase
          .from("logos")
          .select()
          .eq("name_id", nameId);

        const savedLogo = logoData?.[0]?.logo_url;
        // Legacy DALL-E links expire. Replace expired assets on the next request.
        const expires = savedLogo?.startsWith("https:") ? new URL(savedLogo).searchParams.get("se") : null;
        if (savedLogo && (!expires || Date.parse(expires) > Date.now())) {
          logoUrl = savedLogo;
        } else {
          const response = await fetch("/generate-logo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nameId,
            }),
          });

          const data = await readProviderResponse(response);
          logoUrl = data.imageUrl;
        }

        setLogoResults((prev) => ({
          ...prev,
          [nameId]: logoUrl,
        }));
      }
    } catch (error) {
      showProviderError(error);
    } finally {
      setProcessingLogo((prev) => prev.filter((n) => n !== nameId));
    }
  }

  async function createOnePager(name: string, nameId: string) {
    try {
      setProcessingOnePager((prev) => [...prev, nameId]);
      let onePagerUrl = onePager[nameId];
      if (!onePagerUrl) {
        const { data: saved, error: savedError } = await supabase.from("one_pagers")
          .select("pdf_url").eq("name_id", nameId);
        if (savedError) throw savedError;
        const stored = saved?.[0]?.pdf_url;
        // Remote vendor links expire. Only locally generated, durable PDFs are reused.
        if (stored?.startsWith(PDF_DATA_PREFIX)) {
          onePagerUrl = stored;
        } else {
          const { data: nameData, error: nameError } = await supabase.from("names")
            .select("description").eq("id", nameId).single();
          if (nameError) throw nameError;
          const textResponse = await fetch("/generate-one-pager-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description: nameData?.description }),
          });
          const { response: content } = await readProviderResponse(textResponse);
          const pdfResponse = await fetch("/one-pager", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nameId, content }),
          });
          const data = await readProviderResponse(pdfResponse);
          onePagerUrl = data.link;
        }
      }
      downloadPdf(onePagerUrl, name);
      setOnePager((prev) => ({ ...prev, [nameId]: onePagerUrl }));
    } catch (error) {
      showProviderError(error);
    } finally {
      setProcessingOnePager((prev) => prev.filter((id) => id !== nameId));
    }
  }

  const handleActionForUnauthenticatedUser = (actionType: string) => {
    toast({
      title: "Please create an account",
      description: `In order to ${actionType} this name, please sign up for a free account.`,
      action: (
        <ToastAction onClick={() => router.push(signUpLink)} altText="Sign up">
          Sign up
        </ToastAction>
      ),
    });
    return;
  };

  const renderNameContent = (name: string, nameId: string) => (
    <div className="flex flex-col space-y-2 items-center">
      <div className="w-1/2 text-center">
        <ActionButton
          nameId={nameId}
          processing={processingDomains}
          action={<Icons.spinner />}
          icon={<Icons.domain />}
          text="Check domain availability"
          onClick={() =>
            user
              ? findDomainNames(name, nameId)
              : handleActionForUnauthenticatedUser(
                  "check domain availability for"
                )
          }
          status={
            processingDomains.includes(nameId)
              ? "default"
              : domainResults[nameId] && domainResults[nameId].length === 0
              ? "noDomains"
              : domainResults[nameId] && domainResults[nameId].length > 0
              ? "domainsFound"
              : "default"
          }
        />
      </div>
      <ResultLinks results={domainResults} nameId={nameId} />
      <div className="w-1/2 text-center">
        <ActionButton
          nameId={nameId}
          processing={processingNpm}
          action={<Icons.spinner />}
          icon={<Icons.npmPackage />}
          text="Check npm availability"
          onClick={() =>
            user
              ? findNpmNames(name, nameId)
              : handleActionForUnauthenticatedUser("check npm availability for")
          }
          status={
            processingNpm.includes(nameId)
              ? "default"
              : npmResults[nameId] && npmResults[nameId].length === 0
              ? "noNpmPackages"
              : npmResults[nameId] && npmResults[nameId].length > 0
              ? "npmPackagesFound"
              : "default"
          }
        />
      </div>
      <ResultLinks results={npmResults} nameId={nameId} />
      <div className="w-1/2 text-center">
        <ActionButton
          nameId={nameId}
          processing={processingTrademark}
          action={<Icons.spinner />}
          icon={<Icons.trademark />}
          text="Check for trademarks"
          onClick={() =>
            user
              ? checkTrademarks(name, nameId)
              : handleActionForUnauthenticatedUser("check trademarks for")
          }
          status={
            processingTrademark.includes(nameId)
              ? "default"
              : trademarkResults[nameId] && trademarkResults[nameId].length === 0
              ? "noTrademarks"
              : trademarkResults[nameId] && trademarkResults[nameId].length > 0
              ? "trademarksFound"
              : "default"
          }
        />
      </div>
      <ResultLinks results={trademarkResults} nameId={nameId} />
      <div className="w-1/2 text-center">
        <ActionButton
          nameId={nameId}
          processing={processingLogo}
          action={<Icons.spinner />}
          icon={<Icons.generate />}
          text="Generate a logo"
          onClick={() =>
            user
              ? generateLogo(name, nameId)
              : handleActionForUnauthenticatedUser("generate a logo for")
          }
        />
      </div>
      {logoResults[nameId] && (
        <div className="flex items-center justify-center w-full">
          <a
            href={logoResults[nameId]}
            download={logoResults[nameId].startsWith("data:") ? `${name}-logo.jpg` : undefined}
            target="_blank"
            className="cursor-pointer"
          >
            <Image
              src={logoResults[nameId]}
              unoptimized={logoResults[nameId].startsWith("data:")}
              alt={name}
              width={200}
              height={200}
            />
          </a>
        </div>
      )}
      <div className="w-1/2 text-center">
        <ActionButton
          nameId={nameId}
          processing={processingOnePager}
          action={<Icons.spinner />}
          icon={<Icons.onePager />}
          text="Generate a one-pager"
          onClick={() =>
            user
              ? createOnePager(name, nameId)
              : handleActionForUnauthenticatedUser("generate a one-pager for")
          }
        />
      </div>
      {ownedNameIds.includes(nameId) && (
        <div className="w-1/2 text-center">
          <Button
            onClick={() =>
              user
                ? toggleFavoriteName(nameId)
                : handleActionForUnauthenticatedUser("favorite")
            }
            variant="ghost"
          >
            {favoritedNames[nameId] ? (
              <>
                <Icons.unfavorite />
                <span className="ml-2">Remove from favorites</span>
              </>
            ) : (
              <>
                <Icons.favorite />
                <span className="ml-2">Add to favorites</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {verticalLayout ? (
        <div className="flex flex-col space-y-4">
          {namesList.map(({ name, id: nameId }) => (
            <Card key={nameId}>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div style={{ flex: 1 }}></div>
                  <div className="flex-1 text-center">
                    <CardTitle>{name}</CardTitle>
                  </div>
                  {showRemoveButton && onRemoveName && (
                    <div style={{ flex: 1 }} className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => onRemoveName(nameId)}
                      >
                        X
                      </Button>
                    </div>
                  )}
                  {!showRemoveButton && <div style={{ flex: 1 }}></div>}
                </div>
              </CardHeader>
              <CardContent>{renderNameContent(name, nameId)}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Carousel>
          <CarouselContent>
            {namesList.map(({ name, id: nameId }) => (
              <CarouselItem key={nameId} className="h-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">{name}</CardTitle>
                  </CardHeader>
                  <CardContent>{renderNameContent(name, nameId)}</CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}
      {!user && (
        <div className="py-2 text-sm text-center text-muted-foreground">
          <a href={signUpLink} className="underline">
            Create an account
          </a>{" "}
          to see available domain names, create a unique logo, and generate
          branded marketing materials for these names and more.
        </div>
      )}
    </div>
  );
}
