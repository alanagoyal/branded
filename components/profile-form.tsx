"use client";
import { createClient } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "./ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  BusinessPlanEntitlements,
  FreePlanEntitlements,
  ProPlanEntitlements,
  TestBusinessPlanEntitlements,
  TestFreePlanEntitlements,
  TestProPlanEntitlements,
} from "@/lib/plans";
import { useEffect, useState } from "react";
import Link from "next/link";

const profileFormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
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
      name: userData.name || "",
    },
  });
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    async function fetchUserPlan() {
      let plan = "";
      if (userData.plan_id === FreePlanEntitlements.id || userData.plan_id === TestFreePlanEntitlements.id) {
        plan = "Free";
      } else if (userData.plan_id === ProPlanEntitlements.id || userData.plan_id === TestProPlanEntitlements.id) {
        plan = "Pro";
      } else if (userData.plan_id === BusinessPlanEntitlements.id || userData.plan_id === TestBusinessPlanEntitlements.id) {
        plan = "Business";
      }
      setPlanName(plan); 
    }
  
    fetchUserPlan();
  }, [userData.plan_id]); 

  async function onSubmit(data: ProfileFormValues) {
    try {
      const updates = {
        email: userData.email,
        name: data.name,
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
      console.error(error);
      toast({
        variant: "destructive",
        description: "Error updating profile",
      });
    }
  }
  return (
    <div className="flex flex-col ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormDescription>
                  This is the email you log in with
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name that will be displayed on your profile
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="py-1 flex justify-center w-full">
            <Button className="w-full" type="submit">
              Update
            </Button>
          </div>
        </form>
      </Form>
      <div className="pt-2 text-sm text-gray-500">
        You are currently on the <strong>{planName} Plan</strong>. To change your plan, please
        visit the <a href="/pricing" className="underline">pricing page.</a>
      </div>
    </div>
  );
}
