"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";

export default function Wordmark() {
    const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center">
      <Link href="/">
        <img
          src={`/${theme === "dark" ? "light" : "dark"}.png`}
          alt="namebase"
          width={196}
          height={64}
        />
      </Link>
    </div>
  );
}
