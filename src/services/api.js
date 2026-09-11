/**
 * API Service giả lập kết nối và lấy dữ liệu cảm biến ao nuôi tôm
 */

const MOCK_PONDS = [
  {
    id: 'ao-1',
    name: 'Ao Thẻ Chân Trắng #01',
    area: '2.500 m²',
    shrimpCount: 150000,
    stockedDate: '2026-01-15',
    status: 'optimal',
    metrics: {
      temperature: { value: 28.5, unit: '°C', status: 'optimal', min: 26, max: 32 },
      ph: { value: 7.8, unit: 'pH', status: 'optimal', min: 7.5, max: 8.5 },
      do: { value: 5.8, unit: 'mg/L', status: 'optimal', min: 5.0, max: 8.0 },
      salinity: { value: 18.2, unit: 'ppt', status: 'optimal', min: 10, max: 25 },
      orp: { value: 240, unit: 'mV', status: 'optimal', min: 200, max: 350 },
    },
    aeratorStatus: true,
    feederStatus: false,
  },
  {
    id: 'ao-2',
    name: 'Ao Sú Giống #02',
    area: '3.000 m²',
    shrimpCount: 120000,
    stockedDate: '2026-02-01',
    status: 'warning',
    metrics: {
      temperature: { value: 31.2, unit: '°C', status: 'warning', min: 26, max: 32 },
      ph: { value: 8.6, unit: 'pH', status: 'warning', min: 7.5, max: 8.5 },
      do: { value: 4.6, unit: 'mg/L', status: 'warning', min: 5.0, max: 8.0 },
      salinity: { value: 22.0, unit: 'ppt', status: 'optimal', min: 10, max: 25 },
      orp: { value: 185, unit: 'mV', status: 'warning', min: 200, max: 350 },
    },
    aeratorStatus: true,
    feederStatus: true,
  },
  {
    id: 'ao-3',
    name: 'Ao Tôm Công Nghệ Cao #03',
    area: '1.800 m²',
    shrimpCount: 200000,
    stockedDate: '2026-02-10',
    status: 'optimal',
    metrics: {
      temperature: { value: 29.0, unit: '°C', status: 'optimal', min: 26, max: 32 },
      ph: { value: 8.0, unit: 'pH', status: 'optimal', min: 7.5, max: 8.5 },
      do: { value: 6.2, unit: 'mg/L', status: 'optimal', min: 5.0, max: 8.0 },
      salinity: { value: 16.5, unit: 'ppt', status: 'optimal', min: 10, max: 25 },
      orp: { value: 290, unit: 'mV', status: 'optimal', min: 200, max: 350 },
    },
    aeratorStatus: false,
    feederStatus: false,
  },
];

export const fetchPonds = async () => {
  // Giả lập network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_PONDS]);
    }, 200);
  });
};

export const updateDeviceStatus = async (pondId, device, status) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, pondId, device, status });
    }, 150);
  });
};
