"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Icons } from "./icons";
import { Share } from "./share";
import { toast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { NamesDisplay } from "./names-display";
import { Switch } from "./ui/switch";
import {
  BusinessPlanEntitlements,
  FreePlanEntitlements,
  ProPlanEntitlements,
  UnauthenticatedEntitlements,
} from "@/lib/plans";

const formSchema = z.object({
  description: z.string().max(280).min(4),
  wordToInclude: z.string().optional(),
  wordPlacement: z.enum(["start", "end", "any"]).optional(),
  minLength: z
    .number()
    .min(4)
    .max(14)
    .refine((value) => value <= 14, {
      message: "Minimum length cannot be greater than maximum length",
    }),
  maxLength: z
    .number()
    .min(4)
    .max(14)
    .refine((value) => value >= 4, {
      message: "Maximum length cannot be smaller than minimum length",
    }),
  style: z
    .enum([
      "one_word",
      "portmanteau",
      "alternative_spelling",
      "foreign_language",
      "historical",
      "literary",
      "any",
    ])
    .optional(),
  tld: z.boolean().optional(),
});

export function NameGenerator({ user, names }: { user: any; names: any }) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDescription = searchParams.get("description");
  const sessionId = useMemo(
    () => searchParams.get("session_id") || uuidv4(),
    [searchParams]
  );

  let defaultValues = {};
  if (names) {
    defaultValues = {
      description: names[0].description,
      wordToInclude: names[0].word_to_include,
      wordPlacement: names[0].word_placement,
      style: names[0].word_style,
      minLength: names[0].min_length,
      maxLength: names[0].max_length,
      tld: names[0].tld,
    };
  } else {
    defaultValues = {
      description: queryDescription || "",
      wordToInclude: "",
      wordPlacement: "any",
      style: "any",
      minLength: 5,
      maxLength: 10,
      tld: false,
    };
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState<Array<{ id: string; name: string }>>([]);
  const [idsList, setIdsList] = useState<string[]>([]);
  const autoSubmitted = useRef(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [billingPortalUrl, setBillingPortalUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchCustomerId();
    }
  }, [user]);

  async function fetchCustomerId() {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && profile.customer_id) {
        setCustomerId(profile.customer_id);
        fetchBillingSession(profile.customer_id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchBillingSession(customerId: string) {
    try {
      const response = await fetch(`/portal-session?customer_id=${customerId}`);
      const data = await response.json();
      if (response.ok) {
        setBillingPortalUrl(data.session.url);
      }
    } catch (error) {
      console.error("Failed to fetch billing session:", error);
    }
  }

  useEffect(() => {
    if (queryDescription && !autoSubmitted.current) {
      autoSubmitted.current = true;
      const submitForm = async () => {
        await onSubmit(form.getValues());
      };
      submitForm();
      router.push(`/new?session_id=${sessionId}`);
    }
  }, [queryDescription, autoSubmitted]);

  async function clear() {
    form.reset();
    setNamesList([]);
  }

  useEffect(() => {
    if (names) {
      const updatedNamesList = names.map(name => ({ id: name.id, name: name.name }));

      setNamesList(updatedNamesList);
      setIdsList(names.map(name => name.id));
    }
  }, [names, user]);

  async function handleRemoveName(nameId: string) {
    setNamesList(prevState => prevState.filter(item => item.id !== nameId));
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const oneMonthAgo = new Date(
      new Date().setMonth(new Date().getMonth() - 1)
    ).toISOString();

    try {
      let namesLimit = UnauthenticatedEntitlements.nameGenerations;

      if (user) {
        namesLimit = FreePlanEntitlements.nameGenerations;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("plan_id")
          .eq("id", user.id)
          .single();

        if (profile && profile.plan_id) {
          const response = await fetch(
            `/fetch-plan?plan_id=${profile.plan_id}`
          );
          const data = await response.json();
          if (response.ok) {
            if (data.planName === "Pro") {
              namesLimit = ProPlanEntitlements.nameGenerations;
            } else if (data.planName === "Business") {
              namesLimit = BusinessPlanEntitlements.nameGenerations;
            }
          }
        }
      }

      const { data: generatedNames, error: generateError } = await supabase
        .from("names")
        .insert(
          names.map(name => ({
            name: name.name,
            created_at: new Date(),
            description: values.description,
            word_to_include: values.wordToInclude,
            word_placement: values.wordPlacement,
            word_style: values.style,
            min_length: values.minLength,
            max_length: values.maxLength,
            tld: values.tld,
            created_by: user.id
          }))
        );
        
      if (generatedNames) {
        setNamesList(generatedNames.map(name => ({
          id: name.id,
          name: name.name
        })));
        setIdsList(generatedNames.map(name => name.id));
      } else {
        console.error("Error generating names:", generateError);
      }
    } catch (error) {
      console.error("Error during form submission:", error);
    } finally {
      setIsLoading(false);
    }
  }
}

  return (
    <>
      <div className="flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex h-full flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What will you build?"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe your project in a few sentences
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex-col space-y-4 sm:flex">
                {" "}
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Style</SelectLabel>
                            <SelectItem value="one_word">
                              {`One Word (e.g. "Lattice")`}
                            </SelectItem>
                            <SelectItem value="portmanteau">
                              {`Portmanteau (e.g. "Pinterest")`}
                            </SelectItem>
                            <SelectItem value="alternative_spelling">
                              {`Alternative Spelling (e.g. "Deel")`}
                            </SelectItem>
                            <SelectItem value="foreign_language">
                              {`Foreign Language (e.g. "Samsara")`}
                            </SelectItem>
                            <SelectItem value="historical">
                              {`Historical Reference (e.g. "Tesla")`}
                            </SelectItem>
                            <SelectItem value="literary">
                              {`Literary Reference (e.g. "Palantir")`}
                            </SelectItem>
                            <SelectItem value="any">Surprise Me</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a style for your name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {form.watch("style") !== "one_word" &&
                form.watch("style") !== "any" && (
                  <div className="flex-col space-y-4 sm:flex">
                    <FormField
                      control={form.control}
                      name="wordToInclude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Optional Word</FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="off" />
                          </FormControl>
                          <FormDescription>
                            {form.watch("style") === "portmanteau"
                              ? "The generated names will include this word"
                              : form.watch("style") === "alternative_spelling"
                              ? "The generated names will be an alternative spelling of this word"
                              : form.watch("style") === "historical"
                              ? "The generated names will a historical reference related to this word"
                              : form.watch("style") === "literary"
                              ? "The generated names will be a literary reference related to this word"
                              : form.watch("style") === "foreign_language"
                              ? "The generated names will reference this word in a foreign language"
                              : "Choose a word to include in your name"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              {form.watch("style") === "portmanteau" && (
                <div className="flex-col space-y-4 sm:flex">
                  <FormField
                    control={form.control}
                    name="wordPlacement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placement</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Placement</SelectLabel>
                              <SelectItem value="start">Start </SelectItem>
                              <SelectItem value="end">End</SelectItem>
                              <SelectItem value="any">Anywhere</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the placement of the word to include
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <div className="grid gap-2 pt-2">
                <div className="grid gap-4">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="minLength"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-4 rounded-lg border p-4">
                          <div className="flex flex-row items-center justify-between">
                            <FormLabel htmlFor="temperature">
                              Minimum Length
                            </FormLabel>
                            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={4}
                              max={14}
                              defaultValue={[field.value]}
                              value={[form.getValues().minLength]}
                              step={1}
                              onValueChange={(vals) => {
                                const minValue = Math.min(
                                  vals[0],
                                  form.getValues().maxLength
                                );
                                const newValue = Math.max(minValue, 4);
                                field.onChange(newValue);
                              }}
                              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                              aria-label="Min Length"
                            />
                          </FormControl>
                          <FormDescription>
                            Choose the minimum length for your name
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid gap-4 pt-2">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="maxLength"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-4 rounded-lg border p-4">
                          <div className="flex flex-row items-center justify-between">
                            <FormLabel htmlFor="temperature">
                              Maximum Length
                            </FormLabel>
                            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              id="max-length"
                              min={4}
                              max={14}
                              defaultValue={[field.value]}
                              value={[form.getValues().maxLength]}
                              step={1}
                              onValueChange={(vals) => {
                                const maxValue = Math.max(
                                  vals[0],
                                  form.getValues().minLength
                                );
                                const newValue = Math.min(maxValue, 14);
                                field.onChange(newValue);
                              }}
                              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                              aria-label="Max Length"
                            />
                          </FormControl>
                          <FormDescription>
                            Choose the maximum length for your name
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex h-full flex-col space-y-4">
                    <FormField
                      control={form.control}
                      name="tld"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Domain Availability</FormLabel>
                            <FormDescription>
                              Optimize for names with .com availability—this may
                              take up to 30 seconds and generate fewer results
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Icons.spinner /> : "Go"}
                </Button>
                <Button
                  onClick={clear}
                  className="w-full"
                  type="button"
                  variant="ghost"
                >
                  Reset
                </Button>
              </div>
            </div>
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
            <Share idString={idsList.join(",")}
            />
          </div>
        )}
      </div>
    </>
  );
}
