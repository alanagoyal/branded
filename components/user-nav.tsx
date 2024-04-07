"use client";
import { useContext } from 'react';
import { AppContext } from './AppContext';
import { createClient } from "@/utils/supabase/client";
import { Heart, HelpCircle, LogOut, Plus, User } from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useEffect, useState } from "react";

export default function UserNav({ user }: any) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [profileName, setProfileName] = useState("");
  const { isUserNavVisible } = useContext(AppContext);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      let { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfileName(data.name);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    isUserNavVisible && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                style={{
                  background:
                    "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
                }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profileName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/new">
              <DropdownMenuItem className="cursor-pointer justify-between">
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Generate</span>
                </div>
                <p className="text-xs text-muted-foreground">⌘G</p>
              </DropdownMenuItem>
            </Link>
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer justify-between">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </div>
                <p className="text-xs text-muted-foreground">⌘P</p>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <Link href="/favorites">
              <DropdownMenuItem className="cursor-pointer justify-between">
                <div className="flex items-center">
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Favorites</span>
                </div>
                <p className="text-xs text-muted-foreground">⌘F</p>
              </DropdownMenuItem>
            </Link>
            <Link href="/help">
              <DropdownMenuItem className="cursor-pointer justify-between">
                <div className="flex items-center">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Support</span>
                </div>
                <p className="text-xs text-muted-foreground">⌘J</p>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem
              className="cursor-pointer justify-between"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
            >
              <div className="flex items-center">
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                <span>Switch Theme</span>
              </div>
              <p className="text-xs text-muted-foreground">⌘B</p>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer justify-between" onClick={handleSignOut}>
            <div className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </div>
            <p className="text-xs text-muted-foreground">⌘O</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  );
}
