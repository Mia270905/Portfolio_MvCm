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
			className={`flex items-stretch w-full max-w-[420px] min-h-9 overflow-hidden rounded-lg border transition-colors ${
				hovered 
					? "bg-custom-bg-hover border-custom-border-secondary" 
					: "bg-custom-bg-secondary border-custom-border-primary"
			}`}
			aria-live="polite"
		>
			<span
				className="flex items-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-custom-text-primary text-sm pl-3 pr-2"
				title={value}
			>
				{value}
			</span>

			<button
				type="button"
				onClick={doCopy}
				aria-label={`Copiar ${value ?? "texto"}`}
				className={`inline-flex items-center justify-center w-[50px] min-w-[50px] p-0 border-l transition-all duration-150 flex-shrink-0 ${
					copied
						? "bg-custom-accent-primary text-white border-custom-accent-primary"
						: hovered
							? "bg-custom-bg-hover text-custom-accent-primary border-custom-border-secondary"
							: "bg-transparent text-custom-text-secondary border-custom-border-primary hover:bg-custom-bg-hover hover:text-custom-accent-primary"
				}`}
				title={copied ? "Copiado" : "Copiar"}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				{copied ? (
					<Check size={16} className={copied ? "text-white" : ""} />
				) : (
					<Copy size={16} />
				)}
			</button>
		</div>
	);
}