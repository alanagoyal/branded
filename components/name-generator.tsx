"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
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
import { Separator } from "./ui/separator";
import { LengthSelector } from "./length-selector";
import { SliderProps } from "@radix-ui/react-slider";
import { Input } from "./ui/input";
import { NamesTable } from "./names-table";

const formSchema = z.object({
  description: z.string().max(160).min(4),
  wordToInclude: z.string().optional(),
});

export function NameGenerator() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      wordToInclude: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState([]);
  const [minLength, setMinLength] = useState<SliderProps["defaultValue"]>([6]);
  const [maxLength, setMaxLength] = useState<SliderProps["defaultValue"]>([10]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("wordToInclude:", values.wordToInclude);
    setIsLoading(true); // Set loading to true when the request starts
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
        }), // Send the form values as JSON
      });

      if (!response.ok) {
        throw new Error("Failed to generate startup name");
      }

      const data = await response.json(); // Parse the JSON response
      const namesArray = data.response.split("\n").map((line: any) => {
        return line.replace(/^\d+\.\s*/, "").trim(); // Remove the numbering and trim whitespace
      });
      setNamesList(namesArray); // Set the names list to the parsed response
      form.reset(); // Reset the form after submission
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false); // Set loading to false when the request completes or fails
    }
  }

  console.log(namesList);

  return (
    <>
      <div className="hidden h-full flex-col md:flex">
        <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Namebase</h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <div className="hidden space-x-2 md:flex"></div>
          </div>
        </div>
        <Separator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="container h-full py-6">
              <div className="grid h-full items-stretch gap-6">
                <div className="">
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
                </div>
                <div className="flex-col space-y-4 sm:flex">
                  <LengthSelector
                    minLength={minLength}
                    maxLength={maxLength}
                    onMinLengthChange={setMinLength}
                    onMaxLengthChange={setMaxLength}
                  />
                  <FormField
                    control={form.control}
                    name="wordToInclude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Include Word (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Choose a word to be included in the generated domain
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Submit"}
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
