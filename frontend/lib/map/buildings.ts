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
  { id: "ACB", name: "Agricultural Communications Building", shortName: "ACB", type: "academic", coordinates: [-96.668456, 40.829081], capacity: 250, hours: "7:00 AM - 10:00 PM", description: "Houses capstone programs for Agricultural Communications and Strategic Discussions for Nebraska.", address: "3620 East Campus Loop S" },
  { id: "ANDN", name: "Andersen Hall", shortName: "ANDN", type: "academic", coordinates: [-96.699239, 40.815279], capacity: 169, hours: "7:00 AM - 10:00 PM", description: "Home to Journalism and Mass Communications.", address: "200 Centennial Mall N" },
  { id: "ANDR", name: "Andrews Hall", shortName: "ANDR", type: "academic", coordinates: [-96.701857, 40.819349], capacity: 850, hours: "7:00 AM - 10:00 PM", description: "Headquarters for the Department of English and the Writing Center.", address: "625 N 14th St" },
  { id: "ANSC", name: "Animal Science Complex", shortName: "ANSC", type: "academic", coordinates: [-96.664330, 40.832381], capacity: 1200, hours: "7:00 AM - 10:00 PM", description: "Home to Animal Science.", address: "3940 Fair St" },
  { id: "ARCH", name: "Architecture Hall", shortName: "ARCH", type: "academic", coordinates: [-96.706075, 40.817435], capacity: 800, hours: "7:00 AM - 10:00 PM", description: "Home to the College of Architecture.", address: "402 Stadium Dr" },
  { id: "AVH", name: "Avery Hall", shortName: "AVH", type: "academic", coordinates: [-96.704660, 40.819489], capacity: 1000, hours: "7:00 AM - 10:00 PM", description: "Home to Mathematics and the School of Computing.", address: "1144 T St" },
  { id: "BEAD", name: "Beadle Center", shortName: "BEAD", type: "academic", coordinates: [-96.693104, 40.820003], capacity: 1400, hours: "7:00 AM - 10:00 PM", description: "Biosciences research hub housing biochemistry and plant science centers.", address: "1901 Vine St" },
  { id: "BESY", name: "Bessey Hall", shortName: "BESY", type: "academic", coordinates: [-96.703294, 40.819968], capacity: 900, hours: "7:00 AM - 10:00 PM", description: "Houses the School of Biological Sciences.", address: "1215 U St" },
  { id: "BKC", name: "Barkley Memorial Center", shortName: "BKC", type: "academic", coordinates: [-96.660698, 40.828801], capacity: 450, hours: "7:00 AM - 10:00 PM", description: "Home to Special Education and Communication Disorders and a speech-language and hearing clinic.", address: "4075 East Campus Loop S" },
  { id: "BL", name: "Brace Laboratory", shortName: "BL", type: "academic", coordinates: [-96.706249, 40.818074], capacity: 474, hours: "7:00 AM - 10:00 PM", description: "Renovated for Business and life sciences.", address: "510 Stadium Dr" },
  { id: "BURN", name: "Burnett Hall", shortName: "BURN", type: "academic", coordinates: [-96.703295, 40.819399], capacity: 1100, hours: "7:00 AM - 10:00 PM", description: "Home to social science departments like Psychology and Sociology.", address: "1220 T St" },
  { id: "CEMA", name: "Johnny Carson Center for Emerging Media Arts", shortName: "CEMA", type: "academic", coordinates: [-96.702233, 40.816245], capacity: 300, hours: "7:00 AM - 10:00 PM", description: "Interdisciplinary hub for filmmakers and game designers.", address: "1300 Q St" },
  { id: "CHA", name: "Chase Hall", shortName: "CHA", type: "academic", coordinates: [-96.668926, 40.831415], capacity: 200, hours: "7:00 AM - 10:00 PM", description: "Home to the Department of Biological Systems Engineering.", address: "3605 Fair St" },
  { id: "CPEH", name: "Carolyn Pope Edwards Hall", shortName: "CPEH", type: "academic", coordinates: [-96.700783, 40.821793], capacity: 1900, hours: "7:00 AM - 10:00 PM", description: "Home to CEHS Dean's Office.", address: "840 N 14th St" },
  { id: "CREC", name: "Sapp Recreation Facility", shortName: "CREC", type: "recreation", coordinates: [-96.702121, 40.821593], capacity: 1000, hours: "6:00 AM - 11:00 PM", description: "Major recreation facility with fitness, pools, courts, and indoor climbing.", address: "841 N 14th St" },
  { id: "DINS", name: "Dinsdale Family Learning Commons", shortName: "DINS", type: "library", coordinates: [-96.666129, 40.829406], capacity: 250, hours: "7:30 AM - 10:00 PM", description: "Learning commons on East Campus.", address: "1625 N 38th St" },
  { id: "ENTO", name: "Entomology Hall", shortName: "ENTO", type: "academic", coordinates: [-96.668429, 40.830065], capacity: 350, hours: "7:00 AM - 10:00 PM", description: "Home to the Department of Entomology.", address: "1700 East Campus Mall" },
  { id: "ERC", name: "Engineering Research Center", shortName: "ERC", type: "academic", coordinates: [-96.697458, 40.822474], capacity: 800, hours: "7:00 AM - 10:00 PM", description: "Research facility for materials and biomedical engineering.", address: "880 N 16th St" },
  { id: "FIC", name: "Food Innovation Center", shortName: "FIC", type: "academic", coordinates: [-96.692702, 40.831622], capacity: 1600, hours: "7:00 AM - 10:00 PM", description: "Houses Food Science and Technology and private industry partners.", address: "1901 N 21st St" },
  { id: "FOOD", name: "Food Industry Complex", shortName: "FOOD", type: "academic", coordinates: [-96.666974, 40.828946], capacity: 300, hours: "7:00 AM - 10:00 PM", description: "Houses pilot plants and research for Agricultural Economics.", address: "3720 East Campus Loop S" },
  { id: "FYH", name: "Filley Hall", shortName: "FYH", type: "academic", coordinates: [-96.667428, 40.828894], capacity: 250, hours: "7:00 AM - 10:00 PM", description: "Historic building housing Agricultural Economics.", address: "3720 East Campus Loop S" },
  { id: "GNHS", name: "Gwendolyn A. Newkirk Human Sciences Building", shortName: "GNHS", type: "academic", coordinates: [-96.669447, 40.830068], capacity: 500, hours: "7:00 AM - 10:00 PM", description: "Home to Nutrition and Health Sciences and Textiles, Merchandising & Fashion Design.", address: "1650 N 35th St" },
  { id: "HAH", name: "Hamilton Hall", shortName: "HAH", type: "academic", coordinates: [-96.704522, 40.818724], capacity: 2200, hours: "7:00 AM - 10:00 PM", description: "High-rise chemistry research facility.", address: "639 N 12th St" },
  { id: "HARH", name: "Hardin Hall", shortName: "HARH", type: "academic", coordinates: [-96.671836, 40.828917], capacity: 1800, hours: "7:00 AM - 10:00 PM", description: "Headquarters for Natural Resources.", address: "3310 Holdrege St" },
  { id: "HENZ", name: "Henzlik Hall", shortName: "HENZ", type: "academic", coordinates: [-96.699937, 40.821245], capacity: 600, hours: "7:00 AM - 10:00 PM", description: "Houses the College of Education and Human Sciences.", address: "1430 Vine St" },
  { id: "HLH", name: "Howard L. Hawks Hall", shortName: "HLH", type: "academic", coordinates: [-96.700447, 40.820399], capacity: 5000, hours: "7:00 AM - 10:00 PM", description: "High-capacity business hub.", address: "730 N 14th St" },
  { id: "JH", name: "Theodore Jorgensen Hall", shortName: "JH", type: "academic", coordinates: [-96.698702, 40.822034], capacity: 1200, hours: "7:00 AM - 10:00 PM", description: "Home to Physics and Astronomy.", address: "855 N 16th St" },
  { id: "KAUF", name: "Kauffman Academic Residential Center", shortName: "KAUF", type: "residential", coordinates: [-96.700479, 40.819534], capacity: 650, hours: "24/7", description: "Residential center for Honors students.", address: "630 N 14th St" },
  { id: "KEIM", name: "Keim Hall", shortName: "KEIM", type: "academic", coordinates: [-96.666162, 40.830823], capacity: 300, hours: "7:00 AM - 10:00 PM", description: "Home to Agronomy and Horticulture.", address: "1825 N 38th St" },
  { id: "KH", name: "Kiewit Hall", shortName: "KH", type: "academic", coordinates: [-96.696493, 40.821187], capacity: 4000, hours: "7:00 AM - 10:00 PM", description: "Hub for engineering education.", address: "1700 Vine St" },
  { id: "KRH", name: "Kimball Recital Hall", shortName: "KRH", type: "academic", coordinates: [-96.705164, 40.816641], capacity: 850, hours: "7:00 AM - 10:00 PM", description: "Performance venue for the School of Music.", address: "1113 R St" },
  { id: "LAW", name: "McCollum Hall", shortName: "LAW", type: "administrative", coordinates: [-96.660341, 40.830762], capacity: 600, hours: "8:00 AM - 5:00 PM", description: "Home to the College of Law.", address: "1875 N 42nd St" },
  { id: "LLS", name: "Love Library South", shortName: "LLS", type: "library", coordinates: [-96.702590, 40.817858], capacity: 3000, hours: "7:30 AM - 12:00 AM", description: "Primary library complex.", address: "1248 R St" },
  { id: "LPH", name: "Louise Pound Hall", shortName: "LPH", type: "academic", coordinates: [-96.703418, 40.817804], capacity: 400, hours: "7:00 AM - 10:00 PM", description: "Houses general-purpose classrooms and administrative offices.", address: "512 N 12th St" },
  { id: "M&N", name: "Military & Naval Science", shortName: "M&N", type: "administrative", coordinates: CAMPUS_CENTER, capacity: 350, hours: "8:00 AM - 5:00 PM", description: "Headquarters for Army, Navy, and Air Force ROTC programs.", address: "" },
  { id: "MANT", name: "Manter Hall", shortName: "MANT", type: "academic", coordinates: [-96.705343, 40.818901], capacity: 800, hours: "7:00 AM - 10:00 PM", description: "Home to biological sciences research and undergraduate teaching.", address: "1101 T St" },
  { id: "MOLR", name: "Morrison Center", shortName: "MOLR", type: "athletic", coordinates: [-96.659358, 40.832126], capacity: 850, hours: "Varies", description: "Home to the Nebraska Center for Virology.", address: "4240 Fair St" },
  { id: "MORR", name: "Morrill Hall", shortName: "MORR", type: "academic", coordinates: [-96.701855, 40.819896], capacity: 300, hours: "7:00 AM - 10:00 PM", description: "Home to the State Museum of Natural History.", address: "1335 U St" },
  { id: "NH", name: "Nebraska Hall", shortName: "NH", type: "academic", coordinates: [-96.697314, 40.822925], capacity: 4160, hours: "7:00 AM - 10:00 PM", description: "Houses Mechanical Engineering and Holland Computing.", address: "900 N 16th St" },
  { id: "NU", name: "Nebraska Union", shortName: "NU", type: "dining", coordinates: [-96.700477, 40.817598], capacity: 1200, hours: "7:00 AM - 11:00 PM", description: "Central student hub with dining and student organizations.", address: "1400 R St" },
  { id: "OAC", name: "Outdoor Adventures Center", shortName: "OAC", type: "recreation", coordinates: [-96.700712, 40.823134], capacity: 150, hours: "Varies", description: "Recreation facility with climbing gym and bike shop.", address: "930 N 14th St" },
  { id: "OLDH", name: "Oldfather Hall", shortName: "OLDH", type: "academic", coordinates: [-96.703542, 40.819698], capacity: 1000, hours: "7:00 AM - 10:00 PM", description: "Tower housing History, Sociology, and Political Science.", address: "660 N 12th St" },
  { id: "OTHM", name: "Othmer Hall", shortName: "OTHM", type: "academic", coordinates: [-96.697345, 40.821301], capacity: 1200, hours: "7:00 AM - 10:00 PM", description: "Headquarters for Chemical and Biomolecular Engineering.", address: "820 N 16th St" },
  { id: "PLSH", name: "Plant Sciences Hall", shortName: "PLSH", type: "academic", coordinates: [-96.666163, 40.831221], capacity: 400, hours: "7:00 AM - 10:00 PM", description: "Home to Plant Sciences and Agronomy and Horticulture research.", address: "1875 N 38th St" },
  { id: "RH", name: "Richards Hall", shortName: "RH", type: "academic", coordinates: [-96.706415, 40.818770], capacity: 500, hours: "7:00 AM - 10:00 PM", description: "Home to Art, Art History & Design.", address: "560 Stadium Dr" },
  { id: "RVB", name: "Mary Riepma Ross Media Arts Center-Van Brunt Visitors Center", shortName: "RVB", type: "academic", coordinates: [-96.703065, 40.816403], capacity: 300, hours: "7:00 AM - 10:00 PM", description: "Houses the Ross Media Arts Center and the Van Brunt Visitors Center.", address: "313 N 13th St" },
  { id: "SEC", name: "Scott Engineering Center", shortName: "SEC", type: "academic", coordinates: [-96.697525, 40.821945], capacity: 1200, hours: "7:00 AM - 10:00 PM", description: "Home to Civil and Environmental Engineering and Electrical and Computer Engineering.", address: "844 N 16th St" },
  { id: "TEAC", name: "Teachers College Hall", shortName: "TEAC", type: "academic", coordinates: [-96.700368, 40.821294], capacity: 700, hours: "7:00 AM - 10:00 PM", description: "Home to Educational Psychology and education programs.", address: "1400 Vine St" },
  { id: "TEMP", name: "Temple Building", shortName: "TEMP", type: "academic", coordinates: [-96.703528, 40.816568], capacity: 600, hours: "7:00 AM - 10:00 PM", description: "Home to Theatre & Film.", address: "1209 R St" },
  { id: "WAB", name: "Woods Art Building", shortName: "WAB", type: "academic", coordinates: [-96.705148, 40.817843], capacity: 400, hours: "7:00 AM - 10:00 PM", description: "Houses fine art and digital labs for art and design.", address: "1140 R St" },
  { id: "WMB", name: "Westbrook Music Building", shortName: "WMB", type: "academic", coordinates: [-96.706200, 40.816540], capacity: 1100, hours: "7:00 AM - 10:00 PM", description: "Major music facility for the School of Music.", address: "1104 R St" },
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
