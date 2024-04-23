"use client";
import { useMemo, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { NamesDisplay } from "./names-display";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ToastAction } from "./ui/toast";
import { toast } from "./ui/use-toast";
import { Icons } from "./icons";
import {
  BusinessPlanEntitlements,
  FreePlanEntitlements,
  ProPlanEntitlements,
  UnauthenticatedEntitlements,
} from "@/lib/plans";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Share } from "./share";

const formSchema = z.object({
  name: z.string().min(1),
});

export default function BrandGenerator({ user, names }: { user: any, names: any }) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const sessionId = useMemo(
    () => searchParams.get("session_id") || uuidv4(),
    [searchParams]
  );
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string>("");
  const [billingPortalUrl, setBillingPortalUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [namesList, setNamesList] = useState<{ [name: string]: string }>({});
  const [idsList, setIdsList] = useState<string[]>([]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (names) {
      const updatedNamesList: { [name: string]: string } = {};
      for (const name of names) {
        updatedNamesList[name.name] = name.id;
      }
      setNamesList(updatedNamesList);

      for (const name of names) {
        setIdsList((prevState) => [...prevState, name.id]);
      }
    }
  }, [names, user]);

  async function clear() {
    form.reset();
  }

  useEffect(() => {
    if (user) {
      fetchCustomerId();
    }
  }, [user]);

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

  async function handleRemoveName(name: string) {
    setNamesList((prevState) => {
      const newState = { ...prevState };
      delete newState[name];
      return newState;
    });
  }

  async function addExistingName(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const oneMonthAgo = new Date(
      new Date().setMonth(new Date().getMonth() - 1)
    ).toISOString();

    try {
      let namesLimit = UnauthenticatedEntitlements.nameGenerations;

      if (user) {
        namesLimit = FreePlanEntitlements.nameGenerations;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("plan_id")
          .eq("id", user.id)
          .single();

        if (profile && profile.plan_id) {
          const response = await fetch(
            `/fetch-plan?plan_id=${profile.plan_id}`
          );
          const data = await response.json();
          if (response.ok) {
            if (data.planName === "Pro") {
              namesLimit = ProPlanEntitlements.nameGenerations;
            } else if (data.planName === "Business") {
              namesLimit = BusinessPlanEntitlements.nameGenerations;
            }
          }
        }

        const { data: names, error } = await supabase
          .from("names")
          .select("*", { count: "exact" })
          .eq("created_by", user.id)
          .gte("created_at", oneMonthAgo);

        if (names!.length >= namesLimit) {
          toast({
            title: "Uh oh! Out of generations",
            description:
              "You've reached the monthly limit for name generations. Upgrade your account to generate more names and enjoy more features.",
            action: (
              <ToastAction
                onClick={() =>
                  customerId
                    ? router.push(billingPortalUrl)
                    : router.push("/pricing")
                }
                altText="Upgrade"
              >
                Upgrade
              </ToastAction>
            ),
          });
          return;
        }
      } else {
        const { data: names, error } = await supabase
          .from("names")
          .select("*", { count: "exact" })
          .eq("session_id", sessionId)
          .gte("created_at", oneMonthAgo);

        if (names!.length >= namesLimit) {
          toast({
            title: "Uh oh! Out of generations",
            description:
              "You've reached the monthly limit for name generations. Sign up for an account to continue.",
            action: (
              <ToastAction
                onClick={() => router.push("/signup")}
                altText="Sign up"
              >
                Sign up
              </ToastAction>
            ),
          });
          return;
        }
      }

      const updates = {
        name: values.name,
        created_at: new Date(),
        created_by: user?.id,
        session_id: sessionId,
      };
      const { data, error } = await supabase
        .from("names")
        .insert(updates)
        .select();

      if (data) {
        setNamesList((prevNamesList) => ({
          [data[0].name]: data[0].id,
          ...prevNamesList,
        }));
        setIdsList((prevIdsList) => [...prevIdsList, data[0].id]);
      }

      if (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(addExistingName)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="off" onClick={clear} {...field} />
                </FormControl>
                <FormDescription>
                  Enter an existing name to see domain availability, check
                  trademarks, generate logos, and more
                </FormDescription>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Icons.spinner /> : "Go"}
          </Button>
        </form>
      </Form>
      {Object.keys(namesList).length > 0 && (
        <div className="flex-col pt-4 space-y-4 sm:flex">
          <NamesDisplay
            namesList={namesList}
            showRemoveButton={true}
            onRemoveName={handleRemoveName}
            user={user}
            verticalLayout={true}
          />
          <Share idString={idsList.join("")} type="brand-only"/>
        </div>
      )}
    </div>
  );
}
