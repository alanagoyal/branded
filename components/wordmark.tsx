"use client";

import { useEffect, useState } from 'react';
import { useTheme } from "next-themes";
import Link from "next/link";

export default function Wordmark() {
    const { theme } = useTheme();
    const [logoSrc, setLogoSrc] = useState(`/${theme === "dark" ? "light" : "dark"}.png`);

    useEffect(() => {
        setLogoSrc(`/${theme === "dark" ? "light" : "dark"}.png`);
    }, [theme]);

    return (
        <div className="flex items-center">
            <Link href="/">
                <img
                    src={logoSrc}
                    alt="branded"
                    width={150} 
                    height={50} 
                />
            </Link>
        </div>
    );
}
