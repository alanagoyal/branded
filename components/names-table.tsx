"use client";
import { createClient } from "@/utils/supabase/client";
import { Icons } from "./icons";
import { Button } from "./ui/button";
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

export function NamesTable({
  isOwner,
  namesList,
}: {
  isOwner: boolean;
  namesList: any;
}) {
  const supabase = createClient();
  const [favoritedNames, setFavoritedNames] = useState<{
    [key: string]: boolean;
  }>({});
  const [availabilityResults, setAvailabilityResults] = useState<{
    [key: string]: string[];
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

  async function checkAvailability(name: string) {
    try {
      const showingAvailability = availabilityResults[name];
      if (showingAvailability) {
        setAvailabilityResults({});
      } else {
        const response = await fetch(`/find-domains?query=${name}`);
        const data = await response.json();
        if (data.domains) {
          setAvailabilityResults((prev) => ({
            ...prev,
            [name]: data.domains.slice(0, 3),
          }));
        } else {
          throw new Error(data.error || "An unknown error occurred");
        }
      }
    } catch (error) {
      console.error(error);
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
                        onClick={() => checkAvailability(name)}
                      >
                        <Icons.domain />
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
              {availabilityResults[name] &&
                availabilityResults[name].map((result, idx) => (
                  <TableRow key={`${name}-availability-${idx}`}>
                    <TableCell>{result}</TableCell>
                  </TableRow>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
