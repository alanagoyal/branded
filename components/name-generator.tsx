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

const formSchema = z.object({
  description: z.string().max(160).min(4),
});

export function NameGenerator() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState([]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true); // Set loading to true when the request starts
    try {
      const response = await fetch("/generate-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: values.description }), // Send the form values as JSON
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="What will you build?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Submit"}
        </Button>
      </form>
      <ul className="list-disc space-y-2">
        {namesList.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
    </Form>
  );
}
