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

  const navigateAndCloseDialog = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data && data.customer_id) {
        setIsCustomer(true);
        fetchBillingSession(data.customer_id);
      }
    };
    if (user) {
      fetchProfile();
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
          case "p":
            e.preventDefault();
            navigateAndCloseDialog("/profile");
            break;
          case "f":
            e.preventDefault();
            navigateAndCloseDialog("/favorites");
            break;
          case "j":
            e.preventDefault();
            navigateAndCloseDialog("/help");
            break;
          case "d":
            if (isCustomer) {
              e.preventDefault();
              navigateAndCloseDialog(billingPortalUrl);
            }
            break;
          case "i":
            e.preventDefault();
            navigateAndCloseDialog("/pricing");
            break;
          case "o":
            e.preventDefault();
            handleSignOut();
            break;
          case "b":
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
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link href={href} onClick={() => setOpen(false)}>
      {children}
    </Link>
  );

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
          <CommandLinkItem href="/profile">
            <CommandItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          <CommandLinkItem href="/favorites">
            <CommandItem>
              <Heart className="mr-2 h-4 w-4" />
              <span>Favorites</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          <CommandLinkItem href="/help">
            <CommandItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Support</span>
              <CommandShortcut>⌘J</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>
          {isCustomer && (
            <CommandLinkItem href={billingPortalUrl}>
              <CommandItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
            </CommandLinkItem>
          )}
          <CommandLinkItem href="/pricing">
            <CommandItem>
              <Receipt className="mr-2 h-4 w-4" />
              <span>Pricing</span>
              <CommandShortcut>⌘I</CommandShortcut>
            </CommandItem>
          </CommandLinkItem>

          <CommandItem
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            <span>Switch Theme</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
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
