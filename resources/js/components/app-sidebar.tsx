import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    FileText,
    LayoutGrid,
    Map,
    MapPin,
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

const baseNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Peta Kejadian',
        href: '/peta',
        icon: Map,
    },
    {
        title: 'Laporan Kejadian',
        href: '/laporan',
        icon: FileText,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Wilayah',
        href: '/admin/areas',
        icon: MapPin,
    },
    {
        title: 'Zona Rawan',
        href: '/admin/hazard-zones',
        icon: TriangleAlert,
    },
    {
        title: 'Fasilitas Darurat',
        href: '/admin/facilities',
        icon: Building2,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{
        auth: {
            user?: {
                role?: string;
            };
        };
    }>().props;

    const role = auth?.user?.role;

    const isAdmin = role === 'admin';

    const mainNavItems = isAdmin
        ? [...baseNavItems, ...adminNavItems]
        : baseNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={dashboard()}
                                prefetch
                            >
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}