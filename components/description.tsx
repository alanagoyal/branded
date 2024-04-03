"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import Link from "next/link";
import { Button } from "./ui/button";

export default function Description() {
  const [description, setDescription] = useState("");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}> 
      <Input
        placeholder="What will you build?"
        className="w-full h-32 rounded-md"
        style={{ width: "400px", height: "48px" }} 
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
            padding: "2px 30px",
            height: "48px",
          }}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}
