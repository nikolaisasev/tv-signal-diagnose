# TV — Diagnose-Handbuch

Selbstdiagnose für den eigenen Fernseher. Zwei Fälle: Das Gerät schaltet sich
unaufgefordert ein, oder der Empfang ist gestört.

Das Handbuch beantwortet zuerst die Frage **gibt es überhaupt ein Problem?** —
und wenn ja, welches. Es zählt dafür nicht nur Handgriffe auf, sondern erklärt,
was die Messwerte bedeuten und warum eine Maßnahme wirkt oder eben nicht. Wer es
einmal durchgeht, kann den Fall danach nicht nur beheben, sondern versteht die
Technik dahinter.

Eine mehrseitige HTML-Anwendung: kein Server, kein Build-Schritt, keine
Netzverbindung. Per Doppelklick zu öffnen und als Ordner weiterzugeben.

## Aufbau der Dateien

```
index.html            der Rechner, die gesamte Anwendung
assets/grenzwerte.js  Schwellen, Klassifizierung, Diagnosen
assets/handbuch.js    Bedienung der Seite
assets/stil.css       Gestaltung
dokumentation/        Diagnosematrix als Seite
tests/                node --test, ohne Pakete
```

Alle Verweise sind relativ. Der Ordner läuft per Doppelklick auf
`index.html` über `file://`, ohne Server und ohne Netz — geprüft mit
Chrome headless gegen `file://`. Kein `fetch`, kein `XMLHttpRequest`,
keine ES-Module; nur `<link>` und `<script src>`, die unter `file://`
nicht blockiert werden.

**Der Ordner muss zusammenbleiben.** Einzeln weitergegeben fehlen der
Seite Gestaltung und Funktionen.

Die Navigation entsteht aus den `<section class="sec" data-nav="…">` der
Seite — ein neuer Abschnitt erscheint von selbst in Schiene und
Sprungleiste.

### Dokumentation

`dokumentation/diagnosematrix.html` zeigt beide Diagnosematrizen mit den
Messbereichen je Klasse.

Die Seite wird **aus `assets/grenzwerte.js` erzeugt**, nicht von Hand
gepflegt:

```
npm run doku
```

`tests/dokumentation.test.cjs` prüft, dass die abgelegte Fassung dem
Generator entspricht und dass jede Zelle dieselbe Zustandsfarbe trägt
wie die zugehörige Diagnose im Code. Wer eine Schwelle ändert und die
Seite nicht neu erzeugt, bekommt einen roten Test statt einer
Dokumentation, die etwas anderes behauptet als der Rechner.

## Inhalt der Fälle

**Empfang gestört / Überpegel** — Überpegel-Rechner · Wo gemessen wird ·
Erstfragen · Anderes Gerät läuft problemlos · Was gemessen wird ·
Richtwerte Satellit · Richtwerte Kabel

## Die Technik verstehen

Abschnitt 2 der Empfangsseite erklärt das Grundverhältnis, an dem sich die
meisten Fehldiagnosen entscheiden:

- **Pegel ist die Lautstärke, MER die Deutlichkeit.** Ein hoher Pegel allein
  beweist nichts.
- **Verstärker und Dämpfungsglied ändern das Verhältnis nicht.** Beide heben
  oder senken Nutzsignal und Rauschen gleichermaßen — der MER bleibt, wie er war.
- **Warum Kabel und Satellit verschiedene Grenzwerte haben:** nicht der
  Übertragungsweg entscheidet, sondern die Modulation. 14 dB sind bei Satellit
  ein guter Wert und bei Kabel unbrauchbar.

## Navigation

Ab 861 px Breite eine vertikale Fortschrittsschiene links: Grundlinie plus
gefüllte Linie, deren Höhe dem Lesefortschritt entspricht. Der aktive
Abschnitt wird über `IntersectionObserver` bestimmt — aktiv ist der oberste
Abschnitt, der den oberen Bildschirmdrittelbereich schneidet, gemessen
unterhalb der klebenden Kopfleiste.

Bis 860 px entfällt die Schiene. Ersatz ist eine oben klebende Leiste mit einem
nativen `select` für den Abschnittssprung.

