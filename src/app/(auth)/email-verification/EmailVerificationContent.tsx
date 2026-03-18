"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_SECONDARY_BUTTON_CLASS,
  AuthLayout,
} from "@components/auth/AuthLayout";
import { useLanguage } from "@i18n/LanguageProvider";
import { translations } from "@i18n/translations";

const VERIFICATION_CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const EMAIL_QUERY_KEYS = ["email", "address", "identifier", "account"] as const;

type AlertState = { type: "error" | "success" | "info"; message: string };

export default function EmailVerificationContent() {
  const { language } = useLanguage();
  const t = translations[language].auth.emailVerification;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTimeoutRef = useRef<number | null>(null);

  const email = useMemo(() => {
    for (const key of EMAIL_QUERY_KEYS) {
      const value = searchParams.get(key);
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim().toLowerCase();
      }
    }
    return "";
  }, [searchParams]);

  const statusParam = searchParams.get("status");
  const errorParam = searchParams.get("error");

  const descriptionEmail = email || t.emailFallback || "";
  const description = useMemo(() => {
    if (!t.description.includes("{{email}}")) {
      return t.description;
    }
    return t.description.replace("{{email}}", descriptionEmail);
  }, [descriptionEmail, t.description]);

  const initialAlert = useMemo<AlertState | null>(() => {
    if (statusParam === "sent") {
      return { type: "info", message: t.alerts.verificationSent };
    }
    if (statusParam === "resent") {
      return {
        type: "success",
        message: t.alerts.verificationResent ?? t.alerts.verificationSent,
      };
    }
    if (errorParam) {
      const normalized = errorParam
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const errorMap: Record<string, string> = {
        missing_verification: t.alerts.codeRequired,
        verification_failed: t.alerts.verificationFailed,
        invalid_code: t.alerts.verificationFailed,
        invalid_email: t.alerts.missingEmail,
        code_required: t.alerts.codeRequired,
      };
      const message = errorMap[normalized] ?? t.alerts.genericError;
      return {
        type: normalized === "already_verified" ? "success" : "error",
        message,
      };
    }
    if (!email) {
      return { type: "info", message: t.alerts.missingEmail };
    }
    return null;
  }, [email, errorParam, statusParam, t.alerts]);

  const [alert, setAlert] = useState<AlertState | null>(initialAlert);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setAlert(initialAlert);
  }, [initialAlert]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setResendCooldown((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resendCooldown]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const digitsOnly = event.target.value
        .replace(/\D/g, "")
        .slice(0, VERIFICATION_CODE_LENGTH);
      setCode(digitsOnly);
    },
    [],
  );

  const hasEmail = email.length > 0;
  const isSubmitDisabled =
    isSubmitting || !hasEmail || code.length !== VERIFICATION_CODE_LENGTH;
  const isResendDisabled = isResending || resendCooldown > 0 || !hasEmail;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }
      if (!hasEmail) {
        setAlert({ type: "error", message: t.alerts.missingEmail });
        return;
      }
      if (code.length !== VERIFICATION_CODE_LENGTH) {
        setAlert({ type: "error", message: t.alerts.codeRequired });
        return;
      }

      setIsSubmitting(true);
      setAlert(null);

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string | null;
        };

        if (!response.ok || payload?.success !== true) {
          const errorCode =
            typeof payload?.error === "string"
              ? payload.error
              : "verification_failed";
          const normalized = errorCode
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

          if (normalized === "already_verified") {
            const message =
              t.alerts.verificationReady ?? t.alerts.verificationSent;
            setAlert({ type: "success", message });
            redirectTimeoutRef.current = window.setTimeout(() => {
              router.push("/login?registered=1");
            }, 1200);
            return;
          }

          const errorMap: Record<string, string> = {
            missing_verification: t.alerts.codeRequired,
            invalid_code: t.alerts.verificationFailed,
            verification_failed: t.alerts.verificationFailed,
            invalid_email: t.alerts.missingEmail,
            code_expired: t.alerts.verificationFailed,
          };
          const message = errorMap[normalized] ?? t.alerts.genericError;
          setAlert({ type: "error", message });
          return;
        }

        const successMessage =
          t.alerts.verificationReady ?? t.alerts.verificationSent;
        setAlert({ type: "success", message: successMessage });
        setCode("");
        redirectTimeoutRef.current = window.setTimeout(() => {
          router.push("/login?registered=1");
        }, 1200);
      } catch (error) {
        console.error("Email verification request failed", error);
        setAlert({ type: "error", message: t.alerts.genericError });
      } finally {
        setIsSubmitting(false);
      }
    },
    [code, email, hasEmail, isSubmitting, router, t.alerts],
  );

  const handleResend = useCallback(async () => {
    if (isResending || !hasEmail) {
      if (!hasEmail) {
        setAlert({ type: "error", message: t.alerts.missingEmail });
      }
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string | null;
      };

      if (!response.ok || payload?.success !== true) {
        const errorCode =
          typeof payload?.error === "string"
            ? payload.error
            : "verification_failed";
        const normalized = errorCode
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

        if (normalized === "already_verified") {
          const message =
            t.alerts.verificationReady ?? t.alerts.verificationSent;
          setAlert({ type: "success", message });
          redirectTimeoutRef.current = window.setTimeout(() => {
            router.push("/login?registered=1");
          }, 1200);
          return;
        }

        const errorMap: Record<string, string> = {
          invalid_email: t.alerts.missingEmail,
          verification_failed: t.alerts.verificationFailed,
          rate_limited: t.alerts.genericError,
        };
        const message = errorMap[normalized] ?? t.alerts.genericError;
        setAlert({ type: "error", message });
        return;
      }

      const successMessage =
        t.alerts.verificationResent ?? t.alerts.verificationSent;
      setAlert({ type: "success", message: successMessage });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      console.error("Email verification resend failed", error);
      setAlert({ type: "error", message: t.alerts.genericError });
    } finally {
      setIsResending(false);
    }
  }, [email, hasEmail, isResending, router, t.alerts]);

  const resendLabel = isResending
    ? (t.resend.resending ?? t.resend.label)
    : resendCooldown > 0
      ? `${t.resend.label} (${resendCooldown}s)`
      : t.resend.label;

  return (
    <AuthLayout
      mode="register"
      badge={t.badge}
      title={t.title}
      description={description}
      alert={alert}
      switchAction={{
        text: t.switchAction.text,
        linkLabel: t.switchAction.link,
        href: "/login",
      }}
      footnote={t.footnote}
      bottomNote={t.bottomNote}
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label
            htmlFor="verification-code"
            className="text-sm font-medium text-slate-600"
          >
            {t.form.codeLabel}
          </label>
          <input
            id="verification-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t.form.codePlaceholder}
            className={AUTH_INPUT_CLASS}
            value={code}
            onChange={handleCodeChange}
            disabled={isSubmitting || !hasEmail}
            aria-describedby="verification-code-help"
          />
          {t.form.helper ? (
            <p id="verification-code-help" className="text-xs text-slate-500">
              {t.form.helper}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className={`w-full ${AUTH_PRIMARY_BUTTON_CLASS}`}
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? (t.form.submitting ?? t.form.submit) : t.form.submit}
        </button>
      </form>
      <button
        type="button"
        onClick={handleResend}
        className={`w-full ${AUTH_SECONDARY_BUTTON_CLASS}`}
        disabled={isResendDisabled}
      >
        {resendLabel}
      </button>
    </AuthLayout>
  );
}
