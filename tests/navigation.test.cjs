/* Haelt fest, woraus die Schiene ihren aktiven Abschnitt ableitet.

   Der Beobachter markiert den obersten Abschnitt, der ein schmales Band
   am oberen Rand schneidet. Beginnt dieses Band ueber der Stelle, an der
   ein angesprungener Abschnitt landet, gewinnt der vorherige Abschnitt:
   zwischen zwei Abschnitten liegen 64 Pixel Abstand, und dessen untere
   Kante faellt dann genau ins Band. Angeklickt wurde "Richtwerte
   Satellit", markiert blieb "Anderes Geraet · Kabel".

   Wo ein Sprungziel landet, sagt scroll-padding-top im Stylesheet. Von
   dort muss das Band rechnen — sonst laufen die beiden Werte wieder
   auseinander, sobald einer von ihnen angefasst wird. Genau das
   sichert dieser Test. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const S = require(path.join(__dirname, 'seiten.cjs'));

const JS = S.lies('assets/handbuch.js');
const CSS = S.lies('assets/stil.css');

/* Der Block, der das Band festlegt */
const BAND = JS.slice(JS.indexOf('function ankerAbstand'), JS.indexOf('function observe'));

test('das Band rechnet von scroll-padding-top, nicht von der Leistenhöhe', () => {
  assert.ok(BAND.length > 0, 'bandMargin nicht gefunden');
  assert.ok(
    /scrollPaddingTop/.test(BAND),
    'das Band liest scroll-padding-top nicht — dann landet ein Sprungziel ' +
    'woanders, als das Band beginnt'
  );
  assert.ok(
    !/offsetHeight/.test(BAND),
    'das Band rechnet wieder mit einer gemessenen Höhe. Auf breiten ' +
    'Bildschirmen ist die Leiste unsichtbar und damit 0 hoch, ' +
    'scroll-padding-top aber nicht 0 — genau daraus entstand der Fehler'
  );
});

test('das Band beginnt unterhalb des Sprungziels', () => {
  const m = JS.match(/var ANKER_LUFT = (\d+);/);
  assert.ok(m, 'ANKER_LUFT nicht gefunden');
  const luft = Number(m[1]);
  assert.ok(
    luft > 0,
    'ohne Abstand fällt die Unterkante des vorherigen Abschnitts auf die ' +
    'Bandkante, und der vorherige Abschnitt gewinnt'
  );
  assert.ok(
    luft < 64,
    'der Abstand muss kleiner bleiben als die 64 Pixel zwischen zwei ' +
    'Abschnitten, sonst rutscht das Band in den nächsten hinein'
  );
});

test('scroll-padding-top ist gesetzt — sonst rechnet das Band mit null', () => {
  assert.ok(
    /scroll-padding-top:\s*var\(--ankerluft\)/.test(CSS),
    'scroll-padding-top fehlt oder hängt nicht mehr an --ankerluft'
  );
  assert.ok(
    /--ankerluft:\s*\d+px/.test(CSS),
    '--ankerluft ist nicht gesetzt'
  );
});

/* Seit 6.2 klebt nichts mehr am oberen Rand. */
test('am oberen Rand klebt nichts', () => {
  assert.ok(!/\.topbar/.test(CSS), 'es gibt wieder eine Kopfleiste im Stylesheet');
  for (const [datei, text] of S.ERZEUGT) {
    assert.ok(!text.includes('id="topbar"'), `${datei}: Kopfleiste im Markup`);
    assert.ok(!text.includes('memoJump'), `${datei}: der Knopf zur Notiz ist zurück`);
  }
});

/* Der Abstand zwischen zwei Abschnitten ist die Zahl, gegen die
   ANKER_LUFT anlaeuft. Aendert sie sich, ist der Kommentar oben falsch. */
test('zwischen zwei Abschnitten liegen weiterhin 64 Pixel', () => {
  assert.ok(
    /\.sec\{margin:0 0 64px;\}/.test(CSS),
    'der Abstand zwischen den Abschnitten ist nicht mehr 64 px — ' +
    'die Begründung in handbuch.js und in diesem Test nachziehen'
  );
});
