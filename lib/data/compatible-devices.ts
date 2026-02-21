export interface DeviceBrand {
    name: string;
    devices: string[];
}

export const COMPATIBLE_DEVICES_DB: DeviceBrand[] = [
    {
        name: 'Apple',
        devices: [
            'iPhone 16',
            'iPhone 16 Plus',
            'iPhone 16 Pro',
            'iPhone 16 Pro Max',
            'iPhone 15',
            'iPhone 15 Plus',
            'iPhone 15 Pro',
            'iPhone 15 Pro Max',
            'iPhone 14',
            'iPhone 14 Plus',
            'iPhone 14 Pro',
            'iPhone 14 Pro Max',
            'iPhone 13',
            'iPhone 13 mini',
            'iPhone 13 Pro',
            'iPhone 13 Pro Max',
            'iPhone 12',
            'iPhone 12 mini',
            'iPhone 12 Pro',
            'iPhone 12 Pro Max',
            'iPhone 11',
            'iPhone 11 Pro',
            'iPhone 11 Pro Max',
            'iPhone XS',
            'iPhone XS Max',
            'iPhone XR',
            'iPhone SE (2020)',
            'iPhone SE (2022)',
            'iPad Pro 11" (1st Gen or later)',
            'iPad Pro 12.9" (3rd Gen or later)',
            'iPad Air (3rd Gen or later)',
            'iPad (7th Gen or later)',
            'iPad mini (5th Gen or later)'
        ]
    },
    {
        name: 'Samsung',
        devices: [
            'Galaxy S24',
            'Galaxy S24+',
            'Galaxy S24 Ultra',
            'Galaxy S23',
            'Galaxy S23+',
            'Galaxy S23 Ultra',
            'Galaxy S23 FE',
            'Galaxy S22',
            'Galaxy S22+',
            'Galaxy S22 Ultra',
            'Galaxy S21',
            'Galaxy S21+ 5G',
            'Galaxy S21 Ultra 5G',
            'Galaxy S20',
            'Galaxy S20+',
            'Galaxy S20 Ultra',
            'Galaxy Note 20',
            'Galaxy Note 20 Ultra 5G',
            'Galaxy Fold',
            'Galaxy Z Fold2 5G',
            'Galaxy Z Fold3 5G',
            'Galaxy Z Fold4',
            'Galaxy Z Fold5',
            'Galaxy Z Flip',
            'Galaxy Z Flip3 5G',
            'Galaxy Z Flip4',
            'Galaxy Z Flip5'
        ]
    },
    {
        name: 'Google',
        devices: [
            'Pixel 9',
            'Pixel 9 Pro',
            'Pixel 9 Pro XL',
            'Pixel 9 Pro Fold',
            'Pixel 8',
            'Pixel 8 Pro',
            'Pixel 8a',
            'Pixel 7',
            'Pixel 7 Pro',
            'Pixel 7a',
            'Pixel 6',
            'Pixel 6 Pro',
            'Pixel 6a',
            'Pixel 5',
            'Pixel 5a',
            'Pixel 4',
            'Pixel 4a',
            'Pixel 4 XL',
            'Pixel 3',
            'Pixel 3 XL',
            'Pixel 3a',
            'Pixel 3a XL'
        ]
    },
    {
        name: 'Huawei',
        devices: [
            'P40',
            'P40 Pro',
            'Mate 40 Pro'
        ]
    },
    {
        name: 'Motorola',
        devices: [
            'Razr 2019',
            'Razr 5G',
            'Edge+',
            'Edge 40 Pro'
        ]
    },
    {
        name: 'Oppo',
        devices: [
            'Find X3 Pro',
            'Reno 5A',
            'Find X5',
            'Find X5 Pro'
        ]
    },
    {
        name: 'Sony',
        devices: [
            'Xperia 10 III Lite',
            'Xperia 1 IV',
            'Xperia 5 IV',
            'Xperia 10 IV'
        ]
    },
    {
        name: 'Xiaomi',
        devices: [
            '12T Pro',
            '13',
            '13 Lite',
            '13 Pro'
        ]
    }
];

export function searchCompatibleDevices(query: string): { brand: string; device: string }[] {
    if (!query || query.trim().length < 2) return [];

    const lowerQuery = query.toLowerCase().trim();
    const results: { brand: string; device: string }[] = [];

    for (const brand of COMPATIBLE_DEVICES_DB) {
        for (const device of brand.devices) {
            if (device.toLowerCase().includes(lowerQuery) || brand.name.toLowerCase().includes(lowerQuery)) {
                results.push({ brand: brand.name, device });
            }
        }
    }

    // Return up to 10 best matches
    return results.slice(0, 5);
}
