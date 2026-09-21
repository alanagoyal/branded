"use client";
import { useMemo, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { showProviderError } from "./provider-error";
import { NamesDisplay } from "./names-display";
import { mergeNameRecords, removeNameRecord, type NameRecord } from "@/lib/name-records";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "./ui/use-toast";
import { Icons } from "./icons";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Share } from "./share";

const formSchema = z.object({
  name: z.string().min(1),
});

export default function BrandGenerator({
  user,
  names,
}: {
  user: any;
  names: any;
}) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const sessionId = useMemo(
    () => searchParams.get("session_id") || uuidv4(),
    [searchParams]
  );
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState<NameRecord[]>([]);
  const idsList = namesList.map(({ id }) => id);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (names) {
      setNamesList(mergeNameRecords(names));
    }
  }, [names, user]);


  async function handleRemoveName(id: string) {
    setNamesList((records) => removeNameRecord(records, id));
  }

  async function addExistingName(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const { data: existingName, error: lookupError } = await supabase
        .from("names")
        .select("*")
        .eq("name", values.name)
        .is("description", null)
        .eq("created_by", user?.id);

      if (lookupError) throw lookupError;

      if (existingName && existingName.length > 0) {
        setNamesList((records) => mergeNameRecords(records, [existingName[0]]));
        form.reset();
        return;
      }

      const updates = {
        name: values.name,
        created_at: new Date(),
        created_by: user?.id,
        session_id: sessionId,
      };
      const { data, error } = await supabase
        .from("names")
        .insert(updates)
        .select();

      if (data) {
        setNamesList((records) => mergeNameRecords([data[0]], records));
      }

      if (error) throw error;
    } catch (error) {
      showProviderError(error);
    } finally {
      form.reset();
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(addExistingName)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="off" {...field} />
                </FormControl>
                <FormDescription>
                  Enter an existing name to see domain availability, check
                  trademarks, generate logos, and more
                </FormDescription>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Icons.spinner /> : "Go"}
          </Button>
        </form>
      </Form>
      {namesList.length > 0 && (
        <div className="flex-col pt-4 space-y-4 sm:flex">
          <NamesDisplay
            namesList={namesList}
            showRemoveButton={true}
            onRemoveName={handleRemoveName}
            user={user}
            verticalLayout={true}
          />
          <Share idString={idsList.join("")} type="brand-only" />
        </div>
      )}
    </div>
  );
}
