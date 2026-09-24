# TV — Diagnose-Handbuch

Selbstdiagnose für den eigenen Fernseher. Zwei Fälle: Das Gerät schaltet sich
unaufgefordert ein, oder der Empfang ist gestört.

Das Handbuch beantwortet zuerst die Frage **gibt es überhaupt ein Problem?** —
und wenn ja, welches. Es zählt dafür nicht nur Handgriffe auf, sondern erklärt,
was die Messwerte bedeuten und warum eine Maßnahme wirkt oder eben nicht. Wer es
einmal durchgeht, kann den Fall danach nicht nur beheben, sondern versteht die
Technik dahinter.

Eine mehrseitige HTML-Anwendung: kein Server, keine Netzverbindung, kein
Build-Schritt zum Benutzen. Per Doppelklick zu öffnen und als Ordner
weiterzugeben. Es gibt das Handbuch in vier Fassungen — drei
deutschsprachige Märkte und eine englische Fassung für Deutschland.

## Aufbau der Dateien

```
index.html              Auswahlseite, von Hand gepflegt
de-DE/  de-AT/  de-CH/  erzeugte deutsche Fassungen
en-DE/                  erzeugte englische Fassung
quelle/de.html          Prosa deutsch, mit Auszeichnungen
quelle/en.html          Prosa englisch
assets/grenzwerte.js    Schwellen, Klassifizierung, Matrix
assets/handbuch.js      Bedienung der Seite
assets/stil.css         Gestaltung
assets/texte/*.js       jeder sichtbare Text, je Sprache
assets/markt/*.js       Angaben, die vom Land abhängen
assets/menue/*.js       Menüwege je Menüsprache
bauen/erzeuge.cjs       baut die vier Fassungen
bauen/erzeuge-matrix.cjs  baut die Diagnosematrix
formeln.html            Formeln und Umrechnung, eigene Seite ohne Verweis
dokumentation/          Diagnosematrix als Seite
tests/                  node --test, ohne Pakete
```

### Fünf Schichten, die sich nicht vermischen

| Schicht | Ort | Ändert sich mit |
|---|---|---|
| Physik | `assets/grenzwerte.js` | nichts — Schwellen, Klassen, Matrix, Zustände |
| Texte | `assets/texte/<sprache>.js` | der Sprache — jeder Satz, jede Beschriftung |
| Markt | `assets/markt/<markt>.js` | dem Land — Transponder, Anbieter, Zuständigkeiten |
| Menüwege | `assets/menue/<sprache>.js` | der Menüsprache des Geräts |
| Prosa | `quelle/<sprache>.html` | der Sprache der Seite |

Eine Tatsache steht damit an genau einer Stelle. Sonst bedeutete jede
Änderung vier Bearbeitungen, von denen eine vergessen wird.

**Kein sichtbarer Text in gemeinsam genutzten Dateien.** `grenzwerte.js`,
`handbuch.js` und `bauen/erzeuge-matrix.cjs` führen nur noch Zahlen,
Kennungen und Logik; jeder Satz kommt über seine Kennung aus
`assets/texte/`. `tests/texte.test.cjs` sucht dort nach deutschen
Leitwörtern und wird rot, sobald wieder Wortlaut hineingerät.

In der Matrix steht die Anzeigebezeichnung der jeweiligen Sprache, die
Kennung daneben als `data-kennung` — so prüfen die Tests weiter über
die Kennung, und der Leser sieht seine Sprache.

**Eigenname oder Begriff.** Jeder Marktschlüssel trägt seine Art:
`name` für Vodafone, HD+ oder Astra 19,2° Ost — ein Wert in allen
Sprachen; `begriff` für Rollen wie `zustaendigSat` — ein Wert je
Sprache. Ohne diese Unterscheidung stünde in der englischen Fassung
„allocated by the Antennenbauer".

### Bauen

```
npm run bauen
```

schreibt `de-DE/`, `de-AT/`, `de-CH/` und `en-DE/`, jeweils
`index.html`. **Die erzeugten Dateien werden nicht von Hand bearbeitet** —
wer Text ändern will, ändert `quelle/de.html` oder `quelle/en.html`
und lässt den Generator laufen. Ein Hinweis darauf steht am Kopf jeder
erzeugten Datei.

