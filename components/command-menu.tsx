"use client";
import React from "react";
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
  Calculator,
  Calendar,
  CreditCard,
  Heart,
  HelpCircle,
  LogOut,
  Plus,
  Settings,
  Smile,
  User,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const navigateAndCloseDialog = (path: string) => {
    router.push(path);
    setOpen(false); 
  };

  React.useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey) && supabase.auth.user()) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", downHandler);
    return () => document.removeEventListener("keydown", downHandler);
  }, []); 

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigateAndCloseDialog("/login");
    }
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
    <>
      {supabase.auth.user() && (
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="User">
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
              <CommandSeparator />
              <CommandItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                <CommandShortcut>⌘O</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
}
