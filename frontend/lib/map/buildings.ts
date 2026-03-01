// UNL Campus Building Data
// All 51 buildings (validated via maps.unl.edu/building/<id>/info?format=partial); LCM removed (Building not found).
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
  address: string;
}

/** Minimal campus building from API (same 51). Used for click/hover; lookup in BUILDINGS by id. */
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
  // Names, coordinates, and addresses from maps.unl.edu/building/<id>/info?format=partial
  { id: "ACB", name: "Agricultural Communications Building", shortName: "ACB", type: "academic", coordinates: [-96.668456, 40.829081], capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "3620 East Campus Loop S" },
  { id: "ANDN", name: "Andersen Hall", shortName: "ANDN", type: "academic", coordinates: [-96.699239, 40.815279], capacity: estCapacity(97), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "200 Centennial Mall N" },
  { id: "ANDR", name: "Andrews Hall", shortName: "ANDR", type: "academic", coordinates: [-96.701857, 40.819349], capacity: estCapacity(104), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "625 N 14th St" },
  { id: "ANSC", name: "Animal Science Complex", shortName: "ANSC", type: "academic", coordinates: [-96.664330, 40.832381], capacity: estCapacity(10), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "3940 Fair St" },
  { id: "ARCH", name: "Architecture Hall", shortName: "ARCH", type: "academic", coordinates: [-96.706075, 40.817435], capacity: estCapacity(90), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "402 Stadium Dr" },
  { id: "AVH", name: "Avery Hall", shortName: "AVH", type: "academic", coordinates: [-96.704660, 40.819489], capacity: 450, hours: "7:00 AM - 10:00 PM", description: "Home to Mathematics and Computer Science departments with lecture halls.", address: "1144 T St" },
  { id: "BEAD", name: "Beadle Center", shortName: "BEAD", type: "academic", coordinates: [-96.693104, 40.820003], capacity: estCapacity(87), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1901 Vine St" },
  { id: "BESY", name: "Bessey Hall", shortName: "BESY", type: "academic", coordinates: [-96.703294, 40.819968], capacity: estCapacity(66), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1215 U St" },
  { id: "BKC", name: "Barkley Memorial Center", shortName: "BKC", type: "academic", coordinates: [-96.660698, 40.828801], capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "4075 East Campus Loop S" },
  { id: "BL", name: "Brace Laboratory", shortName: "BL", type: "academic", coordinates: [-96.706249, 40.818074], capacity: estCapacity(83), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "510 Stadium Dr" },
  { id: "BURN", name: "Burnett Hall", shortName: "BURN", type: "academic", coordinates: [-96.703295, 40.819399], capacity: estCapacity(178), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1220 T St" },
  { id: "CEMA", name: "Johnny Carson Center for Emerging Media Arts", shortName: "CEMA", type: "academic", coordinates: [-96.702233, 40.816245], capacity: estCapacity(25), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1300 Q St" },
  { id: "CHA", name: "Chase Hall", shortName: "CHA", type: "academic", coordinates: [-96.668926, 40.831415], capacity: estCapacity(3), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "3605 Fair St" },
  { id: "CPEH", name: "Carolyn Pope Edwards Hall", shortName: "CPEH", type: "academic", coordinates: [-96.700783, 40.821793], capacity: estCapacity(74), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "840 N 14th St" },
  { id: "CREC", name: "Sapp Recreation Facility", shortName: "CREC", type: "recreation", coordinates: [-96.702121, 40.821593], capacity: 1000, hours: "6:00 AM - 11:00 PM", description: "Fitness center, pool, basketball courts, climbing wall, and group fitness studios.", address: "841 N 14th St" },
  { id: "DINS", name: "Dinsdale Family Learning Commons", shortName: "DINS", type: "library", coordinates: [-96.666129, 40.829406], capacity: estCapacity(2), hours: "7:30 AM - 10:00 PM", description: "Campus building.", address: "1625 N 38th St" },
  { id: "ENTO", name: "Entomology Hall", shortName: "ENTO", type: "academic", coordinates: [-96.668429, 40.830065], capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1700 East Campus Mall" },
  { id: "ERC", name: "Engineering Research Center", shortName: "ERC", type: "academic", coordinates: [-96.697458, 40.822474], capacity: estCapacity(4), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "880 N 16th St" },
  { id: "FIC", name: "Food Innovation Center", shortName: "FIC", type: "academic", coordinates: [-96.692702, 40.831622], capacity: estCapacity(8), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1901 N 21st St" },
  { id: "FOOD", name: "Food Industry Complex", shortName: "FOOD", type: "academic", coordinates: [-96.666974, 40.828946], capacity: estCapacity(3), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "3720 East Campus Loop S" },
  { id: "FYH", name: "Filley Hall", shortName: "FYH", type: "academic", coordinates: [-96.667428, 40.828894], capacity: estCapacity(2), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "3720 East Campus Loop S" },
  { id: "GNHS", name: "Gwendolyn A. Newkirk Human Sciences Building", shortName: "GNHS", type: "academic", coordinates: [-96.669447, 40.830068], capacity: estCapacity(3), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1650 N 35th St" },
  { id: "HAH", name: "Hamilton Hall", shortName: "HAH", type: "academic", coordinates: [-96.704522, 40.818724], capacity: 600, hours: "7:00 AM - 10:00 PM", description: "Major classroom building for sciences and mathematics departments.", address: "639 N 12th St" },
  { id: "HARH", name: "Hardin Hall", shortName: "HARH", type: "academic", coordinates: [-96.671836, 40.828917], capacity: estCapacity(4), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "3310 Holdrege St" },
  { id: "HENZ", name: "Henzlik Hall", shortName: "HENZ", type: "academic", coordinates: [-96.699937, 40.821245], capacity: estCapacity(74), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1430 Vine St" },
  { id: "HLH", name: "Howard L. Hawks Hall", shortName: "HLH", type: "academic", coordinates: [-96.700447, 40.820399], capacity: estCapacity(300), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "730 N 14th St" },
  { id: "JH", name: "Theodore Jorgensen Hall", shortName: "JH", type: "academic", coordinates: [-96.698702, 40.822034], capacity: estCapacity(135), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "855 N 16th St" },
  { id: "KAUF", name: "Kauffman Academic Residential Center", shortName: "KAUF", type: "residential", coordinates: [-96.700479, 40.819534], capacity: 650, hours: "24/7", description: "Residence hall housing approximately 650 students with dining and study spaces.", address: "630 N 14th St" },
  { id: "KEIM", name: "Keim Hall", shortName: "KEIM", type: "academic", coordinates: [-96.666162, 40.830823], capacity: estCapacity(4), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1825 N 38th St" },
  { id: "KH", name: "Kiewit Hall", shortName: "KH", type: "academic", coordinates: [-96.696493, 40.821187], capacity: estCapacity(158), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1700 Vine St" },
  { id: "KRH", name: "Kimball Recital Hall", shortName: "KRH", type: "academic", coordinates: [-96.705164, 40.816641], capacity: estCapacity(19), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1113 R St" },
  { id: "LAW", name: "McCollum Hall", shortName: "LAW", type: "administrative", coordinates: [-96.660341, 40.830762], capacity: estCapacity(1), hours: "8:00 AM - 5:00 PM", description: "Campus building.", address: "1875 N 42nd St" },
  { id: "LLS", name: "Love Library South", shortName: "LLS", type: "library", coordinates: [-96.702590, 40.817858], capacity: 800, hours: "7:30 AM - 12:00 AM", description: "Main campus library with study rooms, archives, and computer labs.", address: "1248 R St" },
  { id: "LPH", name: "Louise Pound Hall", shortName: "LPH", type: "academic", coordinates: [-96.703418, 40.817804], capacity: estCapacity(131), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "512 N 12th St" },
  { id: "M&N", name: "Military & Naval Science", shortName: "M&N", type: "administrative", coordinates: CAMPUS_CENTER, capacity: estCapacity(23), hours: "8:00 AM - 5:00 PM", description: "Campus building. Location approximate.", address: "" },
  { id: "MANT", name: "Manter Hall", shortName: "MANT", type: "academic", coordinates: [-96.705343, 40.818901], capacity: estCapacity(84), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1101 T St" },
  { id: "MOLR", name: "Morrison Center", shortName: "MOLR", type: "athletic", coordinates: [-96.659358, 40.832126], capacity: estCapacity(1), hours: "Varies", description: "Campus building.", address: "4240 Fair St" },
  { id: "MORR", name: "Morrill Hall", shortName: "MORR", type: "academic", coordinates: [-96.701855, 40.819896], capacity: estCapacity(9), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1335 U St" },
  { id: "NH", name: "Nebraska Hall", shortName: "NH", type: "academic", coordinates: [-96.697314, 40.822925], capacity: estCapacity(51), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "900 N 16th St" },
  { id: "NU", name: "Nebraska Union", shortName: "NU", type: "dining", coordinates: [-96.700477, 40.817598], capacity: 1200, hours: "7:00 AM - 11:00 PM", description: "Main student union with dining options, meeting rooms, and student org offices.", address: "1400 R St" },
  { id: "OAC", name: "Outdoor Adventures Center", shortName: "OAC", type: "recreation", coordinates: [-96.700712, 40.823134], capacity: estCapacity(9), hours: "Varies", description: "Campus building.", address: "930 N 14th St" },
  { id: "OLDH", name: "Oldfather Hall", shortName: "OLDH", type: "academic", coordinates: [-96.703542, 40.819698], capacity: estCapacity(127), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "660 N 12th St" },
  { id: "OTHM", name: "Othmer Hall", shortName: "OTHM", type: "academic", coordinates: [-96.697345, 40.821301], capacity: estCapacity(41), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "820 N 16th St" },
  { id: "PLSH", name: "Plant Sciences Hall", shortName: "PLSH", type: "academic", coordinates: [-96.666163, 40.831221], capacity: estCapacity(16), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1875 N 38th St" },
  { id: "RH", name: "Richards Hall", shortName: "RH", type: "academic", coordinates: [-96.706415, 40.818770], capacity: estCapacity(128), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "560 Stadium Dr" },
  { id: "RVB", name: "Mary Riepma Ross Media Arts Center-Van Brunt Visitors Center", shortName: "RVB", type: "academic", coordinates: [-96.703065, 40.816403], capacity: estCapacity(14), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "313 N 13th St" },
  { id: "SEC", name: "Scott Engineering Center", shortName: "SEC", type: "academic", coordinates: [-96.697525, 40.821945], capacity: estCapacity(12), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "844 N 16th St" },
  { id: "TEAC", name: "Teachers College Hall", shortName: "TEAC", type: "academic", coordinates: [-96.700368, 40.821294], capacity: estCapacity(59), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1400 Vine St" },
  { id: "TEMP", name: "Temple Building", shortName: "TEMP", type: "academic", coordinates: [-96.703528, 40.816568], capacity: estCapacity(34), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1209 R St" },
  { id: "WAB", name: "Woods Art Building", shortName: "WAB", type: "academic", coordinates: [-96.705148, 40.817843], capacity: estCapacity(63), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1140 R St" },
  { id: "WMB", name: "Westbrook Music Building", shortName: "WMB", type: "academic", coordinates: [-96.706200, 40.816540], capacity: estCapacity(523), hours: "7:00 AM - 10:00 PM", description: "Campus building.", address: "1104 R St" },
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
