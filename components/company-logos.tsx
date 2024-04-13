"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function CompanyLogos() {
  const { theme } = useTheme();

  const companyLogos = [
    { name: "Vercel", website: "https://vercel.com" },
    { name: "Figma", website: "https://figma.com" },
    { name: "Stripe", website: "https://stripe.com" },
    { name: "Cloudflare", website: "https://cloudflare.com" },
    { name: "Alpharun", website: "https://alpharun.com" },
    { name: "Supabase", website: "https://supabase.com" },
    { name: "Braintrust", website: "https://braintrust.dev" },
    { name: "Instacart", website: "https://instacart.com" },
  ].map((company) => ({
    ...company,
    logo: `${company.name.toLowerCase()}-${
      theme === "dark" ? "light" : "dark"
    }.png`,
  }));

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className={`text-center text-2xl font-bold mb-10 ${theme === "dark" ? "text-white" : "text-[#3A3C3F]"}`}>
        Trusted by founders and builders from...
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-4/5">
        {companyLogos.map((company) => (
          <a
            href={company.website}
            key={company.name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center"
          >
            <div className="w-[150px] h-[20px] flex items-center justify-center">
              <img
                src={company.logo}
                alt={`${company.name} Logo`}
                className="max-w-full max-h-full"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
