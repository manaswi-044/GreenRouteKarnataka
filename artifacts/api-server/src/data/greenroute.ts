import type { Hub, Place } from "@workspace/api-zod";

export const hubs: Hub[] = [
  { id: "Bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946, railConnected: true, metro: true },
  { id: "Mysuru", name: "Mysuru", lat: 12.2958, lng: 76.6394, railConnected: true },
  { id: "Mangaluru", name: "Mangaluru", lat: 12.9141, lng: 74.856, railConnected: true },
  { id: "Hubballi", name: "Hubballi", lat: 15.3647, lng: 75.124, railConnected: true },
  { id: "Belagavi", name: "Belagavi", lat: 15.8497, lng: 74.4977, railConnected: true },
  { id: "Hosapete", name: "Hosapete", lat: 15.2689, lng: 76.3909, railConnected: true },
  { id: "Madikeri", name: "Madikeri", lat: 12.4244, lng: 75.7382, railConnected: false },
  { id: "Udupi", name: "Udupi", lat: 13.3409, lng: 74.7421, railConnected: true },
  { id: "Shivamogga", name: "Shivamogga", lat: 13.9299, lng: 75.5681, railConnected: true },
  { id: "Vijayapura", name: "Vijayapura", lat: 16.8302, lng: 75.7100, railConnected: true },
  { id: "Bidar", name: "Bidar", lat: 17.9104, lng: 77.5199, railConnected: true },
  { id: "Chikkamagaluru", name: "Chikkamagaluru", lat: 13.3161, lng: 75.772, railConnected: false },
  { id: "Hassan", name: "Hassan", lat: 13.0068, lng: 76.1004, railConnected: true },
];

const months = (start: number, end: number): number[] => {
  const result: number[] = [];
  for (let month = start; ; month = month % 12 + 1) {
    result.push(month);
    if (month === end) return result;
  }
};

function place(
  id: string,
  name: string,
  hub: string,
  lat: number,
  lng: number,
  tags: Place["tags"],
  hiddenGem: boolean,
  fee: number,
  visitHrs: number,
  bestMonths: number[],
  outdoor: boolean,
  wiki: string,
  desc: string,
  metroStation?: string,
): Place {
  return {
    id, name, region: hub, hub, lat, lng, tags, hiddenGem, fee, visitHrs,
    bestMonths, outdoor, wiki, desc, ...(metroStation ? { metroStation } : {}),
  };
}

export const places: Place[] = [
  place("mysore-palace", "Mysore Palace", "Mysuru", 12.3052, 76.6552, ["history"], false, 100, 2, months(10, 3), false, "Mysore Palace", "Glowing domes, carved teak doors and stained-glass ceilings fill the former royal residence. Arrive as the palace lights come on to see its Indo-Saracenic details at their most dramatic."),
  place("chamundi-hills", "Chamundi Hills & Temple", "Mysuru", 12.2724, 76.6701, ["temples", "nature"], false, 0, 2, months(10, 2), true, "Chamundi Hills", "Climb or drive to a hilltop shrine above Mysuru, with city views and a landmark monolithic Nandi along the way."),
  place("brindavan", "Brindavan Gardens", "Mysuru", 12.4244, 76.5726, ["nature"], false, 50, 2, months(9, 2), true, "Brindavan Gardens", "Walk the patterned gardens beside the Krishnaraja Sagara reservoir. The illuminated fountains make the evening visit especially memorable."),
  place("somanathapura", "Chennakesava Temple, Somanathapura", "Mysuru", 12.2735, 76.8789, ["history", "temples"], true, 25, 1.5, months(10, 3), false, "Chennakeshava Temple, Somanathapura", "This compact Hoysala temple is covered in finely worked stone panels, from miniature shrines to scenes from epic literature."),
  place("kokkare-bellur", "Kokkare Bellur Pelican Village", "Mysuru", 12.493, 76.702, ["wildlife", "hidden-gems"], true, 0, 1.5, months(11, 3), true, "Kokkare Bellur", "A quiet village where residents share their trees and rooftops with nesting pelicans and painted storks. Visit respectfully and keep a little distance from the birds."),
  place("srirangapatna", "Srirangapatna Fort & Tipu's Summer Palace", "Mysuru", 12.418, 76.693, ["history"], false, 25, 2.5, months(10, 3), true, "Srirangapatna", "Follow island-fort ramparts, riverside temples and Tipu Sultan's painted summer residence through a layered chapter of Mysuru history."),
  place("hampi-virupaksha", "Virupaksha Temple, Hampi", "Hosapete", 15.335, 76.46, ["history", "temples"], false, 0, 1.5, months(10, 2), false, "Virupaksha Temple, Hampi", "A living temple rises above the old bazaar street, with a towering entrance and views across Hampi's boulder-strewn landscape."),
  place("hampi-vittala", "Vittala Temple & Stone Chariot", "Hosapete", 15.335, 76.4747, ["history"], false, 40, 2.5, months(10, 2), true, "Vittala Temple", "Explore one of Hampi's grandest temple complexes, best known for its stone chariot and intricately sculpted pillared halls."),
  place("hampi-matanga", "Matanga Hill Sunrise", "Hosapete", 15.3306, 76.4672, ["nature", "hidden-gems"], true, 0, 2, months(10, 2), true, "Hampi", "A steep early-morning climb ends in wide views over temple towers, the Tungabhadra and Hampi's boulder hills."),
  place("anegundi", "Anegundi & Hanuman Temple (Anjanadri)", "Hosapete", 15.351, 76.496, ["temples", "adventure", "hidden-gems"], true, 0, 3, months(10, 2), true, "Anegundi", "Cross the river to old Anegundi and its hilltop Anjanadri temple for village lanes, a long stair climb and an open view of the Hampi landscape."),
  place("badami-caves", "Badami Cave Temples", "Vijayapura", 15.9188, 75.6859, ["history", "temples"], false, 40, 2.5, months(10, 2), true, "Badami cave temples", "Carved sandstone cave shrines look out across the red cliffs and Agastya Lake, with intricate figures carved directly into the rock."),
  place("pattadakal", "Pattadakal (UNESCO)", "Vijayapura", 15.9486, 75.8165, ["history", "temples"], false, 40, 1.5, months(10, 2), true, "Pattadakal", "A UNESCO-listed group of temples shows several early Chalukyan architectural styles gathered beside the Malaprabha River."),
  place("aihole", "Aihole Temples", "Vijayapura", 16.0213, 75.8847, ["history", "hidden-gems"], true, 40, 2, months(10, 2), true, "Aihole", "Small shrines and experimental temple forms sit among quiet village paths in an important early centre of Indian architecture."),
  place("gol-gumbaz", "Gol Gumbaz, Vijayapura", "Vijayapura", 16.8302, 75.7336, ["history"], false, 25, 1.5, months(10, 2), false, "Gol Gumbaz", "The immense dome of this Deccan mausoleum shelters an echoing whispering gallery and one of India's most distinctive historic skylines."),
  place("ibrahim-rauza", "Ibrahim Rauza", "Vijayapura", 16.835, 75.7237, ["history"], true, 25, 1, months(10, 2), false, "Ibrahim Rauza", "Slender minarets, calligraphy and balanced stonework give this mausoleum complex a quieter, finely detailed character."),
  place("lakkundi", "Lakkundi Temples", "Hubballi", 15.386, 75.713, ["history", "temples", "hidden-gems"], true, 0, 1.5, months(10, 2), true, "Lakkundi", "Explore scattered stepwells and ornate temples in a peaceful village that rewards visitors interested in Chalukyan stonework."),
  place("bidar-fort", "Bidar Fort", "Bidar", 17.9235, 77.5186, ["history", "hidden-gems"], true, 25, 2, months(10, 2), false, "Bidar Fort", "Massive gateways, Persian-influenced halls and long laterite ramparts make this northern Karnataka fort a rewarding history stop."),
  place("belur", "Chennakeshava Temple, Belur", "Hassan", 13.165, 75.8651, ["history", "temples"], false, 0, 1.5, months(10, 3), false, "Chennakeshava Temple, Belur", "A richly decorated Hoysala temple where each exterior band is packed with carved dancers, animals and scenes from mythology."),
  place("halebidu", "Hoysaleswara Temple, Halebidu", "Hassan", 13.2127, 75.993, ["history", "temples"], false, 0, 1.5, months(10, 3), false, "Hoysaleswara Temple", "Two dark-stone shrines are encircled by exceptionally detailed friezes, creating a close-up record of Hoysala craftsmanship."),
  place("shravanabelagola", "Shravanabelagola (Gommateshwara)", "Hassan", 12.8597, 76.4837, ["temples", "history"], false, 0, 2, months(10, 2), true, "Shravanabelagola", "A hilltop monolithic statue watches over a pilgrimage town, reached by a broad stairway and panoramic views of the surrounding countryside."),
  place("abbey-falls", "Abbey Falls", "Madikeri", 12.457, 75.7186, ["waterfalls", "nature"], false, 15, 1.5, months(6, 1), true, "Abbey Falls", "A short forest walk leads to a cascading Coorg waterfall framed by coffee and spice plantations."),
  place("rajas-seat", "Raja's Seat, Madikeri", "Madikeri", 12.4194, 75.738, ["nature"], false, 10, 1, months(10, 3), true, "Raja's Seat", "Watch the hills soften into evening mist from this small garden lookout above Madikeri."),
  place("dubare", "Dubare Elephant Camp", "Madikeri", 12.3881, 75.9347, ["wildlife", "adventure"], false, 80, 3, months(10, 3), true, "Dubare Elephant Camp", "The riverside reserve is a starting point for guided nature visits and views of the Kaveri forest corridor."),
  place("talakaveri", "Talakaveri & Bhagamandala", "Madikeri", 12.383, 75.495, ["temples", "nature"], false, 0, 2.5, months(6, 2), true, "Talakaveri", "Visit a sacred source of the Kaveri high in the Brahmagiri hills, then continue through the temple town at Bhagamandala."),
  place("jog-falls", "Jog Falls", "Shivamogga", 14.2294, 74.8127, ["waterfalls", "nature"], false, 20, 2.5, months(7, 12), true, "Jog Falls", "India's celebrated plunge waterfall drops into a forested gorge, with changing viewpoints and strong monsoon-season drama."),
  place("gokarna-om", "Om Beach, Gokarna", "Hubballi", 14.5204, 74.3169, ["beaches", "adventure"], false, 0, 3, months(11, 2), true, "Om Beach", "A curved Arabian Sea beach is backed by low hills and walking paths linking quieter coves."),
  place("mahabaleshwara", "Mahabaleshwara Temple, Gokarna", "Hubballi", 14.5479, 74.3188, ["temples"], false, 0, 1, months(10, 3), false, "Mahabaleshwar Temple, Gokarna", "A historic coastal shrine anchors Gokarna's old town, a short visit from the beach paths and bazaar streets."),
  place("murudeshwar", "Murudeshwar Temple & Beach", "Udupi", 14.0941, 74.4849, ["temples", "beaches"], false, 0, 2, months(10, 3), true, "Murudeshwar", "A towering Shiva statue and temple complex overlook the sea from a dramatic point on the Karnataka coast."),
  place("udupi-krishna", "Sri Krishna Temple & Udupi Cuisine", "Udupi", 13.3409, 74.7421, ["temples", "food"], false, 0, 2, months(10, 3), false, "Udupi Sri Krishna Matha", "Visit a centuries-old temple precinct, then try Udupi's crisp masala dosa and vegetarian cooking nearby."),
  place("st-marys", "St. Mary's Island & Malpe Beach", "Udupi", 13.3794, 74.6609, ["beaches", "nature"], false, 300, 3, months(11, 2), true, "St. Mary's Islands", "A boat ride from Malpe reaches an island of striking columnar basalt and open sea views; check boat operations before you go."),
  place("panambur", "Panambur Beach & Mangaluru Seafood Trail", "Mangaluru", 12.95, 74.8, ["beaches", "food"], false, 0, 2.5, months(11, 2), true, "Panambur Beach", "Pair a broad sunset beach with the city's coastal kitchens and a Mangalorean fish thali."),
  place("kudremukh", "Kudremukh Trek", "Chikkamagaluru", 13.1983, 75.249, ["adventure", "nature"], false, 250, 7, months(10, 2), true, "Kudremukh", "A demanding guided trail crosses shola forest and rolling grassland in the Western Ghats. Plan permits and a full trekking day ahead of time."),
  place("mullayanagiri", "Mullayanagiri Peak", "Chikkamagaluru", 13.3917, 75.7208, ["nature", "adventure"], false, 0, 2.5, months(10, 2), true, "Mullayanagiri", "Wind across Karnataka's highest peak and take in ridge-top views over coffee country on a clear day."),
  place("dandeli", "Dandeli Rafting & Wildlife", "Hubballi", 15.249, 74.617, ["adventure", "wildlife"], false, 900, 4, months(10, 5), true, "Dandeli", "The Kali River reserve is known for guided rafting, forest trails and birdlife; rafting depends on seasonal river conditions."),
  place("lalbagh", "Lalbagh Botanical Garden", "Bengaluru", 12.9507, 77.5848, ["nature"], false, 30, 2, months(1, 12), true, "Lalbagh Botanical Garden", "Wander a historic botanical garden of mature trees, glasshouse architecture and broad paths close to the city centre.", "Lalbagh"),
  place("cubbon-vidhana", "Cubbon Park & Vidhana Soudha", "Bengaluru", 12.9763, 77.5929, ["nature", "history"], false, 0, 1.5, months(1, 12), true, "Cubbon Park", "Mix leafy park paths with views of Vidhana Soudha, the city's monumental state legislature building.", "Cubbon Park"),
  place("bangalore-palace", "Bangalore Palace", "Bengaluru", 12.9988, 77.5921, ["history"], false, 270, 1.5, months(1, 12), false, "Bangalore Palace", "Tour a Tudor-inspired palace with carved interiors, royal memorabilia and gardens in central Bengaluru."),
  place("tipus-palace", "Tipu Sultan's Summer Palace", "Bengaluru", 12.9593, 77.5737, ["history", "hidden-gems"], true, 25, 1, months(1, 12), false, "Tipu Sultan's Summer Palace", "A compact teak-and-plaster palace preserves painted floral decoration and an intimate piece of Bengaluru's history.", "KR Market"),
  place("vv-puram-food", "VV Puram Food Street", "Bengaluru", 12.9486, 77.5736, ["food"], false, 0, 1.5, months(1, 12), false, "V. V. Puram", "Browse a lively evening street for local snacks, sweets and hot dosas; follow the crowd for a taste of Mysore pak.", "KR Market"),
  place("nandi-hills", "Nandi Hills Sunrise", "Bengaluru", 13.3702, 77.6835, ["nature", "history"], false, 20, 3, months(9, 2), true, "Nandi Hills", "Early light and open views reward a dawn trip to the hilltop fortifications north of the city."),
  place("savandurga", "Savandurga Monolith Trek", "Bengaluru", 12.921, 77.294, ["adventure", "nature"], false, 0, 4, months(10, 2), true, "Savandurga", "A guided climb over a broad granite monolith opens onto wide countryside views; start early and carry water."),
  place("bandipur", "Bandipur Safari", "Mysuru", 11.67, 76.63, ["wildlife", "nature"], false, 350, 3.5, months(10, 5), true, "Bandipur National Park", "A managed safari route through dry forest offers a chance to spot elephants, deer and other wildlife at a respectful distance."),
];

export const railPairs = new Set([
  "Bengaluru|Mysuru", "Bengaluru|Hosapete", "Bengaluru|Hubballi", "Bengaluru|Vijayapura",
  "Bengaluru|Mangaluru", "Hubballi|Hosapete", "Hubballi|Belagavi", "Mangaluru|Udupi",
  "Mysuru|Hassan", "Bengaluru|Hassan", "Bengaluru|Shivamogga",
]);
