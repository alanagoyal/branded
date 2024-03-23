"use client";
import { createClient } from "@/utils/supabase/client";
import { Icons } from "./icons";
import { IoTerminalOutline } from "react-icons/io5";
import { BsGlobe2 } from "react-icons/bs";
import { BsStars } from "react-icons/bs";
import { Button } from "./ui/button";
import npmName from "npm-name";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useEffect, useState } from "react";
import { toast } from "./ui/use-toast";
import React from "react";
import Link from "next/link";
import { Label } from "./ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import Image from "next/image";
import { parse } from "path";

export function NamesTable({ namesList, user }: { namesList: any; user: any }) {
  const supabase = createClient();
  const [processingDomains, setProcessingDomains] = useState<string[]>([]);
  const [processingNpm, setProcessingNpm] = useState<string[]>([]);
  const [favoritedNames, setFavoritedNames] = useState<{
    [key: string]: boolean;
  }>({});
  const [domainResults, setDomainResults] = useState<{
    [key: string]: { domain: string; purchaseLink: string }[];
  }>({});
  const [npmResults, setNpmResults] = useState<{
    [key: string]: { npmName: string; purchaseLink: string }[];
  }>({});
  const [processingLogo, setProcessingLogo] = useState<string[]>([]);
  const [logoResults, setLogoResults] = useState<{
    [key: string]: string;
  }>({});
  const [processingOnePager, setProcessingOnePager] = useState<string[]>([]);
  const [onePager, setOnePager] = useState<{ [key: string]: string }>({});
  const [isOwner, setIsOwner] = useState<boolean>(false);

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
    getOwner();

    async function fetchFavoritedStatus() {
      const { data: favoritedData, error } = await supabase
        .from("names")
        .select("name, favorited");
      if (error) {
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
    fetchFavoritedStatus();
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
    } catch (error) {
      console.log(error);
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
        const parsedName = name.split(" ")[0];
        const response = await fetch(
          `/find-domain-availability?query=${parsedName}`
        );
        const data = await response.json();
  
        const updatedResults: {
          [key: string]: { domain: string; purchaseLink: string }[];
        } = { ...domainResults };
  
        for (const result of data.availabilityResults) {
          if (result.available) {
            const domain = result.domain;
            const purchaseLink = `https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=${domain}`;
            if (!updatedResults[name]) {
              updatedResults[name] = [{ domain, purchaseLink }];
            } else {
              updatedResults[name].push({ domain, purchaseLink });
            }
          }
        }
  
        setDomainResults(updatedResults);
  
        if (Object.keys(updatedResults).length === 0) {
          toast({
            description: "No available domain results for this name",
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingDomains((prev) => prev.filter((n) => n !== name));
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
        const response = await fetch("/find-npm-names", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate npm names");
        }
        const data = await response.json();
        let npmNames = data.response.split("\n").map((line: any) => {
          return line.replace(/^\d+\.\s*/, "").trim();
        });

        npmNames = [
          name,
          ...npmNames.filter(
            (n: string) => n.toLowerCase() !== name.toLowerCase()
          ),
        ];

        const npmAvailability: {
          npmName: string;
          purchaseLink: string;
        }[] = [];

        for (const npmName of npmNames) {
          const response = await fetch(
            `/find-npm-availability?query=${npmName}`
          );
          const data = await response.json();
          if (data.available) {
            const npmCommand = `npm i ${npmName.toLowerCase()}`;
            const purchaseLink = `https://www.npmjs.com/package/${npmName}`;
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
        const { data: description } = await supabase
          .from("names")
          .select()
          .eq("id", namesList[name])
          .single();
        const response = await fetch("/generate-logo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            description: description.description,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate logo");
        }

        const data = await response.json();

        setLogoResults((prev) => ({
          ...prev,
          [name]: data.imageUrl,
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
          throw new Error("Failed to generate one pager content");
        }
        const data = await response.json();

        const content = data.response;

        if (content) {
          const response = await fetch(
            `/one-pager?content=${encodeURIComponent(
              JSON.stringify(content)
            )}&nameData=${encodeURIComponent(
              JSON.stringify(nameData)
            )}&userData=${encodeURIComponent(JSON.stringify(userData))}`
          );

          if (!response.ok) {
            throw new Error("Failed to generate pdf");
          }

          const data = await response.json();

          window.open(data.link, "_blank");

          setOnePager((prev) => ({
            ...prev,
            [name]: data.link,
          }));
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setProcessingOnePager((prev) => prev.filter((n) => n !== name));
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          description: "Copied to clipboard",
        });
      })
      .catch((error) => {
        console.error("Error copying to clipboard: ", error);
        toast({
          variant: "destructive",
          description: "Failed to copy to clipboard",
        });
      });
  };

  return (
    <div>
      <Table className="w-full">
        <TableBody>
          {Object.keys(namesList).map((name, index) => (
            <React.Fragment key={index}>
              <TableRow>
                <TableCell className="flex-1">
                  <div className="flex items-center justify-between w-full">
                    <span>{name}</span>
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              disabled={processingDomains.includes(name)}
                              onClick={() => findDomainNames(name)}
                            >
                              {processingDomains.includes(name) ? (
                                <Icons.spinner />
                              ) : (
                                <Icons.domain />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {domainResults[name]
                                ? "Hide domain names"
                                : "Find available domain names"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              disabled={processingNpm.includes(name)}
                              onClick={() => findNpmNames(name)}
                            >
                              {processingNpm.includes(name) ? (
                                <Icons.spinner />
                              ) : (
                                <Icons.npmPackage />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {npmResults[name]
                                ? "Hide npm package names"
                                : "Find available npm package names"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              disabled={processingLogo.includes(name)}
                              onClick={() => generateLogo(name)}
                            >
                              {processingLogo.includes(name) ? (
                                <Icons.spinner />
                              ) : (
                                <Icons.generate />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {logoResults[name]
                                ? "Hide logo"
                                : "Generate logo"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {isOwner && (
                        <div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  disabled={processingOnePager.includes(name)}
                                  onClick={() => createOnePager(name)}
                                >
                                  {processingOnePager.includes(name) ? (
                                    <Icons.spinner />
                                  ) : (
                                    <Icons.onePager />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Generate one pager</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => toggleFavoriteName(name)}
                                  variant="ghost"
                                >
                                  {favoritedNames[name] ? (
                                    <Icons.unfavorite />
                                  ) : (
                                    <Icons.favorite />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {favoritedNames[name]
                                    ? "Remove from favorites"
                                    : "Add to favorites"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              {domainResults[name] && Object.keys(domainResults).length > 0 &&
                domainResults[name].map((result, idx) => (
                  <TableRow key={`${name}-availability-${idx}`}>
                    <TableCell className="flex-1">
                      <div className="flex items-center justify-between w-full">
                        <Link
                          href={result.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue"
                        >
                          {result.domain}
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => copyToClipboard(result.purchaseLink)}
                        >
                          <Icons.copy />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {npmResults[name] &&
                npmResults[name].map((result, idx) => (
                  <TableRow key={`${name}-availability-${idx}`}>
                    <TableCell className="flex-1">
                      <div className="flex items-center justify-between w-full">
                        <Link
                          href="https://docs.npmjs.com/creating-and-publishing-scoped-public-packages"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue"
                        >
                          {result.npmName}
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => copyToClipboard(result.npmName)}
                        >
                          <Icons.copy />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {logoResults[name] && (
                <TableRow key={`${name}-logo`}>
                  <TableCell colSpan={2} className="flex justify-center">
                    <div className="flex items-center justify-between w-full">
                      <Link href={logoResults[name]}>
                        <Image
                          src={logoResults[name]}
                          alt={name}
                          width={200}
                          height={200}
                        />
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => copyToClipboard(logoResults[name])}
                      >
                        <Icons.copy />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
