"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import type {
  IntegrationDefaults,
  OpenClawBootstrapResponse,
  OpenClawStreamEvent,
} from "@/lib/openclaw/types";

type SendState = {
  isSending: boolean;
  responseText: string;
  errorMessage: string;
  activeSessionKey: string;
};

const EMPTY_SEND_STATE: SendState = {
  isSending: false,
  responseText: "",
  errorMessage: "",
  activeSessionKey: "",
};

async function bootstrapFetcher(defaults: IntegrationDefaults): Promise<OpenClawBootstrapResponse> {
  const response = await fetch("/api/openclaw/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "bootstrap",
      gatewayUrl: defaults.openclawUrl,
      gatewayOrigin: defaults.openclawOrigin,
    }),
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(payload.error ?? payload.message ?? "Failed to bootstrap gateway.");
  }

  return (await response.json()) as OpenClawBootstrapResponse;
}

async function readNdjsonStream(
  response: Response,
  onEvent: (event: OpenClawStreamEvent) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error("Gateway response body is empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      onEvent(JSON.parse(trimmed) as OpenClawStreamEvent);
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    onEvent(JSON.parse(trailing) as OpenClawStreamEvent);
  }
}

export function useGatewayHero(defaults: IntegrationDefaults) {
  const [sendState, setSendState] = useState<SendState>(EMPTY_SEND_STATE);
  const gatewayConfigured = Boolean(defaults.openclawUrl.trim());
  const bootstrapSWR = useSWR<OpenClawBootstrapResponse>(
    gatewayConfigured ? ["home-gateway-bootstrap", defaults.openclawUrl] : null,
    () => bootstrapFetcher(defaults),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  useEffect(() => {
    setSendState(EMPTY_SEND_STATE);
  }, [defaults.openclawUrl]);

  async function sendPrompt(prompt: string): Promise<string> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return "";
    }

    setSendState((current) => ({
      ...current,
      isSending: true,
      errorMessage: "",
      responseText: "",
    }));

    try {
      const response = await fetch("/api/openclaw/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send",
          gatewayUrl: defaults.openclawUrl,
          gatewayOrigin: defaults.openclawOrigin,
          message: trimmedPrompt,
          sessionKey:
            sendState.activeSessionKey ||
            bootstrapSWR.data?.activeSessionKey ||
            "main",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(payload.error ?? payload.message ?? "Failed to send prompt.");
      }

      let nextSessionKey =
        sendState.activeSessionKey || bootstrapSWR.data?.activeSessionKey || "main";
      let finalText = "";

      await readNdjsonStream(response, (event) => {
        if (event.type === "ack") {
          nextSessionKey = event.sessionKey;
          setSendState((current) => ({
            ...current,
            activeSessionKey: event.sessionKey,
          }));
          return;
        }

        if (event.type === "delta") {
          finalText = event.text;
          setSendState((current) => ({
            ...current,
            responseText: event.text,
          }));
          return;
        }

        if (event.type === "error") {
          throw new Error(event.message);
        }
      });

      setSendState((current) => ({
        ...current,
        isSending: false,
        activeSessionKey: nextSessionKey,
        responseText: finalText || current.responseText,
      }));
      void bootstrapSWR.mutate();
      return nextSessionKey;
    } catch (error) {
      setSendState((current) => ({
        ...current,
        isSending: false,
        errorMessage:
          error instanceof Error ? error.message : "Failed to send prompt.",
      }));
      return "";
    }
  }

  return {
    bootstrap: bootstrapSWR.data ?? null,
    bootstrapError: bootstrapSWR.error instanceof Error ? bootstrapSWR.error : null,
    bootstrapLoading: bootstrapSWR.isLoading,
    gatewayConfigured,
    sendPrompt,
    sendState,
  };
}
