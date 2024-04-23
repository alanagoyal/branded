"use client";
import React, { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
import {
  CreditCard,
  Heart,
  HelpCircle,
  LogOut,
  Plus,
  Receipt,
  Smile,
  SquareGantt,
  User,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function CommandMenu({ user }: { user: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isCustomer, setIsCustomer] = useState(false);
  const [billingPortalUrl, setBillingPortalUrl] = useState("");
  const [planName, setPlanName] = useState("");
  const [accountName, setAccountName] = useState("");

  const navigateAndCloseDialog = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  useEffect(() => {
    const fetchAccount = async () => {
      const supabase = createClient();
      let { data: userData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (userData) {
        setAccountName(userData.name);
        if (userData.customer_id) {
          setIsCustomer(true);
          fetchBillingSession(userData.customer_id);
        }
        if (userData.plan_id) {
          try {
            const response = await fetch(
              `/fetch-plan?plan_id=${userData.plan_id}`
            );
            const data = await response.json();
            if (response.ok) {
              setPlanName(data.planName);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    };
    if (user) {
      fetchAccount();
    }
  }, [user]);

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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "g":
            e.preventDefault();
            navigateAndCloseDialog("/new");
            break;
          case "a":
            e.preventDefault();
            navigateAndCloseDialog("/account");
            break;
          case "f":
            e.preventDefault();
            navigateAndCloseDialog("/favorites");
            break;
          case "s":
            e.preventDefault();
            navigateAndCloseDialog("/help");
            break;
          case "i":
            e.preventDefault();
            if (planName === "Pro" || planName === "Business") {
              window.open(
                "https://alpharun.com/i/g1imnQ21zPOPxrwb9Y3Fq",
                "_blank"
              );
            }
            break;
          case "b":
            if (isCustomer) {
              e.preventDefault();
              navigateAndCloseDialog(billingPortalUrl);
            }
            break;
          case "p":
            e.preventDefault();
            navigateAndCloseDialog("/pricing");
            break;
          case "o":
            e.preventDefault();
            handleSignOut();
            break;
          case "d":
            e.preventDefault();
            setTheme(theme === "light" ? "dark" : "light");
            break;
          default:
            break;
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router, theme, setTheme, isCustomer, billingPortalUrl]);

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const CommandLinkItem = ({
    href,
    newTab,
    onClick,
    children,
  }: {
    href?: string;
    newTab?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
  }) => {
    if (href) {
      return (
        <Link
          href={href}
          target={newTab ? "_blank" : undefined}
          onClick={() => setOpen(false)}
        >
          {children}
        </Link>
      );
    } else {
      return (
        <div
          onClick={() => {
            onClick?.();
            setOpen(false);
          }}
        >
          {children}
        </div>
      );
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          <CommandLinkItem href="/new">
            <CommandItem>
              <Plus className="mr-2 h-4 w-4" />
              <span>Generate</span>
              <CommandShortcut>⌘G</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          <CommandLinkItem href="/favorites">
            <CommandItem>
              <Heart className="mr-2 h-4 w-4" />
              <span>Favorites</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          <CommandLinkItem href="/account">
            <CommandItem>
              <User className="mr-2 h-4 w-4" />
              <span>Account</span>
              <CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          <CommandSeparator />
          {isCustomer && (
            <CommandLinkItem href={billingPortalUrl}>
              <CommandItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
            </CommandLinkItem>
          )}
          <CommandLinkItem href="/pricing">
            <CommandItem>
              <SquareGantt className="mr-2 h-4 w-4" />
              <span>Plans</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          <CommandLinkItem href="/help">
            <CommandItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Support</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          {planName === "Pro" ||
            (planName === "Business" && (
              <CommandLinkItem
                href="https://alpharun.com/i/g1imnQ21zPOPxrwb9Y3Fq"
                newTab
              >
                <CommandItem>
                  <Smile className="mr-2 h-4 w-4" />
                  <span>Feedback</span>
                  <CommandShortcut>⌘I</CommandShortcut>
                </CommandItem>
              </CommandLinkItem>
            ))}
          <CommandSeparator />
          <CommandLinkItem
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <CommandItem>
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              <span>Switch Theme</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          <CommandSeparator />
          <CommandItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
            <CommandShortcut>⌘O</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
