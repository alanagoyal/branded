"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "./ui/use-toast";
import { createClient } from "@/utils/supabase/client";

export interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  errorMessage?: string;
}

interface LoginFormProps {
  login: (formData: LoginFormData) => Promise<LoginResponse>;
}

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: "Username must be at least 6 characters.",
  }),
});

export function LoginForm({ login }: LoginFormProps) {
  const supabase = createClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "/new",
      },
    });
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
      });
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data);
      if (response && response.errorMessage) {
        toast({
          title: "Login failed",
          description: response.errorMessage,
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again later.",
      });
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@email.com" {...field}></Input>
                    </FormControl>{" "}
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      ></Input>
                    </FormControl>{" "}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">Sign In</Button>
            <Button variant="secondary" onClick={signInWithGoogle}>Sign in with Google</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
