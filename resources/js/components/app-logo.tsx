import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            {/* Logo */}
            <img
                src="/img-logo-sidebar.png"
                alt="Logo SIGAP Bencana"
                className="h-10 w-10 shrink-0 object-contain"
            />

            {/* Text */}
            <div className="flex min-w-0 flex-col justify-center leading-none">
                <div className="text-[18px] font-extrabold tracking-tight text-[#123B6D]">
                    SIGAP <span className="text-[#F58220]">BENCANA</span>
                </div>

                <div className="mt-1 whitespace-nowrap text-[7px] font-semibold tracking-[0.16em] text-[#123B6D]">
                    SIAP • TANGGAP • AMAN • BERSAMA
                </div>
            </div>
        </div>
    );
}
