"use client";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";

export interface SignupFormData {
  email: string;
  password: string;
}

interface SignupFormProps {
  signup: (formData: SignupFormData) => Promise<void>;
}
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, {
    message: "Username must be at least 6 characters.",
  }),
});

export function SignupForm({ signup }: SignupFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    console.log(data);
    toast({
      title: "Confirm your account",
      description: `An email has been sent to ${data.email}.`,
    });
    await signup(data);
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
                    <FormMessage />
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
            <Button type="submit">Sign Up</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
