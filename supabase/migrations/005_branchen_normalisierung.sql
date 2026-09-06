-- Feste Branchen: "D2D Vertrieb", "Kapitalanlagevertrieb", "Telefonvertrieb"
-- Bestandsdaten auf die neuen Werte normalisieren.

-- Tippfehler-Variante vereinheitlichen
update candidates
  set branchenerfahrung = array_replace(branchenerfahrung, 'D2D- Vertrieb', 'D2D Vertrieb')
  where 'D2D- Vertrieb' = any(branchenerfahrung);

-- Kandidaten ohne gültige Branche → Standard "D2D Vertrieb" (Mehrheit der Bewerber)
update candidates
  set branchenerfahrung = array['D2D Vertrieb']
  where not (branchenerfahrung && array['D2D Vertrieb', 'Kapitalanlagevertrieb', 'Telefonvertrieb']);

-- Partner ohne gültiges Suchprofil → Standard "D2D Vertrieb"
update partners
  set gesuchte_profile = array['D2D Vertrieb']
  where not (gesuchte_profile && array['D2D Vertrieb', 'Kapitalanlagevertrieb', 'Telefonvertrieb']);

-- Radien auf 100 km deckeln
update candidates set umkreis_bereitschaft_km = 100 where umkreis_bereitschaft_km > 100;
update partners set suchradius_km = 100 where suchradius_km > 100;
