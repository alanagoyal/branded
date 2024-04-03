"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import Link from "next/link";
import { Button } from "./ui/button";

export default function Description() {
  const [description, setDescription] = useState("");
  return (
    <div className="w-4/5 flex items-center gap-1.5"> 
      <Input
        placeholder="What will you build?"
        className="rounded-md"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Link
        href={{
          pathname: "/new",
          query: { description: description },
        }}
      >
        <Button
          className="text-lg"
          style={{
            background:
              "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
          }}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}
