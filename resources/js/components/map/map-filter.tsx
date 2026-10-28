import { Check, Layers3, MapPin, ShieldAlert } from 'lucide-react';

import type { MapType } from '@/components/map/disaster-map';

type Props = {
    types: MapType[];
    activeTypeIds: number[];
    showZones: boolean;
    showFacilities: boolean;
    onToggleType: (id: number) => void;
    onToggleZones: () => void;
    onToggleFacilities: () => void;
};

export default function MapFilter({
    types,
    activeTypeIds,
    showZones,
    showFacilities,
    onToggleType,
    onToggleZones,
    onToggleFacilities,
}: Props) {
    const allActive =
        types.length > 0 && activeTypeIds.length === types.length;

    const toggleAll = () => {
        if (allActive) {
            types.forEach((type) => {
                if (activeTypeIds.includes(type.id)) {
                    onToggleType(type.id);
                }
            });

            return;
        }

        types.forEach((type) => {
            if (!activeTypeIds.includes(type.id)) {
                onToggleType(type.id);
            }
        });
    };

    return (
        <div className="pointer-events-auto w-[min(92vw,340px)] rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Layers3 className="h-4 w-4 text-primary" />
                </div>

                <div>
                    <p className="text-sm font-semibold">Filter Peta</p>
                    <p className="text-xs text-muted-foreground">
                        Atur data yang ditampilkan
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={toggleAll}
                    className="flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition hover:bg-accent"
                >
                    <span
                        className={[
                            'flex h-5 w-5 items-center justify-center rounded-md border',
                            allActive
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'bg-background',
                        ].join(' ')}
                    >
                        {allActive && <Check className="h-3.5 w-3.5" />}
                    </span>

                    <span className="font-medium">Semua jenis bencana</span>
                </button>

                <div className="border-t pt-2">
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Jenis Bencana
                    </p>

                    <div className="space-y-1">
                        {types.map((type) => {
                            const active = activeTypeIds.includes(type.id);

                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => onToggleType(type.id)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-accent"
                                >
                                    <span
                                        className={[
                                            'flex h-5 w-5 items-center justify-center rounded-md border',
                                            active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'bg-background',
                                        ].join(' ')}
                                    >
                                        {active && (
                                            <Check className="h-3.5 w-3.5" />
                                        )}
                                    </span>

                                    <span
                                        className="h-3 w-3 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: type.color,
                                        }}
                                    />

                                    <span className="flex-1">{type.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t pt-2">
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Data Peta
                    </p>

                    <button
                        type="button"
                        onClick={onToggleZones}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-accent"
                    >
                        <span
                            className={[
                                'flex h-5 w-5 items-center justify-center rounded-md border',
                                showZones
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-background',
                            ].join(' ')}
                        >
                            {showZones && <Check className="h-3.5 w-3.5" />}
                        </span>

                        <ShieldAlert className="h-4 w-4 text-orange-500" />

                        <span className="flex-1">Zona rawan</span>
                    </button>

                    <button
                        type="button"
                        onClick={onToggleFacilities}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-accent"
                    >
                        <span
                            className={[
                                'flex h-5 w-5 items-center justify-center rounded-md border',
                                showFacilities
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-background',
                            ].join(' ')}
                        >
                            {showFacilities && (
                                <Check className="h-3.5 w-3.5" />
                            )}
                        </span>

                        <MapPin className="h-4 w-4 text-blue-500" />

                        <span className="flex-1">Fasilitas darurat</span>
                    </button>
                </div>
            </div>
        </div>
    );
}