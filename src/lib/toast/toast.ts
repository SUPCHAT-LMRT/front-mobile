// $lib/toast/toast.ts
import { toast } from "svelte-sonner";
import Validate from "$lib/components/app/icon/Validate.svelte";
import Error from "$lib/components/app/icon/Error.svelte";
import Warning from "$lib/components/app/icon/Warning.svelte";

export const success = (title: string, message: string) => {
  toast(title, {
    description: message,
    icon: Validate,
  });
};

export const error = (title: string, message: string) => {
  toast(title, {
    description: message,
    icon: Error,
  });
};

export const warning = (title: string, message: string) => {
  toast(title, {
    description: message,
    icon: Warning,
  });
};

interface NotificationLevel {
  title: string;
  level: "warning" | "error";
  message: string;
}

export const notifyByLevel = ({ title, level, message }: NotificationLevel) => {
  if (level === "warning") {
    warning(title, message);
  } else if (level === "error") {
    error(title, message);
  }
};
