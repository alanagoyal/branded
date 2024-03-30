"use client";
import React, { useEffect } from "react";
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
  Heart,
  HelpCircle,
  LogOut,
  Plus,
  User,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function CommandMenu() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = React.useState(false);


  const navigateAndCloseDialog = (path: string) => {
    router.push(path);
    setOpen(false); 
  };

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
          case "o":
            e.preventDefault();
            handleSignOut();
            break;
          default:
            break;
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router]); 

  const handleSignOut = async () => {
    const supabase = createClient();
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
  );
}
