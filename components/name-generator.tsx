"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
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
import { NamesTable } from "./names-table";
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
import Link from "next/link";
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
import { useRouter } from "next/navigation";

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
});

export function NameGenerator({ user, names }: { user: any; names: any }) {
  const supabase = createClient();
  const router = useRouter()

  useEffect(() => {
    if (!user && !localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", uuidv4());
    }
  }, [user]);

  let defaultValues = {};
  if (names) {
    defaultValues = {
      description: names[0].description,
      wordToInclude: names[0].word_to_include,
      wordPlacement: names[0].word_placement,
      style: names[0].word_style,
      minLength: names[0].min_length,
      maxLength: names[0].max_length,
    };
  } else {
    defaultValues = {
      description: "",
      wordToInclude: "",
      wordPlacement: "any",
      style: "any",
      minLength: 5,
      maxLength: 10,
    };
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState<{ [name: string]: string }>({});
  const [idsList, setIdsList] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  async function clear() {
    form.reset();
    setNamesList({});
  }

  useEffect(() => {
    if (names) {
      const updatedNamesList: { [name: string]: string } = {};
      for (const name of names) {
        updatedNamesList[name.name] = name.id;
        if (user && name.created_by === user.id) {
          setIsOwner(true);
        }
      }
      setNamesList(updatedNamesList);
    }
  }, [names, user]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      if (user) {
        const { count, error } = await supabase
          .from("names")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id);
        if (count! >= 12) {
          toast({
            title: "Uh oh! Out of generations.",
            description: "You've reached the limit for name generations.",
          });
          return;
        }
      } else {
        const { count, error } = await supabase
          .from("names")
          .select("*", { count: "exact", head: true })
          .eq("session_id", localStorage.getItem("session_id"));

        if (count! >= 6) {
          toast({
            title: "Uh oh! Out of generations.",
            description: "You've reached the limit for name generations. Sign up for an account to continue.",
            action: <ToastAction onClick={() => router.push("/signup")} altText="Sign up">Sign up</ToastAction>,
          })
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

      if (!data) {
        toast({
          variant: "destructive",
          description: "Error generating startup names",
        });
        throw new Error("Failed to generate startup names");
      }
      const namesArray = data.response.split("\n").map((line: any) => {
        return line.replace(/^\d+\.\s*/, "").trim();
      });

      const ids: string[] = [];
      for (const name of namesArray) {
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
            session_id: localStorage.getItem("session_id"),
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
          console.log(error);
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
      <div className="min-h-screen flex flex-col">
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
                        <FormItem>
                          <FormLabel htmlFor="temperature">
                            Minimum Length
                          </FormLabel>
                          <FormDescription>
                            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                              {field.value}
                            </span>
                          </FormDescription>
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
                        <FormItem>
                          <FormLabel htmlFor="temperature">
                            Maximum Length
                          </FormLabel>
                          <FormDescription>
                            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                              {field.value}
                            </span>
                          </FormDescription>
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
                </div>
              </div>
              {names ? (
                <div className="flex flex-col space-y-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Icons.spinner /> : "Go"}
                  </Button>
                  <Link href="/new">
                    <Button
                      className="w-full"
                      type="button"
                      variant="secondary"
                    >
                      Reset
                    </Button>
                  </Link>
                  <div className="flex-col pt-4 space-y-4 sm:flex">
                    {Object.keys(namesList).length > 0 && (
                      <NamesTable namesList={namesList} user={user} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Icons.spinner /> : "Go"}
                      </Button>
                    </DialogTrigger>
                    {!isLoading && Object.keys(namesList).length > 0 && (
                      <DialogContent className="flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Your Names</DialogTitle>
                          <DialogDescription>
                            These are the names we generated for you
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-col space-y-4 sm:flex">
                          <NamesTable namesList={namesList} user={user} />
                        </div>
                        <Share idString={idsList.join("")} />
                      </DialogContent>
                    )}
                  </Dialog>
                  <Button type="button" variant="secondary" onClick={clear}>
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
