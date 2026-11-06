"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ToastOnMount({ message }: { message: string }) {
  useEffect(() => {
    toast.success(message, { id: message });
  }, [message]);
  return null;
}
