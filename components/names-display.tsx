"use client";
import { createClient } from "@/utils/supabase/client";
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
  name,
  processing,
  action,
  icon,
  text,
  onClick,
  status,
}: {
  name: string;
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

  if (processing.includes(name)) {
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
      disabled={processing.includes(name)}
      onClick={onClick}
    >
      {content}
    </Button>
  );
};

const ResultLinks = ({
  results,
  name,
}: {
  results: { [key: string]: any[] };
  name: string;
}) => (
  <>
    {results[name] &&
      Object.keys(results).length > 0 &&
      results[name].map((result, idx) => (
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
  user,
  verticalLayout = false,
}: {
  namesList: any;
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
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const idString = Object.values(namesList).join(",");

  const signUpLink = idString
    ? `/signup?ids=${idString.replace(/,/g, "")}`
    : "/signup";

  useEffect(() => {
    async function getOwner() {
      for (const name in namesList) {
        const { data: createdBy, error } = await supabase
          .from("names")
          .select()
          .eq("id", namesList[name])
          .single();
        if (createdBy?.created_by === user.id) {
          setIsOwner(true);
          break;
        }
      }
    }
    if (user) {
      getOwner();
    }

    async function fetchFavoritedStatus() {
      const { data: favoritedData, error } = await supabase
        .from("names")
        .select("name, favorited")
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
        favoritedData.forEach((item: { name: string; favorited: boolean }) => {
          favoritedMap[item.name] = item.favorited;
        });
        setFavoritedNames(favoritedMap);
      }
    }
    if (user) {
      fetchFavoritedStatus();
    }
  }, [namesList, user]);

  async function toggleFavoriteName(name: string) {
    try {
      const isFavorited = favoritedNames[name] || false;
      setFavoritedNames((prevState) => ({
        ...prevState,
        [name]: !isFavorited,
      }));

      const { error } = await supabase
        .from("names")
        .update({ favorited: !isFavorited })
        .eq("id", namesList[name]);

      toast({
        description: isFavorited
          ? "Removed from favorites"
          : "Added to favorites",
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  async function findDomainNames(name: string) {
    try {
      setProcessingDomains((prev) => [...prev, name]);
      const showingAvailability = domainResults[name];

      if (showingAvailability) {
        setDomainResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[name];
          return updatedResults;
        });
      } else {
        const domainStatus: {
          domain: string;
          purchaseLink: string;
        }[] = [];

        const { data: nameData, error: nameError } = await supabase
          .from("names")
          .select()
          .ilike("name", name.toLowerCase());

        let nameIds: string[] = [];
        if (nameData && nameData.length > 0) {
          nameIds = nameData.map((item: any) => item.id);
        }

        const { data: domainData, error: domainError } = await supabase
          .from("domains")
          .select()
          .in("name_id", nameIds);

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

          if (!response.ok) {
            toast({
              variant: "destructive",
              description: "Error finding domain availability",
            });
            throw new Error("Error finding domain availability");
          }

          const data = await response.json();

          if (data.error) {
            toast({
              variant: "destructive",
              description: "Error finding domain availability",
            });
            throw new Error("Error finding domain availability");
          }

          for (const result of data.availabilityResults) {
            if (result.available) {
              const domain = result.domain;
              const purchaseLink = `https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=${domain}`;
              const updates = {
                domain_name: domain,
                purchase_link: purchaseLink,
                created_at: new Date(),
                name_id: namesList[name],
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
          [name]: domainStatus,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingDomains((prev) => prev.filter((n) => n !== name));
    }
  }

  async function checkTrademarks(name: string) {
    try {
      setProcessingTrademark((prev) => [...prev, name]);
      const showingAvailability = trademarkResults[name];
      if (showingAvailability) {
        setTrademarkResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[name];
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
          .eq("name_id", namesList[name]);

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

          if (!response.ok) {
            throw new Error("Error finding trademarks");
          }

          const data = await response.json();

          if (data.error) {
            throw new Error("Error finding trademarks");
          }

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
                  name_id: namesList[name],
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
        setTrademarkResults((prev) => ({ ...prev, [name]: trademarkStatus }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingTrademark((prev) => prev.filter((n) => n !== name));
    }
  }

  async function findNpmNames(name: string) {
    try {
      setProcessingNpm((prev) => [...prev, name]);
      const showingAvailability = npmResults[name];
      if (showingAvailability) {
        setNpmResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[name];
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
          .eq("name_id", namesList[name]);

        if (npmData && npmData.length > 0) {
          for (const result of npmData) {
            const npmCommand = result.npm_name;
            const purchaseLink = result.purchase_link;
            npmAvailability.push({ npmName: npmCommand, purchaseLink });
          }
        } else {
          const response = await fetch(`/find-npm-availability?query=${name.toLowerCase()}`);

          if (!response.ok) {
            toast({
              variant: "destructive",
              description: "Error finding npm availability",
            });
            throw new Error("Error finding npm availability");
          }

          const data = await response.json();

          if (data.error) {
            toast({
              variant: "destructive",
              description: "Error finding npm availability",
            });
            throw new Error("Error finding npm availability");
          }

          if (data.available) {
            const npmCommand = `npm i ${name.toLowerCase()}`;
            const purchaseLink = `https://docs.npmjs.com/creating-a-package-json-file`;
            const updates = {
              npm_name: npmCommand,
              purchase_link: purchaseLink,
              created_at: new Date(),
              name_id: namesList[name],
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
          [name]: npmAvailability,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingNpm((prev) => prev.filter((n) => n !== name));
    }
  }

  async function generateLogo(name: string) {
    try {
      setProcessingLogo((prev) => [...prev, name]);
      const showingAvailability = logoResults[name];

      if (showingAvailability) {
        setLogoResults((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[name];
          return updatedResults;
        });
      } else {
        let logoUrl = "";

        const { data: logoData, error } = await supabase
          .from("logos")
          .select()
          .eq("name_id", namesList[name]);

        if (logoData && logoData.length > 0) {
          logoUrl = logoData[0].logo_url;
        } else {
          const response = await fetch("/generate-logo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
            }),
          });

          if (!response.ok) {
            toast({
              variant: "destructive",
              description: "Error generating logo",
            });
            throw new Error("Error generating logo");
          }

          const data = await response.json();

          if (data.error) {
            toast({
              variant: "destructive",
              description: "Error generating logo",
            });
            throw new Error("Error generating logo");
          } else {
            logoUrl = data.imageUrl;

            const updates = {
              logo_url: logoUrl,
              created_at: new Date(),
              name_id: namesList[name],
              created_by: user.id,
            };

            let { data: insertData, error } = await supabase
              .from("logos")
              .insert(updates);
            if (error) throw error;
          }
        }

        setLogoResults((prev) => ({
          ...prev,
          [name]: logoUrl,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingLogo((prev) => prev.filter((n) => n !== name));
    }
  }

  async function createOnePager(name: string) {
    try {
      setProcessingOnePager((prev) => [...prev, name]);
      const showingAvailability = onePager[name];
      if (showingAvailability) {
        setOnePager((prev) => {
          const updatedResults = { ...prev };
          delete updatedResults[name];
          return updatedResults;
        });
      } else {
        let onePagerUrl = "";

        const { data: onePagerData } = await supabase
          .from("one_pagers")
          .select()
          .eq("name_id", namesList[name]);

        if (onePagerData && onePagerData.length > 0) {
          onePagerUrl = onePagerData[0].pdf_url;
        } else {
          const { data: nameData } = await supabase
            .from("names")
            .select()
            .eq("id", namesList[name])
            .single();

          const { data: userData } = await supabase
            .from("profiles")
            .select()
            .eq("id", user.id)
            .single();

          let logoUrl = null;

          const { data: logoData } = await supabase
            .from("logos")
            .select()
            .eq("name_id", namesList[name]);

          if (logoData && logoData.length > 0) {
            logoUrl = logoData[0].logo_url;
          }

          const response = await fetch("/generate-one-pager-content", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              description: nameData.description,
            }),
          });

          if (!response.ok) {
            toast({
              variant: "destructive",
              description: "Error generating one pager content",
            });
            throw new Error("Error generating one pager content");
          }

          const data = await response.json();

          if (data.error) {
            toast({
              variant: "destructive",
              description: "Error generating one pager content",
            });
            throw new Error("Error generating one pager content");
          }

          const content = data.response;

          if (content) {
            const response = await fetch(
              `/one-pager?content=${encodeURIComponent(
                JSON.stringify(content)
              )}&nameData=${encodeURIComponent(
                JSON.stringify(nameData)
              )}&userData=${encodeURIComponent(
                JSON.stringify(userData)
              )}&logoUrl=${encodeURIComponent(JSON.stringify(logoUrl))}`
            );

            if (!response.ok) {
              toast({
                variant: "destructive",
                description: "Error generating PDF",
              });
              throw new Error("Error generating PDF");
            }

            const data = await response.json();

            if (data.error) {
              toast({
                variant: "destructive",
                description: "Error generating PDF",
              });
              throw new Error("Error generating PDF");
            } else {
              onePagerUrl = data.link;

              const updates = {
                pdf_url: onePagerUrl,
                created_at: new Date(),
                name_id: namesList[name],
                created_by: user.id,
              };

              let { data: insertData, error } = await supabase
                .from("one_pagers")
                .insert(updates);

              if (error) throw error;
            }
          }
        }

        window.open(onePagerUrl, "_blank");

        setOnePager((prev) => ({
          ...prev,
          [name]: onePagerUrl,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingOnePager((prev) => prev.filter((n) => n !== name));
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

  const renderNameContent = (name: string) => (
    <div className="flex flex-col space-y-2">
      <ActionButton
        name={name}
        processing={processingDomains}
        action={<Icons.spinner />}
        icon={<Icons.domain />}
        text="Check domain availability"
        onClick={() =>
          user
            ? findDomainNames(name)
            : handleActionForUnauthenticatedUser(
                "check domain availability for"
              )
        }
        status={
          processingDomains.includes(name)
            ? "default"
            : domainResults[name] && domainResults[name].length === 0
            ? "noDomains"
            : domainResults[name] && domainResults[name].length > 0
            ? "domainsFound"
            : "default"
        }
      />
      <ResultLinks results={domainResults} name={name} />
      <ActionButton
        name={name}
        processing={processingNpm}
        action={<Icons.spinner />}
        icon={<Icons.npmPackage />}
        text="Check npm availability"
        onClick={() =>
          user
            ? findNpmNames(name)
            : handleActionForUnauthenticatedUser("check npm availability for")
        }
        status={
          processingNpm.includes(name)
            ? "default"
            : npmResults[name] && npmResults[name].length === 0
            ? "noNpmPackages"
            : npmResults[name] && npmResults[name].length > 0
            ? "npmPackagesFound"
            : "default"
        }
      />
      <ResultLinks results={npmResults} name={name} />
      <ActionButton
        name={name}
        processing={processingTrademark}
        action={<Icons.spinner />}
        icon={<Icons.trademark />}
        text="Check for trademarks"
        onClick={() =>
          user
            ? checkTrademarks(name)
            : handleActionForUnauthenticatedUser("check trademarks for")
        }
        status={
          processingTrademark.includes(name)
            ? "default"
            : trademarkResults[name] && trademarkResults[name].length === 0
            ? "noTrademarks"
            : trademarkResults[name] && trademarkResults[name].length > 0
            ? "trademarksFound"
            : "default"
        }
      />
      <ResultLinks results={trademarkResults} name={name} />
      <ActionButton
        name={name}
        processing={processingLogo}
        action={<Icons.spinner />}
        icon={<Icons.generate />}
        text="Generate a logo"
        onClick={() =>
          user
            ? generateLogo(name)
            : handleActionForUnauthenticatedUser("generate a logo for")
        }
      />
      {logoResults[name] && (
        <div className="flex items-center justify-center w-full">
          <Link
            href={logoResults[name]}
            target="_blank"
            className="cursor-pointer"
          >
            <Image
              src={logoResults[name]}
              alt={name}
              width={200}
              height={200}
            />
          </Link>
        </div>
      )}
      <ActionButton
        name={name}
        processing={processingOnePager}
        action={<Icons.spinner />}
        icon={<Icons.onePager />}
        text="Generate a one-pager"
        onClick={() =>
          user
            ? createOnePager(name)
            : handleActionForUnauthenticatedUser("generate a one-pager for")
        }
      />
      {isOwner && (
        <Button
          onClick={() =>
            user
              ? toggleFavoriteName(name)
              : handleActionForUnauthenticatedUser("favorite")
          }
          variant="ghost"
        >
          {favoritedNames[name] ? (
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
      )}
    </div>
  );

  return (
    <div>
      {verticalLayout ? (
        <div className="flex flex-col space-y-4">
          {Object.keys(namesList).map((name, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-center">{name}</CardTitle>
              </CardHeader>
              <CardContent>{renderNameContent(name)}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Carousel>
          <CarouselContent>
            {Object.keys(namesList).map((name, index) => (
              <CarouselItem key={index} className="h-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">{name}</CardTitle>
                  </CardHeader>
                  <CardContent>{renderNameContent(name)}</CardContent>
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