Eingesetzt wird auf zwei Wegen:

```html
<!-- markt:transponder:anfang --> … <!-- markt:transponder:ende -->
<span data-markt="satellit">Astra 19,2° Ost</span>
<span data-menue="signalwerte">Alle Einstellungen → …</span>
```

Beim Wertverfahren bleibt der sichtbare Text in der Quelle stehen. Die
Quelldatei ist dadurch auch ohne Generator lesbar und im Browser
benutzbar; der Test meldet jede Abweichung zwischen Quelle und
Datenquelle.

**Gebaut wird nur zum Erzeugen, nie zum Benutzen.** Die ausgelieferten
Ordner sind fertige HTML-Dateien.

### Seitensprache und Menüsprache

Zwei verschiedene Dinge. Wer die englische Fassung liest, betreut häufig
einen Kunden mit deutschem Gerätemenü — ein übersetzter Menüweg wäre
dort unbrauchbar, weil der Kunde ihn auf seinem Bildschirm nicht findet.

**Die Menüsprache folgt der Sprache der Fassung.** Die deutschen
Fassungen zeigen den deutschen Menüweg, die englische den englischen.
Einen Schalter dafür gibt es nicht: wer die englische Fassung wählt,
wählt damit auch das englische Gerätemenü.

**Ein Menüweg ist mit einem Blick ganz zu erfassen.** Der Generator
zerlegt ihn an den Pfeilen; jedes Glied ist ein eigenes Element und
rutscht als Ganzes in die nächste Zeile. Umbrochen wird also hinter
einem Pfeil, nie mitten in einem Menüpunkt. Nichts wird abgeschnitten,
nichts muss seitlich geschoben werden.

**Zur Zeilenzahl, gemessen statt behauptet.** Der längste Weg ist der
Unicable-Pfad mit rund 170 Zeichen. Die Textspalte ist bei 861 px
Fensterbreite rund 500 px breit, bei 1200 px rund 820 px — daher, bei
13 px Schrift:

| Fensterbreite | Zeilen für den Unicable-Pfad |
|---|---|
| 375 px | 7, vollständig sichtbar |
| 880 px | 4 |
| 1060 px | 3 |
| 1180 px | 3 |
| ab etwa 1190 px | 2 |

Zwei Zeilen ab 861 px sind mit lesbarer Schrift nicht erreichbar; die
Spalte gibt es nicht her. Was auf **jeder** Breite gilt: nichts wird
abgeschnitten, und umbrochen wird nur hinter einem Pfeil.

### Fassungswähler

Ein Element im Seitenkopf, rechts neben der Überschrift. Geschlossen
nennt es die Kennung der offenen Fassung, geöffnet listet es alle vier
mit Sprache und Markt. Gebaut aus `details` und `summary`, ohne
Skript, mit der Tastatur bedienbar.

**Am oberen Rand klebt nichts.** Die Kopfleiste ist weg, der Knopf zur
Notiz ebenfalls — die Notiz steht am Ende der Erstfragen und ist über
Schiene und Sprungauswahl erreichbar. Die Sprungauswahl für schmale
Bildschirme steht im Seitenkopf neben dem Fassungswähler und wandert
beim Scrollen mit dem Text nach oben aus dem Bild.

**Die geöffnete Auswahl legt sich über den Inhalt.** Die Ordnung der
Seite bleibt dieselbe, ob der Wähler offen steht oder nicht. Beim
Drucken entfällt er ganz.

Die Auswahl listet **alle** Fassungen, nicht nur die des eigenen
Marktes: von de-CH käme man sonst gar nicht nach en-DE.

Menüwege werden **nicht frei übersetzt**, aber sie erscheinen immer in
der Sprache der Fassung. Ist eine englische Bezeichnung nicht in der
Anleitung belegt, trägt der Eintrag `geprueft: false` und wird als
offene Stelle gezählt — der Leser sieht sie trotzdem auf Englisch. Eine
englische Seite mit deutschen Pfaden wäre für ihn unbrauchbar; die
Markierung sorgt dafür, dass die Prüfung am Gerät nachgeholt wird.

Auch **einzelne Menüpunkte im Fließtext** kommen aus `assets/menue/`,
ausgezeichnet mit `data-menuepunkt`. Sonst stünde „Benutzer" im Satz,
während der Pfad daneben „User" sagt.

