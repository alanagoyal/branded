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
import { useRouter } from "next/navigation";

export async function FavoritesTable({ favorites }: { favorites: any }) {
  const router = useRouter();
  const supabase = createClient();

  async function toggleFavoriteName(id: string) {
    try {
      const isFavorited = favorites.find(
        (favorite: any) => favorite.id === id
      ).favorited;

      const { error } = await supabase
        .from("names")
        .update({ favorited: !isFavorited })
        .eq("id", id);

      toast({
        description: isFavorited
          ? "Removed from favorites"
          : "Added to favorites",
      });

      router.refresh();
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <Table>
      <TableBody>
        {favorites.map((favorite: any, index: any) => (
          <TableRow key={index} className="flex items-center justify-between">
            <TableCell>{favorite.name}</TableCell>
            <TableCell className="ml-auto">
              <Button
                onClick={() => toggleFavoriteName(favorite.id)}
                variant="ghost"
              >
                {favorite.favorited ? <Icons.unfavorite /> : <Icons.favorite />}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
