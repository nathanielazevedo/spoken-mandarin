"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let mounted = true;

    const register = async () => {
      try {
        await navigator.serviceWorker.register(SW_PATH);
      } catch (error) {
        if (mounted) {
          console.error("Failed to register service worker", error);
        }
      }
    };

    const onLoad = () => {
      void register();
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      mounted = false;
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
