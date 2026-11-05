"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// A success notice a server page decides on (e.g. from a query string), shown once as a toast.
export function ToastOnMount({ message }: { message: string }) {
  useEffect(() => {
    toast.success(message, { id: message });
  }, [message]);
  return null;
}
