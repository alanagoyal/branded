"use client";

import * as React from "react";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { SliderProps } from "@radix-ui/react-slider";

interface LengthSelectorProps {
  minLength: SliderProps["defaultValue"];
  maxLength: SliderProps["defaultValue"];
  onMinLengthChange: (minLength: number[]) => void;
  onMaxLengthChange: (minLength: number[]) => void;
}

export function LengthSelector({
  minLength,
  maxLength,
  onMinLengthChange,
  onMaxLengthChange,
}: LengthSelectorProps) {
  const handleMinLengthChange = (value: number[]) => {
    if (value[0] <= maxLength![0]) {
      onMinLengthChange(value);
    } else {
      onMinLengthChange([maxLength![0]]);
    }
  };

  const handleMaxLengthChange = (value: number[]) => {
    if (value[0] >= minLength![0]) {
      onMaxLengthChange(value);
    } else {
      onMaxLengthChange([minLength![0]]);
    }
  };
  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Minimum Length</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {minLength}
              </span>
            </div>
            <Slider
              id="min-length"
              min={5}
              max={12}
              defaultValue={minLength}
              value={minLength}
              step={1}
              onValueChange={handleMinLengthChange}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="Min Length"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[260px] text-sm"
          side="left"
        >
          Minimum length of the generated domain name
        </HoverCardContent>
      </HoverCard>
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Maximum Length</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {maxLength}
              </span>
            </div>
            <Slider
              id="max-length"
              min={5}
              max={12}
              defaultValue={maxLength}
              value={maxLength}
              step={1}
              onValueChange={handleMaxLengthChange}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="Min Length"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[260px] text-sm"
          side="left"
        >
          Maximum length of the generated domain name
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
