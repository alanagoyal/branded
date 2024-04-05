"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Share } from "./share";
import { toast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { NamesDisplay } from "./names-display";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

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
  const sessionId = searchParams.get("session_id");
  const [isScreenWide, setIsScreenWide] = useState(false);

  useEffect(() => {
    setIsScreenWide(window.innerWidth >= 768);
  }, []);

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
  const [namesList, setNamesList] = useState<{ [name: string]: string }>({});
  const [idsList, setIdsList] = useState<string[]>([]);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (queryDescription && !autoSubmitted.current) {
      autoSubmitted.current = true;
      const submitForm = async () => {
        await onSubmit(form.getValues());
      };
      submitForm();
      router.push('/new')
    }
  }, [queryDescription, autoSubmitted]);

  async function clear() {
    form.reset();
    setNamesList({});
  }

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setNamesList({});
    setIdsList([]);

    const oneDayAgo = new Date(
      new Date().getTime() - 24 * 60 * 60 * 1000
    ).toISOString();

    try {
      if (user) {
        const { data: names, error } = await supabase
          .from("names")
          .select("*", { count: "exact" })
          .eq("created_by", user.id)
          .gte("created_at", oneDayAgo);

        if (names!.length >= 36) {
          toast({
            title: "Uh oh! Out of generations",
            description:
              "You've reached your daily limit for name generations.",
          });
          return;
        }
      } else {
        const { data: names, error } = await supabase
          .from("names")
          .select("*", { count: "exact" })
          .eq("session_id", sessionId)
          .gte("created_at", oneDayAgo);

        if (names!.length >= 9) {
          toast({
            title: "Uh oh! Out of generations",
            description:
              "You've reached your daily limit for name generations. Sign up for an account to continue.",
            action: (
              <ToastAction
                onClick={() => router.push("/signup")}
                altText="Sign up"
              >
                Sign up
              </ToastAction>
            ),
          });
          return;
        }
      }

      const response = await fetch("/generate-names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: values.description,
          minLength: values.minLength,
          maxLength: values.maxLength,
          wordToInclude: values.wordToInclude,
          wordPlacement: values.wordPlacement,
          style: values.style,
          tld: values.tld,
        }),
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          description: "Error generating startup names",
        });
        throw new Error("Failed to generate startup names");
      }

      const data = await response.json();

      if (data.fallbackMessage) {
        toast({
          title: "Heads up! No .com names available",
          description: data.fallbackMessage,
        });
      }

      if (data.response.length === 0) {
        toast({
          title: "Uh oh! No names generated",
          description:
            "Looks like we can't find any names that fit your critera. Please try again.",
        });
      }

      const ids: string[] = [];
      for (const name of data.response) {
        try {
          const updates = {
            name: name,
            description: values.description,
            word_to_include: values.wordToInclude,
            word_placement: values.wordPlacement,
            word_style: values.style,
            min_length: values.minLength,
            max_length: values.maxLength,
            created_at: new Date(),
            created_by: user?.id,
            session_id: sessionId,
          };

          let { data, error } = await supabase
            .from("names")
            .upsert(updates)
            .select("id")
            .single();

          if (error) throw error;

          if (data) {
            ids.push(data?.id);
            setNamesList((prevState) => ({
              ...prevState,
              [name]: data?.id,
            }));
          }
        } catch (error) {
          console.error(error);
        }
      }
      setIdsList(ids);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
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
        {Object.keys(namesList).length > 0 && (
          <div className="flex-col pt-4 space-y-4 sm:flex">
            <NamesDisplay
              namesList={namesList}
              user={user}
              verticalLayout={false}
            />
            <Share idString={idsList.join("")} />
          </div>
        )}
      </div>
    </>
  );
}
