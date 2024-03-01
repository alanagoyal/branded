"use client";
import { createClient } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "./ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const profileFormSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileForm({
  user,
  userData,
}: {
  user: any;
  userData: any;
}) {
  const supabase = createClient();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: userData.email || "",
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const updates = {
        email: userData.email,
        first_name: data.first_name,
        last_name: data.last_name,
        updated_at: new Date(),
      };

      let { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (error) throw error;
      toast({
        description: "Profile updated",
      });
    } catch (error) {
      console.log(error);
      toast({
        description: "Error updating profile",
      });
    }
  }
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {" "}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base mx-2">Email</FormLabel>
                </div>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base mx-2">First Name</FormLabel>
                </div>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base mx-2">Last Name</FormLabel>
                </div>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="py-1 flex justify-center">
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
