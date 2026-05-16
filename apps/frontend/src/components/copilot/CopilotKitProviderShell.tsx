"use client";

import { usePathname } from "next/navigation";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";

// Sólo envolvemos con CopilotKit en rutas que lo usan (/leads del starter original).
// /clinic usa Gemini directamente vía /api/atlas-chat — el provider haría retries
// infinitos a /api/copilotkit (que no existe) y bloquearía la UI.
const COPILOT_ROUTES = ["/leads"];

export function CopilotKitProviderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const useProvider = COPILOT_ROUTES.some((p) => pathname.startsWith(p));

  if (!useProvider) return <>{children}</>;

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY}
      openGenerativeUI={{}}
    >
      {children}
    </CopilotKitProvider>
  );
}