Die Schiene ist das einzige animierte Element. Bei `prefers-reduced-motion`
bleiben die Zustände, die Übergänge entfallen.

## Erfassung und Notiz

Die Fragen in Abschnitt 1 sind anklickbar. Sie öffnen Auswahlflächen und, wo
nötig, ein Freitextfeld. Aus den Antworten entsteht am Ende des Abschnitts eine
kompakte Notiz zum Kopieren — mit Kopieren-Knopf und einem markierbaren Feld
als Rückfallebene, falls der Browser die Zwischenablage unter `file://` sperrt.

Antworten, deren Bedeutung im Handbuch festgelegt ist, blenden den passenden
Hinweis samt Sprung zum Abschnitt ein — etwa „springt auf HDMI 2" → „CEC —
direkt zum Quellgerät an diesem Eingang".

Das Ergebnis des Überpegel-Rechners wandert automatisch in die Notiz und wird
bei jeder neuen Auswertung ersetzt. „Werte fehlen" ist kein Ergebnis und wird
nicht übernommen. Die Antwort auf die Empfangsart stellt den Rechner passend
ein: Satellit oder Kabel wird direkt übernommen; Antenne/DVB-T2 kennt der
Rechner nicht, dort bleibt die Einstellung unverändert.

**Reset** in der Kopfleiste setzt alles auf einmal zurück — Antworten, Notiz,
aufgeklappte Fragen und die Rechnerfelder.

**Bewusst ohne Speicherung.** Die Antworten leben nur in der laufenden Sitzung.
Würden sie einen Neuladen überstehen, startete der nächste Durchgang mit den
Angaben des vorherigen.

**Zu prüfen:** Die Antwortoptionen sind der einzige Teil, der nicht aus dem
Handbuch stammt. Sie stehen gesammelt im Block `QUESTIONS` in
`assets/handbuch.js` und sind dort als prüfbedürftig markiert.

## Rechner

Die Auswertungslogik ist unverändert aus Version 1 übernommen. Kein
Schwellenwert wurde verändert. Geprüft gegen die acht vorgegebenen Testfälle:

| Eingabe | Ergebnis |
|---|---|
| Satellit · Prozent · Stärke 96 · Qualität 0 · konstant 0 | Konfigurationsfehler — kein Überpegel |
| Satellit · Prozent · Stärke 98 · Qualität 20 · schwankt | Überpegel wahrscheinlich |
| Satellit · Prozent · Stärke 96 · Qualität 10 · weiß ich nicht | Überpegel oder Konfiguration — noch nicht entschieden |
| Satellit · dB · Pegel −22 · SNR 5.5 | Überpegel bestätigt |
| Satellit · dB · Pegel −22 · SNR 13 | Hoher Pegel, aber Signal gut |
| Kabel · 256QAM · Pegel 82 · MER 27 | Überpegel bestätigt |
| Kabel · 256QAM · Pegel 60 · MER 35 | Signal in Ordnung |
| Kabel · 256QAM · Pegel 40 · MER 26 | Zu schwaches Signal |

## Menüwege

Die Wege stammen aus der offiziellen Online-Bedienungsanleitung (webOS 25)
beziehungsweise aus der Praxis am Gerät:

```
Alle Einstellungen → Support → Schnellhilfe → Selbstdiagnose und Pflege → RF/HDMI
Alle Einstellungen → Allgemein → Sender → Sendereinstellung →
    Programmsuche und -einstellungen → Signaltest
Alle Einstellungen → Allgemein → Externe Geräte → HDMI-Einstellungen
Alle Einstellungen → Allgemein → Externe Geräte → TV Ein mit Mobilgerät
Alle Einstellungen → Allgemein → System → Zeit & Timer
```

`RF/HDMI` erscheint nur, wenn Live-TV läuft — auch dann, wenn kein Signal
ankommt.

## Drucken

Die Druckausgabe gibt die geöffnete Fallseite ohne Bedienelemente aus.

## Fachinhalte

Sämtliche Tabellen, Grenzwerte und Menüwege sind inhaltlich unverändert.
