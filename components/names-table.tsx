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
import { useState } from "react";
import { toast } from "./ui/use-toast";

export function NamesTable({ namesList }: { namesList: any }) {
  const supabase = createClient();
  const [favoritedNames, setFavoritedNames] = useState<{
    [key: string]: boolean;
  }>({});

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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Names</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.keys(namesList).map((name, index) => (
          <TableRow key={index}>
            <TableCell>{name}</TableCell>
            <TableCell>
              <Button onClick={() => toggleFavoriteName(name)} variant="ghost">
                {favoritedNames[name] ? (
                  <Icons.unfavorite />
                ) : (
                  <Icons.favorite />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
