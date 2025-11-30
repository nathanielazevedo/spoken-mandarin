export const isLocalEnvironment = (): boolean => {
  const globalProcess =
    typeof globalThis !== "undefined"
      ? (globalThis as {
          process?: { env?: Record<string, string | undefined> };
        }).process
      : undefined;

  if (
    (typeof import.meta !== "undefined" &&
      (
        import.meta as ImportMeta & {
          env?: { DEV?: boolean };
        }
      ).env?.DEV) ||
    (globalProcess?.env?.NODE_ENV &&
      globalProcess.env.NODE_ENV !== "production")
  ) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const host = window.location.hostname;
  if (!host) {
    return false;
  }

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local")
  );
};
