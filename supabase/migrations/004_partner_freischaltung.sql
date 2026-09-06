-- Freischaltungsgebühr: Partner zahlen einmalig 999€ netto für Plattform-Zugang
alter table partners
  add column if not exists freischaltung_status text not null default 'offen'
    check (freischaltung_status in ('offen', 'bezahlt', 'befreit')),
  add column if not exists freischaltung_bezahlt_am timestamptz;

-- Bestehende aktive Partner (Legacy-Abo) gelten als freigeschaltet
update partners
  set freischaltung_status = 'befreit'
  where abo_status = 'aktiv' and freischaltung_status = 'offen';
