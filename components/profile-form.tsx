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
  PortalLink,
  ProPlanEntitlements,
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
  const [customerId, setCustomerId] = useState("");
  const [billingPortalUrl, setBillingPortalUrl] = useState("");

  useEffect(() => {
    fetchUserPlan();
    fetchCustomerId();
  }, []);

  function fetchUserPlan() {
    const planMapping = {
      [FreePlanEntitlements.id]: "Free",
      [ProPlanEntitlements.id]: "Pro",
      [BusinessPlanEntitlements.id]: "Business",
    };

    const plan = planMapping[userData.plan_id];
    setPlanName(plan || "Free");
  }

  async function fetchCustomerId() {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && profile.customer_id) {
        setCustomerId(profile.customer_id);
        fetchBillingSession(profile.customer_id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchBillingSession(customerId: string) {
    try {
      const response = await fetch(`/portal-session?customer_id=${customerId}`);
      const data = await response.json();
      if (response.ok) {
        setBillingPortalUrl(data.session.url);
      }
    } catch (error) {
      console.error("Failed to fetch billing session:", error);
    }
  }

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
        You are currently on the <strong>{planName} Plan</strong>.{" "}
        {customerId ? (
          <>
            To change your plan, please{" "}
            <a href={billingPortalUrl} className="underline">
              visit the billing portal
            </a>.
          </>
        ) : (
          <>
            To upgrade, please{" "}
            <a href="/pricing" className="underline">
              visit the pricing page
            </a>.
          </>
        )}
      </div>
    </div>
  );
}
