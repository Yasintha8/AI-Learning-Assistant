import React from "react";

const Button = ({
    children,
    onClick,
    type = "button",
    disabled = false,
    className = "cursor-pointer",
    variant = "primary",
    size = "md",
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm shadow-primary-shadow hover:from-primary-hover hover:to-cyan-400 ',
        secondary: 'bg-gradient-to-r from-border-light to-border-medium text-text-body hover:from-border-medium hover:to-slate-200 focus:ring-border-medium',
        outline: 'bg-bg-card border border-border-medium text-text-body hover:bg-gradient-to-r hover:from-border-light hover:to-white hover:border-border-medium focus:ring-border-medium',
        danger: 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-sm hover:from-red-600 hover:to-red-500 focus:ring-red-500',
    };

    const sizeStyles = {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5 text-sm',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={[
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                className
            ].join(' ')}
        >
            {children}
        </button>
    );
};

export default Button;