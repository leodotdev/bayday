const SPECIES: Record<string, string> = {
  barracuda: "/species/barracuda.png",
  "black-drum": "/species/black-drum.png",
  "blackfin-tuna": "/species/blackfin-tuna.png",
  "blue-marlin": "/species/blue-marlin.png",
  bonefish: "/species/bonefish.png",
  "cero-mackerel": "/species/cero-mackerel.png",
  escolar: "/species/escolar.png",
  grouper: "/species/grouper.png",
  hogfish: "/species/hogfish.png",
  "juvenile-tarpon": "/species/juvenile-tarpon.png",
  "king-mackerel": "/species/king-mackerel.png",
  kingfish: "/species/kingfish.png",
  "lane-snapper": "/species/lane-snapper.png",
  "mahi-mahi": "/species/mahi-mahi.png",
  "mangrove-snapper": "/species/mangrove-snapper.png",
  permit: "/species/permit.png",
  "queen-snapper": "/species/queen-snapper.png",
  "red-grouper": "/species/red-grouper.png",
  redfish: "/species/redfish.png",
  snook: "/species/snook.png",
  "spotted-sea-trout": "/species/spotted-sea-trout.png",
  swordfish: "/species/swordfish.png",
  tarpon: "/species/tarpon.png",
  triggerfish: "/species/triggerfish.png",
  wahoo: "/species/wahoo.png",
  "yellowtail-snapper": "/species/yellowtail-snapper.png",
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[\s_]+/g, "-")
}

export function getSpeciesImage(name: string): string | null {
  return SPECIES[slugify(name)] ?? null
}
