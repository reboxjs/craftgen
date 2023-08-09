import { cn } from "@/lib/utils";
import * as React from "react";
import { ClassicPreset } from "rete";

export function CustomSocket<T extends ClassicPreset.Socket>(props: {
  data: T;
}) {
  return (
    <div
      title={props.data.name}
      className={cn(
        "w-4 h-2  bg-primary/20 inline-block cursor-pointer border align-middle z-10 box-border hover:bg-primary",
        props.data.name === "Action" && "bg-red-500"
      )}
    />
  );
}
