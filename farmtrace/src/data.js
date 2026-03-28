// Demo batch data — pre-loaded for testing
export const DEMO_BATCHES = [
  {
    id: 'FT-K9MX2A',
    crop: 'Cherry Tomato',
    farmer: 'Ravi Kumar',
    village: 'Kolar',
    district: 'Kolar',
    state: 'Karnataka',
    harvestDate: '2026-03-20',
    method: 'Organic',
    quantity: '200',
    unit: 'kg',
    notes: 'No pesticides used. Drip irrigation. Natural compost only.',
    events: [
      { event: 'Harvested at farm', date: '20 Mar 2026' },
      { event: 'Quality checked by farmer', date: '21 Mar 2026' },
      { event: 'Packed and dispatched to Bengaluru', date: '22 Mar 2026' },
    ],
  },
  {
    id: 'FT-P3TZ8B',
    crop: 'Green Chilli',
    farmer: 'Lakshmi Devi',
    village: 'Tumkur',
    district: 'Tumkur',
    state: 'Karnataka',
    harvestDate: '2026-03-18',
    method: 'Conventional',
    quantity: '150',
    unit: 'kg',
    notes: '',
    events: [
      { event: 'Harvested at farm', date: '18 Mar 2026' },
      { event: 'Sorted and packed', date: '19 Mar 2026' },
    ],
  },
  {
    id: 'FT-M7RQ4C',
    crop: 'Fresh Mango',
    farmer: 'Suresh Gowda',
    village: 'Ramanagara',
    district: 'Ramanagara',
    state: 'Karnataka',
    harvestDate: '2026-03-15',
    method: 'Natural farming',
    quantity: '500',
    unit: 'kg',
    notes: 'Alphonso variety. Zero chemical inputs. Certified by local agricultural officer.',
    events: [
      { event: 'Harvested at orchard', date: '15 Mar 2026' },
      { event: 'Graded and sorted', date: '16 Mar 2026' },
      { event: 'Cold storage, 12°C', date: '17 Mar 2026' },
      { event: 'Dispatched to Bengaluru market', date: '20 Mar 2026' },
    ],
  },
];

// Generate a unique batch ID
export function generateBatchId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'FT-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
