import { Check, Copy } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

interface CopyTextButtonProps {
  value: string;
  feedbackDuration?: number;
}

export default function CopyTextButton({
  value,
  feedbackDuration = 2000,
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  const doCopy = async () => {
    if (!value) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopied(true);
      toast.success("Copiado al portapapeles");

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(
        () => setCopied(false),
        feedbackDuration
      );
    } catch (err) {
      console.error("Error copiando al portapapeles:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: hovered ? "#f9fafb" : "#ffffff",
        width: "100%",
        maxWidth: 420,
        minHeight: 40,
        overflow: "hidden",
        transition: "background 150ms ease",
      }}
      aria-live="polite"
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
          color: "#111827",
          fontSize: 14,
          paddingLeft: 12,
          paddingRight: 8,
        }}
        title={value}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={doCopy}
        aria-label={`Copiar ${value ?? "texto"}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          minWidth: 48,
          border: "none",
          borderLeft: "1px solid #e5e7eb",
          background: copied ? "#ecfdf5" : "transparent",
          color: copied ? "#16a34a" : "#374151",
          cursor: "pointer",
          transition: "all 150ms ease",
        }}
        title={copied ? "Copiado" : "Copiar"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {copied ? (
          <Check size={16} />
        ) : (
          <Copy size={16} />
        )}
      </button>
    </div>
  );
}