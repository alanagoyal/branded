"use client"

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function CompanyLogos() {
    const { theme } = useTheme();
    const [logoSrc, setLogoSrc] = useState(`/logos-${theme === "dark" ? "light" : "dark"}.png`);

    useEffect(() => {
        setLogoSrc(`/logos-${theme === "dark" ? "light" : "dark"}.png`);
    }, [theme]);

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-center text-2xl font-bold mb-10">
        Trusted by founders and builders from...
      </h2>
      <img src={logoSrc} alt="Trustworthy Companies" className="w-4/5" />
    </div>
  );
}

