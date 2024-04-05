"use client";
import { useEffect, useState } from "react";
import { NameGenerator } from "./name-generator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { createClient } from "@/utils/supabase/client";
import { NamesDisplay } from "./names-display";
import { useSearchParams } from "next/navigation";

export default function NewGeneration({
  user,
  names,
}: {
  user: any;
  names: any;
}) {
  const [namesList, setNamesList] = useState<{ [name: string]: string }>({});
  const [inputName, setInputName] = useState<string>("");
  const [showNamesDisplay, setShowNamesDisplay] = useState<boolean>(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  
  async function addExistingName() {
    const updatedNamesList: { [name: string]: string } = {};

    try {
      const updates = {
        name: inputName,
        created_at: new Date(),
        created_by: user?.id,
        session_id: sessionId,
      };
      const { data, error } = await supabase
        .from("names")
        .insert(updates)
        .select();

      if (data) {
        updatedNamesList[data[0].name] = data[0].id;
        setNamesList(updatedNamesList);
        setShowNamesDisplay(true); 
        setInputName("");
      }

      if (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Name Generator</h1>
        {showNamesDisplay ? (
          <Button variant="ghost" onClick={() => setShowNamesDisplay(false)}>
            Back
          </Button>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost">
                Already have a name? Skip to the branding.
              </Button>
            </PopoverTrigger>
            <PopoverContent className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your startup's name"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
              />
              <Button className="w-full" onClick={addExistingName}>
                Go
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {!showNamesDisplay && <NameGenerator user={user} names={names ?? null} />}
      {showNamesDisplay && (
        <NamesDisplay namesList={namesList} user={user} verticalLayout={true} />
      )}
    </div>
  );
}
function uuidv4(): string {
    throw new Error("Function not implemented.");
}

