"use client";
import { createClient } from "@/utils/supabase/client";
import { Icons } from "./icons";
import { IoTerminalOutline } from "react-icons/io5";
import { BsGlobe2 } from "react-icons/bs";
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

export function NamesTable({
  isOwner,
  namesList,
}: {
  isOwner: boolean;
  namesList: any;
}) {
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
    [key: string]: { npmPackage: string; purchaseLink: string };
  }>({});

  useEffect(() => {
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
  }, []);

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

  async function findNpmNames(name: string) {
    try {
      setProcessingNpm((prev) => [...prev, name]);
      const showingAvailability = npmResults[name];
      if (showingAvailability) {
        setNpmResults({});
      } else {
          const response = await fetch("/find-npm-names", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name
            }),
          });
    
          if (!response.ok) {
            throw new Error("Failed to generate startup name");
          }
          const data = await response.json();
          const npmNames = data.response.split("\n").map((line: any) => {
            return line.replace(/^\d+\.\s*/, "").trim();
          });

          // get npm package availability 
          console.log(npmNames)
        }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingNpm((prev) => prev.filter((n) => n !== name));
    }
  }

  async function checkNpmAvailability(name: string) {
    try {
    
        const response = await fetch(`/find-npm-availability?query=${name}`);
        const data = await response.json();
        if (data.available) {
          setNpmResults((prev) => ({
            ...prev,
            [name]: {
              npmPackage: `npm i ${name.toLowerCase()}`,
              purchaseLink: `https://www.npmjs.com/package/${name}`,
            },
          }));
        } else {
          setNpmResults((prev) => ({
            ...prev,
            [name]: {
              npmPackage: `${name} is not available as an npm package name is not available`,
              purchaseLink: ``,
            },
          }));
        }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingNpm((prev) => prev.filter((n) => n !== name));
    }
  }

  async function checkAvailability(name: string) {
    try {
      setProcessingDomains((prev) => [...prev, name]);
      const showingAvailability = domainResults[name];
      if (showingAvailability && showingAvailability.length > 0) {
        setDomainResults((prev) => ({
          ...prev,
          [name]: [],
        }));
      } else {
        const response = await fetch(`/find-domains?query=${name}`);
        const data = await response.json();
        if (data.domains) {
          setDomainResults((prev) => ({
            ...prev,
            [name]: data.domains.slice(0, 3),
          }));
        } else {
          throw new Error(data.error || "An unknown error occurred");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingDomains((prev) => prev.filter((n) => n !== name));
    }
  }

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
                      <Button
                        variant="ghost"
                        disabled={processingDomains.includes(name)}
                        onClick={() => checkAvailability(name)}
                      >
                        <BsGlobe2 />
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={processingNpm.includes(name)}
                        onClick={() => checkNpmAvailability(name)}
                      >
                        <IoTerminalOutline />
                      </Button>
                      {isOwner && (
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
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              {npmResults[name] && (
                <TableRow>
                  <TableCell>
                    <Link
                      href={npmResults[name].purchaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue"
                    >
                      {npmResults[name].npmPackage}
                    </Link>
                  </TableCell>
                </TableRow>
              )}
              {domainResults[name] &&
                domainResults[name].map((result, idx) => (
                  <TableRow key={`${name}-availability-${idx}`}>
                    <TableCell>
                      <Link
                        href={result.purchaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue"
                      >
                        {result.domain}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