**Jeder Menüweg hat einen Kopierknopf** — rechts im Kasten, unter 600 px
in einer eigenen Zeile darunter. Er trägt dasselbe Zeichen wie der
Knopf am Messwert des Rechners, kein Wort; was er tut, sagt sein
`aria-label`. Das Zeichen steht einmal im Code und wird von beiden
Knöpfen geholt. Nach dem Kopieren zeigt er zwei Sekunden lang ein
Häkchen. Kopiert wird der sichtbare Pfad,
zusammengesetzt aus seinen Gliedern: ohne Sternchen, ohne geschütztes
Leerzeichen, ohne Knopftext. Ist die Zwischenablage gesperrt — unter
`file://` kommt das vor —, greift dieselbe Kette wie bei der Notiz:
`navigator.clipboard`, dann `execCommand`, zuletzt den Pfad markieren
und sagen, dass Strg+C genügt. Stillschweigend nichts tun ist keine der
drei Stufen.

Eine **ungeprüfte Bezeichnung** trägt seit 6.4 kein Balken mehr am
linken Rand — der saß unmittelbar vor dem ersten Wort — sondern ein
hochgestelltes Sternchen hinter dem letzten Glied, mit Erklärung im
`title`. Es steht außerhalb der Glieder und wandert deshalb nicht mit
in die Zwischenablage. Im Ausdruck bleibt es stehen: ein gedruckter Pfad
soll Unbelegtes nicht als gesichert ausgeben.

### Offene Übersetzungen

Zwei Kennzeichen, beide zählend, keines rot machend:

- `data-todo` am umschließenden Element im HTML — ein schmaler Streifen
  am linken Rand, im Druck unsichtbar.
- `entwuerfe` in `assets/texte/<sprache>.js` — die Liste der Bereiche,
  die übersetzt, aber noch nicht geprüft sind. Wer einen durchgesehen
  hat, streicht seine Zeile.

`npm test` gibt die Summe aus. Eine unfertige Übersetzung bleibt
benutzbar und ist trotzdem beim Lesen erkennbar.

`formeln.html` trägt den Herleitungsteil, der zuvor in den Grundlagen
stand: dB als Verhältnis, dBµV ↔ dBm und die 108,75, die 75 Ohm,
Kabeldämpfung samt Dämpfungsrechner, Summenpegel bei Kabel und bei
Satellit. Die Seite ist **absichtlich nicht verlinkt** — sie wird
direkt geöffnet, wenn jemand die Herleitung sehen will, und hält die
Anwendung selbst kurz. `tests/formeln.test.cjs` hält beides fest: dass
der Block in keine Fassung zurückwandert und dass keine davon einen
Verweis darauf bekommt.

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

Die Diagnosematrix steht auf der Dokumentationsseite und in jeder der
vier Fassungen. Sie wird **aus `assets/grenzwerte.js` erzeugt**, nie von
Hand gepflegt:

```
npm run doku
```

schreibt `dokumentation/diagnosematrix.html` als ganze Seite. Dasselbe
Fragment setzt `npm run bauen` in jede Fassung zwischen die
Markierungen:

```html
<!-- matrix:sat:anfang -->   …   <!-- matrix:sat:ende -->
<!-- matrix:kabel:anfang --> …   <!-- matrix:kabel:ende -->
```

Fehlt eine Markierung oder steht ein Paar verkehrt herum, bricht der
Generator ab und schreibt **keine** Datei. Stilles Überspringen wäre
gefährlicher: die Seite zeigte dann unbemerkt veraltete Zahlen.

Unter jeder Matrix steht eine Befundlegende, die jede Kennung mit dem
Satz aus `grenzwerte.js` auflöst — gleiche Quelle wie die Matrix selbst.

`tests/dokumentation.test.cjs` prüft für **jede** dieser Dateien, dass
sie dem Generator entspricht, dass jede Zelle dieselbe Zustandsfarbe
trägt wie die Diagnose im Code und dass die Legende vollständig ist. Wer
eine Schwelle ändert und nicht neu baut, bekommt einen roten Test statt
einer Anzeige, die etwas anderes behauptet als der Rechner.

## Inhalt der Fälle

