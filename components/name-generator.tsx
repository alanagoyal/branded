"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

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
import { LengthSelector } from "./length-selector";
import { Input } from "./ui/input";
import { NamesTable } from "./names-table";
import { SliderProps } from "@radix-ui/react-slider";
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Share } from "./share";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const formSchema = z.object({
  description: z.string().max(280).min(4),
  wordToInclude: z.string().optional(),
  wordPlacement: z.enum(["start", "end", "any"]).optional(),
  style: z
    .enum([
      "one_word",
      "two_words",
      "portmanteau",
      "alternative_spelling",
      "foreign_language",
      "historical",
      "any",
    ])
    .optional(),
});

export function NameGenerator({ user }: { user: any }) {
  const supabase = createClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      wordToInclude: "",
      wordPlacement: "any",
      style: "any",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState<{ [name: string]: string }>({});
  const [idsList, setIdsList] = useState<string[]>([]);
  const [minLength, setMinLength] = useState<SliderProps["defaultValue"]>([6]);
  const [maxLength, setMaxLength] = useState<SliderProps["defaultValue"]>([10]);

  async function clear() {
    form.reset();
    setNamesList({});
  }

  const isFormFilled = form.watch("description");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch("/generate-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: values.description,
          minLength: minLength,
          maxLength: maxLength,
          wordToInclude: values.wordToInclude,
          wordPlacement: values.wordPlacement,
          style: values.style,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate startup name");
      }

      const data = await response.json();
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
            min_length: minLength![0],
            max_length: maxLength![0],
            created_at: new Date(),
            created_by: user?.id,
          };

          let { data, error } = await supabase
            .from("names")
            .upsert(updates)
            .select("id")
            .single();

          if (error) throw error;

          if (data) {
            ids.push(data?.id) 
            setNamesList((prevState) => ({
              ...prevState,
              [name]: data?.id,
            }));
          }
        } catch (error) {
          console.log(error);
        }
      }
      setIdsList(ids) 
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
                            <SelectItem value="one_word">One Word</SelectItem>
                            <SelectItem value="two_words">Two Words</SelectItem>
                            <SelectItem value="portmanteau">
                              Portmanteau
                            </SelectItem>
                            <SelectItem value="alternative_spelling">
                              Alternative Spelling
                            </SelectItem>
                            <SelectItem value="foreign_language">
                              Foreign Language
                            </SelectItem>
                            <SelectItem value="historical">
                              Historical Reference
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
              <div className="flex-col space-y-4 sm:flex">
                <LengthSelector
                  minLength={minLength}
                  onMinLengthChange={setMinLength}
                  maxLength={maxLength}
                  onMaxLengthChange={setMaxLength}
                />
              </div>
              <div className="flex-col space-y-4 sm:flex">
                <FormField
                  control={form.control}
                  name="wordToInclude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("style") === "two_words" ||
                        form.watch("style") === "portmanteau" ||
                        form.watch("style") === "any"
                          ? "Word to to Include (Optional)"
                          : form.watch("style") === "alternative_spelling" ||
                            form.watch("style") === "historical" ||
                            form.watch("style") === "foreign_language" ||
                            form.watch("style") === "one_word"
                          ? "Word to Inspire (Optional)"
                          : "Word to Include (Optional)"}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" />
                      </FormControl>
                      <FormDescription>
                        {form.watch("style") === "two_words" ||
                        form.watch("style") === "portmanteau" ||
                        form.watch("style") === "any"
                          ? "Choose a word to include in your name"
                          : form.watch("style") === "alternative_spelling" ||
                            form.watch("style") === "historical" ||
                            form.watch("style") === "foreign_language" ||
                            form.watch("style") === "one_word"
                          ? "Choose a word to inspire your name"
                          : "Choose a word to include in your name"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {form.watch("wordToInclude") &&
                (form.watch("style") === "two_words" ||
                  form.watch("style") === "portmanteau" ||
                  form.watch("style") === "any") && (
                  <div className="flex-col space-y-4 sm:flex">
                    {" "}
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Go"}
                  </Button>
                </DialogTrigger>
                {!isLoading && (
                  <DialogContent>
                    <DialogHeader>
                      {" "}
                      <DialogTitle>Your Names</DialogTitle>
                      <DialogDescription>
                        These are the names we generated for you
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex-col pt-4 space-y-4 sm:flex">
                      {Object.keys(namesList).length > 0 ? (
                        <NamesTable isOwner={!!user} namesList={namesList} idsList={idsList}/>
                      ) : null}
                    </div>
                    <Share idString={idsList.join("")} />
                  </DialogContent>
                )}
              </Dialog>
              {isFormFilled && (
                <Button type="button" variant="secondary" onClick={clear}>
                  Reset
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
