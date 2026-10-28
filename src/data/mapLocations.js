const round = (value) => Math.round(value * 1000) / 1000;

// Use the same projection as the existing Natural Earth dot map.
export function projectMapCoordinates(longitude, latitude) {
  return [
    round(2 + ((longitude + 180) / 360) * 96),
    round(4 + ((85 - latitude) / 145) * 92),
  ];
}

// Anchor China at Tianjin, where TZME is based, rather than the country centroid.
// Tianjin city centre: https://tianjin.tianditu.gov.cn/static/help/note.html
const [chinaX, chinaY] = projectMapCoordinates(117.2, 39.13);
export const chinaMapPosition = { x: chinaX, y: chinaY };

const cities = [
  // City-centre coordinates, not equipment or office locations.
  // https://aa.usno.navy.mil/calculated/rstt/oneday?date=2026-03-14&label=Abu+Dhabi&lat=24.47&lon=54.38&tz=4
  {
    id: "city-AE-abu-dhabi",
    code: "AE-AZ",
    label: { en: "Abu Dhabi", zh: "阿布扎比" },
    longitude: 54.38,
    latitude: 24.47,
  },
  // https://www.itskrs.its.dot.gov/node/213349
  {
    id: "city-AE-dubai",
    code: "AE-DU",
    label: { en: "Dubai", zh: "迪拜" },
    longitude: 55.29,
    latitude: 25.27,
  },
];

export const mapCityPresets = cities.map(
  ({ longitude, latitude, ...point }) => {
    const [x, y] = projectMapCoordinates(longitude, latitude);
    return { ...point, x, y };
  },
);

export const taiwanMapLabel = { en: "Taiwan, China", zh: "中国台湾" };
