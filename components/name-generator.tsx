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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

const formSchema = z.object({
  description: z.string().max(280).min(4),
  wordToInclude: z.string().optional(),
  wordPlacement: z.enum(["start", "end", "any"]).optional(),
});

export function NameGenerator({ user }: { user: any }) {
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      wordToInclude: "",
      wordPlacement: "any",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState([]);
  const [minLength, setMinLength] = useState<SliderProps["defaultValue"]>([6]);
  const [maxLength, setMaxLength] = useState<SliderProps["defaultValue"]>([10]);

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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate startup name");
      }

      const data = await response.json();
      const namesArray = data.response.split("\n").map((line: any) => {
        return line.replace(/^\d+\.\s*/, "").trim();
      });
      setNamesList(namesArray);
      for (const name of namesArray) {
        try {
          let { data, error } = await supabase.from("names").insert([
            {
              name: name,
              description: values.description,
              word_to_include: values.wordToInclude,
              word_placement: values.wordPlacement,
              min_length: minLength![0],
              max_length: maxLength![0],
              created_at: new Date(),
              created_by: user?.id,
            },
          ]);
          if (error) throw error;
        } catch (error) {
          console.log(error);
        }
      }
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
            <div className="container max-w-lg mx-auto py-6">
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
                        <FormLabel>Word to Include (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="off" />
                        </FormControl>
                        <FormDescription>
                          Choose a word to include in the generated names
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("wordToInclude") && (
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
                              <SelectItem value="start">Start </SelectItem>
                              <SelectItem value="end">End</SelectItem>
                              <SelectItem value="any">Anywhere</SelectItem>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Go"}
                </Button>
                <div className="flex-col space-y-4 sm:flex">
                  {namesList.length === 0 ? (
                    <div></div>
                  ) : (
                    <NamesTable names={namesList} />
                  )}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
