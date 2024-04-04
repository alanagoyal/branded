"use client";

import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import Link from "next/link";
import { Button } from "./ui/button";
import { v4 as uuidv4 } from "uuid";

export default function Description() {
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", uuidv4());
    }
  }, []);

  return (
    <div className="w-full md:w-4/5 flex flex-col md:flex-row items-center gap-4">
      <Input
        placeholder="Describe your startup in a few words"
        className="rounded-md w-full md:w-auto md:flex-grow"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        autoFocus
      />
      <div className="w-full md:w-auto">
        <Link
          href={{
            pathname: "/new",
            query: { description: description, session_id: localStorage.getItem("session_id") },
          }}
        >
          <Button
            className="text-lg w-full md:w-auto"
            style={{
              background:
                "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
            }}
          >
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}
