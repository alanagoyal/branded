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
import { toast } from '@/components/ui/use-toast'; // Added import for toast
import { useRouter } from 'next/router'; // Added import for useRouter for handling successful logins

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";

export interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  // Updated the login function type to reflect that it may return an object with error
  login: (formData: LoginFormData) => Promise<void | { error: any }>;
}
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: "Username must be at least 6 characters.",
  }),
});

export function LoginForm({ login }: LoginFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter(); // Initialized useRouter for redirecting after successful login

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data);
    if (result?.error) {
      let errorMessage = "An unexpected error occurred. Please try again later.";
      switch(result.error.message) { // Assuming 'message' correctly references the error returned by login
        case 'Email not found':
          errorMessage = "No account associated with this email. Please sign up.";
          break;
        case 'Invalid password':
          errorMessage = "Incorrect password. Try again.";
          break;
      }
      toast({ title: 'Error', description: errorMessage });
    } else {
      router.push('/dashboard'); // Redirecting to dashboard on successful login
    }
  };

  return (
    <div>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <FormField
              control={control}
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
              control={control}
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
        </div>
      </Form>
    </div>
  );
}
