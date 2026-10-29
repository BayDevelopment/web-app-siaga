import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    FileText,
    LayoutGrid,
    LogIn,
    Map,
    MapPin,
    Tags,
    TriangleAlert,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

type Role = 'admin' | 'petugas' | 'warga';

/** Tanpa `roles` = menu publik (guest pun boleh melihat). */
type RoleNavItem = NavItem & { roles?: Role[] };

const navItems: RoleNavItem[] = [
    // Perlu login
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        roles: ['admin', 'petugas', 'warga'],
    },

    // Publik
    { title: 'Peta Kejadian', href: '/peta', icon: Map },
    { title: 'Laporan Kejadian', href: '/laporan', icon: FileText },

    // Data operasional lapangan: admin + petugas
    {
        title: 'Zona Rawan',
        href: '/admin/hazard-zones',
        icon: TriangleAlert,
        roles: ['admin', 'petugas'],
    },
    {
        title: 'Fasilitas Darurat',
        href: '/admin/facilities',
        icon: Building2,
        roles: ['admin', 'petugas'],
    },

    // Data master: hanya admin
    {
        title: 'Wilayah',
        href: '/admin/areas',
        icon: MapPin,
        roles: ['admin'],
    },
    {
        title: 'Jenis Bencana',
        href: '/admin/disaster-types',
        icon: Tags,
        roles: ['admin'],
    },
];

const KNOWN_ROLES: Role[] = ['admin', 'petugas', 'warga'];

export function AppSidebar() {
    const { auth } = usePage<{
        auth: { user?: { role?: string } | null };
    }>().props;

    const user = auth?.user ?? null;
    const isLoggedIn = user !== null;

    // Role tak dikenal diperlakukan sebagai warga (hak akses paling kecil).
    const role: Role | null = isLoggedIn
        ? (KNOWN_ROLES.find((item) => item === user?.role) ?? 'warga')
        : null;

    const mainNavItems = navItems.filter((item) =>
        item.roles ? role !== null && item.roles.includes(role) : true,
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isLoggedIn ? dashboard() : '/'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {isLoggedIn ? (
                    <NavUser />
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Masuk">
                                <Link href="/login">
                                    <LogIn />
                                    <span>Masuk</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}