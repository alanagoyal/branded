"use client";
import { createClient } from "@/utils/supabase/client";
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
  const [accountName, setAccountName] = useState("");
  const [isCustomer, setIsCustomer] = useState(false);
  const [billingPortalUrl, setBillingPortalUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
            <p className="text-sm font-medium leading-none">{accountName}</p>
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
          <Link href="/favorites">
            <DropdownMenuItem className="cursor-pointer justify-between">
              <div className="flex items-center">
                <Heart className="mr-2 h-4 w-4" />
                <span>Favorites</span>
              </div>
              <p className="text-xs text-muted-foreground">⌘F</p>
            </DropdownMenuItem>
          </Link>
          <Link href="/account">
            <DropdownMenuItem className="cursor-pointer justify-between">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </div>
              <p className="text-xs text-muted-foreground">⌘A</p>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          {isCustomer && (
            <Link href={billingPortalUrl}>
              <DropdownMenuItem className="cursor-pointer justify-between">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </div>
                <p className="text-xs text-muted-foreground">⌘B</p>
              </DropdownMenuItem>
            </Link>
          )}
          <Link href="/pricing">
            <DropdownMenuItem className="cursor-pointer justify-between">
              <div className="flex items-center">
                <SquareGantt className="mr-2 h-4 w-4" />
                <span>Plans</span>
              </div>
              <p className="text-xs text-muted-foreground">⌘P</p>
            </DropdownMenuItem>
          </Link>
          <Link href="/help">
            <DropdownMenuItem className="cursor-pointer justify-between">
              <div className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support</span>
              </div>
              <p className="text-xs text-muted-foreground">⌘S</p>
            </DropdownMenuItem>
          </Link>
          {planName === "Pro" ||
            (planName === "Business" && (
              <Link
                href={process.env.NEXT_PUBLIC_ALPHARUN_URL!}
                rel="noopener noreferrer"
                target="_blank"
              >
                <DropdownMenuItem className="cursor-pointer justify-between">
                  <div className="flex items-center">
                    <Smile className="mr-2 h-4 w-4" />
                    <span>Feedback</span>
                  </div>
                  <p className="text-xs text-muted-foreground">⌘I</p>
                </DropdownMenuItem>
              </Link>
            ))}
          <DropdownMenuSeparator />
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
            <p className="text-xs text-muted-foreground">⌘D</p>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer justify-between"
          onClick={handleSignOut}
        >
          <div className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </div>
          <p className="text-xs text-muted-foreground">⌘O</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
