import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	className?: string;
	href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
	primary: "bg-accent text-background font-bold",
	secondary: "bg-panel border border-border-color text-text-primary",
	ghost: "bg-transparent text-accent underline-offset-4 hover:underline",
	danger: "bg-accent-urgency text-white font-bold",
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-base",
	lg: "px-6 py-3 text-lg",
};

export function Button({
	variant = "primary",
	size = "md",
	children,
	onClick,
	disabled = false,
	type = "button",
	className = "",
	href,
}: ButtonProps) {
	const base = `rounded-md transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

	if (href) {
		return (
			<a href={href} className={base}>
				{children}
			</a>
		);
	}

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={base}
		>
			{children}
		</button>
	);
}
