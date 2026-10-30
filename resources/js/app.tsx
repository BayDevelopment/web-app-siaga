import { createInertiaApp, router } from "@inertiajs/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/hooks/use-appearance";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import SettingsLayout from "@/layouts/settings/layout";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

type Flash = {
    success?: string | null;
    error?: string | null;
};

// Setiap kunjungan Inertia yang sukses: tampilkan flash dari server sebagai toast.
router.on("success", (event) => {
    const flash = (event.detail.page.props as { flash?: Flash }).flash;

    if (flash?.success) {
        toast.success(flash.success);
    }

    if (flash?.error) {
        toast.error(flash.error);
    }
});

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    layout: (name) => {
        switch (true) {
            case name === "welcome":
            case name === "home":
            case name === "auth/login":
            case name === "auth/register":
            case name === "auth/reset-password":
            case name === "auth/forgot-password":
            case name === "auth/confirm-password":
                return null;

            case name.startsWith("auth/"):
                return AuthLayout;

            case name.startsWith("settings/"):
                return [AppLayout, SettingsLayout];

            default:
                return AppLayout;
        }
    },

    strictMode: true,

    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}

                <Toaster />
            </TooltipProvider>
        );
    },

    progress: {
        color: "#4B5563",
    },
});

initializeTheme();
