"use client";
import { useMemo, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { showProviderError } from "./provider-error";
import { NamesDisplay } from "./names-display";
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
  const [namesList, setNamesList] = useState<{ [name: string]: string }>({});
  const [idsList, setIdsList] = useState<string[]>([]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (names) {
      const updatedNamesList: { [name: string]: string } = {};
      for (const name of names) {
        updatedNamesList[name.name] = name.id;
      }
      setNamesList(updatedNamesList);

      for (const name of names) {
        setIdsList((prevState) => [...prevState, name.id]);
      }
    }
  }, [names, user]);


  async function handleRemoveName(name: string) {
    setNamesList((prevState) => {
      const newState = { ...prevState };
      delete newState[name];
      return newState;
    });
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
        setNamesList((prevNamesList) => ({
          ...prevNamesList,
          [existingName[0].name]: existingName[0].id,
        }));
        setIdsList((prevIdsList) => [...prevIdsList, existingName[0].id]);
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
        setNamesList((prevNamesList) => ({
          [data[0].name]: data[0].id,
          ...prevNamesList,
        }));
        setIdsList((prevIdsList) => [...prevIdsList, data[0].id]);
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
      {Object.keys(namesList).length > 0 && (
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
