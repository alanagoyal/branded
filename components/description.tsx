"use client";

import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import Link from "next/link";
import { Button } from "./ui/button";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

export default function Description() {
  const [description, setDescription] = useState("");
  const [sessionId, setSessionId] = useState("");
  const router = useRouter(); // Use the useRouter hook

  useEffect(() => {
    const currentSessionId = localStorage.getItem("session_id") || uuidv4();
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", currentSessionId);
    }
    setSessionId(currentSessionId);
  }, []);

  const navigateToNew = () => {
    router.push(`/new?description=${description}&session_id=${sessionId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigateToNew();
    }
  };

  return (
    <div className="w-full md:w-4/5 flex flex-col md:flex-row items-center gap-4">
      <Input
        placeholder="Describe your startup in a few words"
        className="rounded-md w-full md:w-auto md:flex-grow"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyPress}
        autoFocus
      />
      <div className="w-full md:w-auto">
        <Button
          className="text-lg w-full md:w-auto"
          style={{
            background:
              "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
          }}
          onClick={navigateToNew} 
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
