"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthRefresh({ idsList }: { idsList: string[] }) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        router.refresh();
        updateUserNames(session?.user.id);
      }
    });
  }, []);

  async function updateUserNames(userId: any) {
    for (const id of idsList) {
      const { data: existingEntries, error: selectError } = await supabase
        .from("names")
        .select("id")
        .eq("id", id)
        .eq("created_by", userId);

      if (selectError) {
        console.error("Error checking existence:", selectError);
        continue;
      }

      if (existingEntries.length === 0) {
        const { data, error } = await supabase
          .from("names")
          .update({ created_by: userId })
          .eq("id", id);

        if (error) {
          console.error("Error updating names:", error);
        }
      }
    }
  }

  return null;
}