**Empfang gestört / Überpegel** — Überpegel-Rechner · Erstfragen ·
Anderes Gerät läuft · Satellit · Anderes Gerät läuft · Kabel ·
Richtwerte Satellit · Transponder-Referenz · Richtwerte Kabel ·
Grundlagen

Die Folge bildet den Ablauf ab: erst messen, dann die Angaben sammeln,
dann nachschlagen. Acht Abschnitte; `tests/sprachen.test.cjs` hält die
Reihenfolge fest.

„Anderes Gerät läuft" ist nach Empfangsart geteilt: wer Kabel hat,
scrollt nicht durch den Unicable-Teil. Jeder der beiden Abschnitte
beginnt mit einem Satz, der ihn für sich verständlich macht.

## Die Technik verstehen

Abschnitt 8 — Grundlagen — erklärt das Grundverhältnis, an dem sich die
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
Abschnitt, der den oberen Bildschirmdrittelbereich schneidet.

Das Band beginnt dort, wo ein angesprungener Abschnitt landet, und noch
zwölf Pixel darunter. Der Wert kommt aus `scroll-padding-top` im
Stylesheet — seit dem Wegfall der Kopfleiste ist das `--ankerluft`,
gemessen ab dem oberen Bildrand. Beide hängen am selben Token und
können nicht auseinanderlaufen. `tests/navigation.test.cjs` hält die
Herleitung fest.

Bis 860 px entfällt die Schiene. Ersatz ist ein nativer `select` für den
Abschnittssprung im Seitenkopf. Er klebt nicht.

Die Schiene ist das einzige animierte Element. Bei `prefers-reduced-motion`
bleiben die Zustände, die Übergänge entfallen.

## Erfassung und Notiz

Die Fragen in Abschnitt 2 — Erstfragen — sind anklickbar. Sie öffnen Auswahlflächen und, wo
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

**Zurücksetzen** unter dem Rechner leert dessen Felder und das Ergebnis.
Einen seitenweiten Reset gibt es nicht mehr; jede Auswahl wird dort
zurückgenommen, wo sie getroffen wurde.

**Bewusst ohne Speicherung.** Die Antworten leben nur in der laufenden Sitzung.
Würden sie einen Neuladen überstehen, startete der nächste Durchgang mit den
Angaben des vorherigen.

**Zu prüfen:** Die Antwortoptionen sind der einzige Teil, der nicht aus dem
Handbuch stammt. Sie stehen gesammelt im Block `QUESTIONS` in
`assets/handbuch.js` und sind dort als prüfbedürftig markiert.

## Rechner

Pegel und Rauschabstand werden getrennt klassifiziert (P1–P5 · Q0–Q4);
erst die Kombination beider Klassen ergibt genau eine Diagnose. Die
Schwellen und die Matrix stehen in `assets/grenzwerte.js`, die
maßgebliche Fallsammlung in `tests/faelle.json` — dort steht je Zelle
und je Schwelle mindestens ein Fall mit erwarteter Diagnose.

## Menüwege

Die Wege stammen aus der offiziellen Online-Bedienungsanleitung (webOS 25)
beziehungsweise aus der Praxis am Gerät:

```
Alle Einstellungen → Support → Schnellhilfe → Selbstdiagnose und Pflege → RF/HDMI
Alle Einstellungen → Allgemein → Sender → Sendereinstellung (Programmsuche und -einstellungen) → Manuelle Einstellung
Alle Einstellungen → Allgemein → Externe Geräte → HDMI-Einstellungen
Alle Einstellungen → Allgemein → Externe Geräte → TV Ein mit Mobilgerät
Alle Einstellungen → Allgemein → System → Zeit & Timer
```

Der Punkt heißt **Manuelle Einstellung**, englisch *Manual Tuning*.
DiSEqC bezeichnet die Anschlüsse mit Buchstaben: **A~D / ToneA~B**, in
allen Sprachfassungen gleich.

`RF/HDMI` erscheint nur, wenn Live-TV läuft — auch dann, wenn kein Signal
ankommt.

## Drucken

Die Druckausgabe gibt die geöffnete Fallseite ohne Bedienelemente aus.

## Fachinhalte

Sämtliche Tabellen, Grenzwerte und Menüwege sind inhaltlich unverändert.
