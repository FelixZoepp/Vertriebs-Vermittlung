/**
 * Static PLZ-to-coordinates lookup for German postal codes.
 * Maps 2-digit PLZ prefixes to approximate center coordinates.
 * This is a fallback — real coordinates come from exact PLZ entries.
 */

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Map of 2-digit PLZ prefixes to representative center coordinates.
 * Covers all major German metropolitan areas and regions.
 */
const PLZ_PREFIX_MAP: Record<string, Coordinates> = {
  // Dresden, Chemnitz, Ostsachsen
  "01": { lat: 51.0504, lng: 13.7373 }, // Dresden
  "02": { lat: 51.1508, lng: 14.9708 }, // Goerlitz/Bautzen
  "03": { lat: 51.7563, lng: 14.3322 }, // Cottbus
  "04": { lat: 51.3397, lng: 12.3731 }, // Leipzig
  "06": { lat: 51.4828, lng: 11.97 },   // Halle (Saale)
  "07": { lat: 50.9271, lng: 11.5892 }, // Jena/Gera
  "08": { lat: 50.7271, lng: 12.4793 }, // Zwickau
  "09": { lat: 50.8278, lng: 12.9214 }, // Chemnitz

  // Berlin, Brandenburg
  "10": { lat: 52.5200, lng: 13.4050 }, // Berlin Mitte
  "11": { lat: 52.5200, lng: 13.4050 }, // Berlin (Regierungsviertel)
  "12": { lat: 52.4750, lng: 13.4400 }, // Berlin Sued
  "13": { lat: 52.5700, lng: 13.3900 }, // Berlin Nord
  "14": { lat: 52.3906, lng: 13.0645 }, // Potsdam / Berlin SW
  "15": { lat: 52.3400, lng: 14.0500 }, // Frankfurt (Oder)
  "16": { lat: 52.7500, lng: 13.5000 }, // Oranienburg/Eberswalde
  "17": { lat: 53.6300, lng: 13.0600 }, // Neubrandenburg/Greifswald

  // Rostock, Mecklenburg-Vorpommern
  "18": { lat: 54.0924, lng: 12.0991 }, // Rostock
  "19": { lat: 53.6355, lng: 11.4015 }, // Schwerin

  // Hamburg
  "20": { lat: 53.5511, lng: 9.9937 },  // Hamburg Mitte
  "21": { lat: 53.4700, lng: 9.9900 },  // Hamburg Sued/Harburg
  "22": { lat: 53.6000, lng: 10.0500 }, // Hamburg Nord/Wandsbek
  "23": { lat: 53.8655, lng: 10.6866 }, // Luebeck
  "24": { lat: 54.3233, lng: 10.1228 }, // Kiel
  "25": { lat: 53.8700, lng: 9.0000 },  // Schleswig-Holstein West
  "26": { lat: 53.1435, lng: 8.2146 },  // Oldenburg
  "27": { lat: 53.0750, lng: 8.8000 },  // Bremen Nord/Bremerhaven
  "28": { lat: 53.0793, lng: 8.8017 },  // Bremen
  "29": { lat: 52.8306, lng: 10.2400 }, // Celle/Uelzen

  // Hannover, Niedersachsen
  "30": { lat: 52.3759, lng: 9.7320 },  // Hannover
  "31": { lat: 52.1500, lng: 9.9500 },  // Hildesheim
  "32": { lat: 52.0190, lng: 8.5300 },  // Bad Oeynhausen/Herford
  "33": { lat: 52.0302, lng: 8.5325 },  // Bielefeld
  "34": { lat: 51.3127, lng: 9.4797 },  // Kassel
  "35": { lat: 50.5900, lng: 8.6700 },  // Giessen/Marburg
  "36": { lat: 50.5500, lng: 9.6800 },  // Fulda
  "37": { lat: 51.5328, lng: 9.9355 },  // Goettingen
  "38": { lat: 52.2689, lng: 10.5268 }, // Braunschweig
  "39": { lat: 52.1205, lng: 11.6276 }, // Magdeburg

  // Duesseldorf, Niederrhein
  "40": { lat: 51.2277, lng: 6.7735 },  // Duesseldorf
  "41": { lat: 51.1900, lng: 6.4400 },  // Moenchengladbach
  "42": { lat: 51.2562, lng: 7.1508 },  // Wuppertal
  "43": { lat: 51.3600, lng: 7.0800 },  // Velbert/Heiligenhaus
  "44": { lat: 51.5136, lng: 7.4653 },  // Dortmund/Bochum
  "45": { lat: 51.4556, lng: 7.0116 },  // Essen
  "46": { lat: 51.6500, lng: 6.7600 },  // Oberhausen/Wesel
  "47": { lat: 51.4344, lng: 6.7623 },  // Duisburg
  "48": { lat: 51.9607, lng: 7.6261 },  // Muenster
  "49": { lat: 52.2799, lng: 8.0472 },  // Osnabrueck

  // Koeln, Bonn
  "50": { lat: 50.9375, lng: 6.9603 },  // Koeln
  "51": { lat: 50.9700, lng: 7.0500 },  // Koeln Ost/Leverkusen
  "52": { lat: 50.7753, lng: 6.0839 },  // Aachen
  "53": { lat: 50.7339, lng: 7.0997 },  // Bonn
  "54": { lat: 49.7497, lng: 6.6372 },  // Trier
  "55": { lat: 49.9929, lng: 8.2473 },  // Mainz
  "56": { lat: 50.3600, lng: 7.5900 },  // Koblenz
  "57": { lat: 50.8700, lng: 7.9800 },  // Siegen
  "58": { lat: 51.3700, lng: 7.4600 },  // Hagen
  "59": { lat: 51.6600, lng: 7.8200 },  // Hamm/Unna

  // Frankfurt, Hessen
  "60": { lat: 50.1109, lng: 8.6821 },  // Frankfurt
  "61": { lat: 50.2200, lng: 8.6200 },  // Bad Homburg/Friedberg
  "63": { lat: 50.0000, lng: 8.9700 },  // Offenbach/Hanau
  "64": { lat: 49.8728, lng: 8.6512 },  // Darmstadt
  "65": { lat: 50.0782, lng: 8.2398 },  // Wiesbaden
  "66": { lat: 49.2354, lng: 6.9960 },  // Saarbruecken
  "67": { lat: 49.4400, lng: 8.4300 },  // Ludwigshafen/Frankenthal
  "68": { lat: 49.4875, lng: 8.4660 },  // Mannheim
  "69": { lat: 49.3988, lng: 8.6724 },  // Heidelberg

  // Stuttgart, Baden-Wuerttemberg
  "70": { lat: 48.7758, lng: 9.1829 },  // Stuttgart
  "71": { lat: 48.7000, lng: 9.1300 },  // Boeblingen/Sindelfingen
  "72": { lat: 48.5216, lng: 9.0576 },  // Tuebingen/Reutlingen
  "73": { lat: 48.7000, lng: 9.6500 },  // Goeppingen/Esslingen
  "74": { lat: 49.1427, lng: 9.2109 },  // Heilbronn
  "75": { lat: 48.8900, lng: 8.7000 },  // Pforzheim
  "76": { lat: 49.0069, lng: 8.4037 },  // Karlsruhe
  "77": { lat: 48.4700, lng: 7.9400 },  // Offenburg
  "78": { lat: 47.6600, lng: 8.8500 },  // Konstanz/Villingen-Schwenningen
  "79": { lat: 47.9990, lng: 7.8421 },  // Freiburg

  // Muenchen, Bayern
  "80": { lat: 48.1351, lng: 11.5820 }, // Muenchen
  "81": { lat: 48.1200, lng: 11.6100 }, // Muenchen Ost
  "82": { lat: 48.0500, lng: 11.4600 }, // Muenchen Sued/Starnberg
  "83": { lat: 47.8600, lng: 12.1300 }, // Rosenheim
  "84": { lat: 48.4400, lng: 12.1800 }, // Landshut
  "85": { lat: 48.3500, lng: 11.7800 }, // Freising/Dachau
  "86": { lat: 48.3706, lng: 10.8978 }, // Augsburg
  "87": { lat: 47.7300, lng: 10.3100 }, // Kempten
  "88": { lat: 47.7200, lng: 9.6100 },  // Ravensburg/Friedrichshafen
  "89": { lat: 48.4011, lng: 9.9876 },  // Ulm

  // Nuernberg, Franken
  "90": { lat: 49.4521, lng: 11.0767 }, // Nuernberg
  "91": { lat: 49.5900, lng: 11.0100 }, // Erlangen/Fuerth
  "92": { lat: 49.4200, lng: 11.8600 }, // Amberg
  "93": { lat: 49.0134, lng: 12.1016 }, // Regensburg
  "94": { lat: 48.5700, lng: 13.4600 }, // Passau
  "95": { lat: 50.0000, lng: 11.5800 }, // Bayreuth/Hof
  "96": { lat: 50.2600, lng: 10.9600 }, // Bamberg/Coburg
  "97": { lat: 49.7913, lng: 9.9534 },  // Wuerzburg
  "98": { lat: 50.6800, lng: 10.9200 }, // Suhl/Ilmenau
  "99": { lat: 50.9787, lng: 11.0328 }, // Erfurt
};

/**
 * Look up approximate coordinates for a German PLZ.
 * Uses the first 2 digits to find the region center.
 */
export function getCoordinatesForPLZ(plz: string): Coordinates | null {
  if (!plz || plz.length < 2) return null;

  const prefix = plz.slice(0, 2);
  return PLZ_PREFIX_MAP[prefix] ?? null;
}
