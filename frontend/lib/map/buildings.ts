// UNL Campus Building Data
// All 52 buildings from backend/scripts/buildings.json with metadata (estimated where not known).
// id = buildingCode so map clicks resolve via getBuildingById(selectedBuilding.id).

export interface Building {
  id: string;
  name: string;
  shortName: string;
  type: "residential" | "academic" | "dining" | "library" | "athletic" | "recreation" | "administrative";
  coordinates: [number, number]; // [lng, lat]
  capacity: number;
  hours: string;
  description: string;
}

/** Minimal campus building from API (same 52). Used for click/hover; lookup in BUILDINGS by id. */
export interface CampusBuilding {
  id: string; // buildingCode
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

// Campus center fallback for buildings with null coords in JSON (FIC, M&N)
const CAMPUS_CENTER: [number, number] = [-96.7012, 40.8185];

function coords(lng: number | null, lat: number | null): [number, number] {
  if (lat != null && lng != null) return [lng, lat];
  return CAMPUS_CENTER;
}

function estCapacity(sectionCount: number): number {
  return Math.min(2000, Math.max(100, sectionCount * 25));
}

export const BUILDINGS: Building[] = [
  // --- From buildings.json + estimated type/capacity/hours/description ---
  { id: "ACB", name: "Agricultural Comm Bldg", shortName: "Ag Comm", type: "academic", coordinates: coords(-96.6684494, 40.8290939), capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "ANDN", name: "Andersen Hall", shortName: "Andersen", type: "academic", coordinates: coords(-96.6991272, 40.8152237), capacity: estCapacity(97), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "ANDR", name: "Andrews Hall", shortName: "Andrews", type: "academic", coordinates: coords(-96.701767, 40.8193321), capacity: estCapacity(104), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "ANSC", name: "Animal Science", shortName: "Animal Science", type: "academic", coordinates: coords(-96.6644058, 40.8323326), capacity: estCapacity(10), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "ARCH", name: "Architecture Hall", shortName: "Architecture", type: "academic", coordinates: coords(-96.7060623, 40.8174973), capacity: estCapacity(90), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "AVH", name: "Avery Hall", shortName: "Avery", type: "academic", coordinates: coords(-96.7044067, 40.8193321), capacity: 450, hours: "7:00 AM - 10:00 PM", description: "Home to Mathematics and Computer Science departments with lecture halls." },
  { id: "BEAD", name: "Beadle Center E103", shortName: "Beadle", type: "academic", coordinates: coords(-96.6932755, 40.8198967), capacity: estCapacity(87), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "BESY", name: "Bessey Hall", shortName: "Bessey", type: "academic", coordinates: coords(-96.7032471, 40.8200111), capacity: estCapacity(66), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "BKC", name: "Barkley Center", shortName: "Barkley", type: "academic", coordinates: coords(-96.6609116, 40.8287735), capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "BL", name: "Brace Lab", shortName: "Brace Lab", type: "academic", coordinates: coords(-96.7061844, 40.8180008), capacity: estCapacity(83), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "BURN", name: "Burnett", shortName: "Burnett", type: "academic", coordinates: coords(-96.703186, 40.8193474), capacity: estCapacity(178), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "CEMA", name: "Center for Emerging Arts", shortName: "CEMA", type: "academic", coordinates: coords(-96.702415, 40.815926), capacity: estCapacity(25), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "CHA", name: "Chase Hall", shortName: "Chase", type: "academic", coordinates: coords(-96.6689148, 40.8313904), capacity: estCapacity(3), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "CPEH", name: "Carolyn Pope Edwards Hall", shortName: "CPEH", type: "academic", coordinates: coords(-96.7008209, 40.8218002), capacity: estCapacity(74), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "CREC", name: "Campus Rec", shortName: "Campus Rec", type: "recreation", coordinates: coords(-96.7023697, 40.8219299), capacity: 1000, hours: "6:00 AM - 11:00 PM", description: "Fitness center, pool, basketball courts, climbing wall, and group fitness studios." },
  { id: "DINS", name: "Dinsdale Learning Commons Arr", shortName: "Dinsdale", type: "library", coordinates: coords(-96.6661224, 40.8293991), capacity: estCapacity(2), hours: "7:30 AM - 10:00 PM", description: "Campus building." },
  { id: "ENTO", name: "Entomology Hall", shortName: "Entomology", type: "academic", coordinates: coords(-96.6684036, 40.8300591), capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "ERC", name: "Engineering Research Ctr D127B", shortName: "ERC", type: "academic", coordinates: coords(-96.69809, 40.82263), capacity: estCapacity(4), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "FIC", name: "Food Innovation Center", shortName: "Food Innovation", type: "academic", coordinates: CAMPUS_CENTER, capacity: estCapacity(8), hours: "7:00 AM - 10:00 PM", description: "Campus building. Location approximate." },
  { id: "FOOD", name: "Food Industry Complex", shortName: "Food Complex", type: "academic", coordinates: coords(-96.6669617, 40.828949), capacity: estCapacity(3), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "FYH", name: "Filley Hall", shortName: "Filley", type: "academic", coordinates: coords(-96.6674118, 40.8288879), capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "GNHS", name: "Newkirk Human Sci Building", shortName: "Newkirk", type: "academic", coordinates: coords(-96.6694412, 40.8300591), capacity: estCapacity(3), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "HAH", name: "Hamilton Hall", shortName: "Hamilton", type: "academic", coordinates: coords(-96.7044525, 40.8186989), capacity: 600, hours: "7:00 AM - 10:00 PM", description: "Major classroom building for sciences and mathematics departments." },
  { id: "HARH", name: "Hardin Hall", shortName: "Hardin", type: "academic", coordinates: coords(-96.671936, 40.8288879), capacity: estCapacity(4), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "HENZ", name: "Henzlik Hall", shortName: "Henzlik", type: "academic", coordinates: coords(-96.7002182, 40.8211174), capacity: estCapacity(74), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "HLH", name: "Howard L. Hawks Hall", shortName: "Hawks", type: "academic", coordinates: coords(-96.70122, 40.820183), capacity: estCapacity(300), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "JH", name: "Jorgensen Hall", shortName: "Jorgensen", type: "academic", coordinates: coords(-96.69849, 40.821862), capacity: estCapacity(135), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "KAUF", name: "Kauffman", shortName: "Kauffman", type: "residential", coordinates: coords(-96.7003937, 40.8194618), capacity: 650, hours: "24/7", description: "Residence hall housing approximately 650 students with dining and study spaces." },
  { id: "KEIM", name: "Keim Hall", shortName: "Keim", type: "academic", coordinates: coords(-96.666153, 40.8307571), capacity: estCapacity(4), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "KH", name: "Kiewit Hall A253", shortName: "Kiewit", type: "academic", coordinates: coords(-96.69653, 40.82088), capacity: estCapacity(158), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "KRH", name: "Kimbal Recital Hall", shortName: "Kimbal", type: "academic", coordinates: coords(-96.7050095, 40.8166351), capacity: estCapacity(19), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "LAW", name: "Ross McCollum Hall", shortName: "Law", type: "administrative", coordinates: coords(-96.6602631, 40.8308067), capacity: estCapacity(1), hours: "8:00 AM - 5:00 PM", description: "Campus building." },
  { id: "LCM", name: "The Agency", shortName: "The Agency", type: "academic", coordinates: coords(-96.70024, 40.81508), capacity: estCapacity(12), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "LLS", name: "Love Library", shortName: "Love Library", type: "library", coordinates: coords(-96.7024536, 40.8178253), capacity: 800, hours: "7:30 AM - 12:00 AM", description: "Main campus library with study rooms, archives, and computer labs." },
  { id: "LPH", name: "Louise Pound Hall", shortName: "Pound", type: "academic", coordinates: coords(-96.7033539, 40.8178368), capacity: estCapacity(131), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "M&N", name: "Military & Naval Science", shortName: "M&N", type: "administrative", coordinates: CAMPUS_CENTER, capacity: estCapacity(23), hours: "8:00 AM - 5:00 PM", description: "Campus building. Location approximate." },
  { id: "MANT", name: "Manter Hall", shortName: "Manter", type: "academic", coordinates: coords(-96.7051773, 40.8188744), capacity: estCapacity(84), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "MOLR", name: "Morrison Center", shortName: "Morrison", type: "athletic", coordinates: coords(-96.659163, 40.831833), capacity: estCapacity(1), hours: "Varies", description: "Campus building." },
  { id: "MORR", name: "Morrill Hall", shortName: "Morrill", type: "academic", coordinates: coords(-96.701767, 40.8199158), capacity: estCapacity(9), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "NH", name: "Nebraska Hall", shortName: "Nebraska Hall", type: "academic", coordinates: coords(-96.6975403, 40.823082), capacity: estCapacity(51), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "NU", name: "Nebraska Union", shortName: "Union", type: "dining", coordinates: coords(-96.7003708, 40.8177872), capacity: 1200, hours: "7:00 AM - 11:00 PM", description: "Main student union with dining options, meeting rooms, and student org offices." },
  { id: "OAC", name: "Outdoor Adventures Center Arra", shortName: "OAC", type: "recreation", coordinates: coords(-96.7008, 40.82314), capacity: estCapacity(9), hours: "Varies", description: "Campus building." },
  { id: "OLDH", name: "Oldfather Hall", shortName: "Oldfather", type: "academic", coordinates: coords(-96.70327, 40.8197021), capacity: estCapacity(127), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "OTHM", name: "Othmer Hall", shortName: "Othmer", type: "academic", coordinates: coords(-96.6973724, 40.8212776), capacity: estCapacity(41), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "PLSH", name: "Plant Sciences", shortName: "Plant Sci", type: "academic", coordinates: coords(-96.666153, 40.8311958), capacity: estCapacity(16), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "RH", name: "Richards Hall", shortName: "Richards", type: "academic", coordinates: coords(-96.7063141, 40.8186989), capacity: estCapacity(128), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "RVB", name: "Ross-Van Brunt", shortName: "Ross-Van Brunt", type: "academic", coordinates: coords(-96.7030792, 40.8164902), capacity: estCapacity(14), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "SEC", name: "Scott Engineering Ctr Arr", shortName: "Scott Eng", type: "academic", coordinates: coords(-96.6976013, 40.8220749), capacity: estCapacity(12), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "TEAC", name: "Teachers College", shortName: "Teachers College", type: "academic", coordinates: coords(-96.7003555, 40.8213425), capacity: estCapacity(59), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "TEMP", name: "Temple Building", shortName: "Temple", type: "academic", coordinates: coords(-96.7034836, 40.8165855), capacity: estCapacity(34), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "WAB", name: "Woods Art", shortName: "Woods Art", type: "academic", coordinates: coords(-96.7050858, 40.8178368), capacity: estCapacity(63), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
  { id: "WMB", name: "Westbrook Music", shortName: "Westbrook", type: "academic", coordinates: coords(-96.7058258, 40.8169289), capacity: estCapacity(523), hours: "7:00 AM - 10:00 PM", description: "Campus building." },
];

export const BUILDING_TYPE_COLORS: Record<Building["type"], string> = {
  residential: "#3b82f6",
  academic: "#8b5cf6",
  dining: "#f59e0b",
  library: "#06b6d4",
  athletic: "#ef4444",
  recreation: "#10b981",
  administrative: "#6b7280",
};

export function getBuildingById(id: string): Building | undefined {
  return BUILDINGS.find((b) => b.id === id);
}
