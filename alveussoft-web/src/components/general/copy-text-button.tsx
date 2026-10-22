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
				// Fallback
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
				timerRef.current = window.setTimeout(() => setCopied(false), feedbackDuration);
		} catch (err) {
			// Silencioso: no rompemos la UI por errores de clipboard
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
				gap: 0,
				border: "1px solid rgba(255,255,255,0.06)",
				padding: 0,
				borderRadius: 8,
				background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
				width: "100%",
				maxWidth: 420,
				minHeight: 36,
				overflow: "hidden",
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
					color: "var(--text-light, #f3f7fb)",
					fontSize: 13,
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
					width: 50,
					minWidth: 50,
					padding: 0,
					borderRadius: 0,
					border: "none",
					borderLeft: "1px solid rgba(255,255,255,0.06)",
					color: "white",
					cursor: "pointer",
					transition: "background 150ms, color 150ms, transform 120ms",
					transform: hovered && !copied ? "translateY(-1px)" : "none",
					flexShrink: 0,
				}}
				title={copied ? "Copiado" : "Copiar"}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				{copied ? (
					<Check size={16}/>
				) : (
					<Copy size={16}/>
				)}
			</button>
		</div>
	);
}
