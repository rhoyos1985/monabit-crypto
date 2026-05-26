export declare const theme: {
    readonly colors: {
        readonly brand: {
            readonly primary: "#0098BF";
            readonly accent: "#00B0C7";
            readonly dark: "#231F20";
        };
        readonly neutral: {
            readonly white: "#FFFFFF";
            readonly light: "#F5F7FA";
            readonly medium: "#D1D5DB";
            readonly dark: "#6B7280";
            readonly black: "#111827";
        };
        readonly semantic: {
            readonly success: "#10B981";
            readonly error: "#EF4444";
            readonly warning: "#F59E0B";
            readonly info: "#00B0C7";
        };
    };
    readonly spacing: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "16px";
        readonly lg: "24px";
        readonly xl: "32px";
        readonly '2xl': "48px";
    };
    readonly typography: {
        readonly fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        readonly fontSize: {
            readonly xs: "12px";
            readonly sm: "14px";
            readonly base: "16px";
            readonly lg: "18px";
            readonly xl: "20px";
            readonly '2xl': "24px";
            readonly '3xl': "30px";
        };
        readonly fontWeight: {
            readonly light: 300;
            readonly normal: 400;
            readonly medium: 500;
            readonly semibold: 600;
            readonly bold: 700;
        };
    };
    readonly borderRadius: {
        readonly sm: "4px";
        readonly md: "8px";
        readonly lg: "12px";
        readonly xl: "16px";
        readonly full: "9999px";
    };
    readonly shadows: {
        readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
        readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
    };
    readonly breakpoints: {
        readonly xs: "320px";
        readonly sm: "640px";
        readonly md: "768px";
        readonly lg: "1024px";
        readonly xl: "1280px";
        readonly '2xl': "1536px";
    };
};
export type Theme = typeof theme;
//# sourceMappingURL=theme.d.ts.map