import L from 'leaflet';
import {
    Activity,
    CloudLightning,
    Droplets,
    Flame,
    Hospital,
    LifeBuoy,
    Mountain,
    Tent,
    TriangleAlert,
    Waves,
    Wind,
    type LucideIcon,
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Daftar ikon yang bisa dipilih untuk jenis bencana / fasilitas.
 * Key inilah yang disimpan di database (kolom `icon`).
 */
export const MAP_ICONS: Record<string, { label: string; icon: LucideIcon }> = {
    waves: { label: 'Banjir', icon: Waves },
    droplets: { label: 'Hujan / genangan', icon: Droplets },
    mountain: { label: 'Longsor', icon: Mountain },
    flame: { label: 'Kebakaran', icon: Flame },
    wind: { label: 'Angin kencang', icon: Wind },
    activity: { label: 'Gempa', icon: Activity },
    lightning: { label: 'Petir / badai', icon: CloudLightning },
    alert: { label: 'Umum', icon: TriangleAlert },
    hospital: { label: 'Kesehatan', icon: Hospital },
    tent: { label: 'Posko / pengungsian', icon: Tent },
    lifebuoy: { label: 'Evakuasi', icon: LifeBuoy },
};

export const DEFAULT_ICON_KEY = 'alert';

export function getMapIcon(key?: string | null): LucideIcon {
    return (key && MAP_ICONS[key]?.icon) || MAP_ICONS[DEFAULT_ICON_KEY].icon;
}

/**
 * Marker bulat berwarna + ikon, untuk dipakai di Leaflet (peta kejadian & form).
 * Pakai: <Marker position={[lat, lng]} icon={makeMarkerIcon(color, iconKey)} />
 */
export function makeMarkerIcon(
    color: string,
    iconKey?: string | null,
    size = 38,
): L.DivIcon {
    const Icon = getMapIcon(iconKey);
    const svg = renderToStaticMarkup(
        <Icon size={Math.round(size * 0.5)} color="#ffffff" strokeWidth={2.2} />,
    );

    return L.divIcon({
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);border-radius:9999px;display:flex;align-items:center;justify-content:center;">${svg}</div>`,
    });
}