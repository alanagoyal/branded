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
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export interface SignupFormData {
  email: string;
  password: string;
}

interface SignupFormProps {
  signup: (formData: SignupFormData, idString: string, origin: string) => Promise<void>;
  idString: string;
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, {
    message: "Username must be at least 6 characters.",
  }),
});

export function SignupForm({ signup, idString }: SignupFormProps) {
  const supabase = createClient();
  const router = useRouter()
  const origin = window.location.origin

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    const { data: emailMatch, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", form.getValues("email"));

    if (emailMatch && emailMatch.length > 0) {
      toast({
        variant: "destructive",
        title: "Account already exists",
        description: "Please sign in or sign up with another email",
      });
    } else {
      toast({
        title: "Confirm your account",
        description: `An email has been sent to ${data.email}`,
      });
      await signup(data, idString, origin);
    }
    router.push(`/new?ids=${idString}`);
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
                      <Input
                        placeholder="name@email.com"
                        autoComplete="off"
                        {...field}
                      ></Input>
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
                        autoComplete="off"
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
