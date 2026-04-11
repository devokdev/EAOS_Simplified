import React from 'react';
import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer rounded-md bg-accent/55", className)}
      {...props}
    />
  );
}

export { Skeleton };
