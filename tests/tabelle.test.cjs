/* Vergleicht die angezeigten Zahlen mit denen im Rechner.

   Genau diese Lücke war der Anlass des Umbaus: die Tabelle wies über
   −25 dBm Übersteuerung aus, der Rechner meldete Grenzbereich. Wer eine
   Zahl nur an einem der beiden Orte ändert, soll das hier merken. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const D = require(path.join(__dirname, '..', 'assets', 'grenzwerte.js'));
const SEITE = fs.readFileSync(
  path.join(__dirname, '..', 'index.html'), 'utf8');

/* Die Seite schreibt Minus als −, JavaScript als -. */
function zahlen(text) {
  return (text.replace(/−/g, '-').match(/-?\d+(?:[.,]\d+)?/g) || [])
    .map((x) => parseFloat(x.replace(',', '.')));
}

/* Eine Zeile der Tabelle "Alle Grenzwerte im Überblick" holen und die
   Zahlen je Spalte zurückgeben: {sat: [...], kabel: [...]} */
function zeile(beschriftung) {
  const tabelle = SEITE.slice(SEITE.indexOf('Alle Grenzwerte im Überblick'));
  const muster = new RegExp(
    '<tr[^>]*>\\s*<td[^>]*>(?:<strong>)?' + beschriftung +
    '(?:</strong>)?</td>\\s*<td[^>]*>(.*?)</td>\\s*<td[^>]*>(.*?)</td>', 's');
  const t = tabelle.match(muster);
  assert.ok(t, `Zeile "${beschriftung}" nicht in der Tabelle gefunden`);
  return { sat: zahlen(t[1]), kabel: zahlen(t[2]) };
}

function gleich(beschriftung, spalte, erwartet, woher) {
  const gefunden = zeile(beschriftung)[spalte];
  assert.deepStrictEqual(
    gefunden, erwartet,
    `Zeile "${beschriftung}", Spalte ${spalte}: ` +
    `HTML nennt ${JSON.stringify(gefunden)}, ` +
    `grenzwerte.js nennt ${JSON.stringify(erwartet)} (${woher})`
  );
}

test('Pegelzeilen der Tabelle stimmen mit GRENZWERTE überein', () => {
  const s = D.GRENZWERTE.sat.pegel;
  const k = D.GRENZWERTE.kabel.pegel;

  gleich('Pegel perfekt', 'sat', [s.randUnten, s.ueber], 'randUnten, ueber');
  gleich('Pegel perfekt', 'kabel', [k.randUnten, k.randOben], 'randUnten, randOben');

  gleich('Pegel befriedigend', 'sat', [s.unten, s.randUnten], 'unten, randUnten');
  gleich('Pegel befriedigend', 'kabel',
    [k.unten, k.randUnten, k.randOben, k.ueber], 'unten, randUnten, randOben, ueber');

  gleich('Überpegel ab', 'sat', [s.ueber], 'ueber');
  gleich('Überpegel ab', 'kabel', [k.ueber], 'ueber');

  gleich('zu schwach ab', 'sat', [s.unten], 'unten');
  gleich('zu schwach ab', 'kabel', [k.unten], 'unten');
});

test('Rauschabstandszeilen der Tabelle stimmen mit GRENZWERTE überein', () => {
  const s = D.GRENZWERTE.sat.rausch;
  const k = D.GRENZWERTE.kabel.rausch;

  gleich('Rauschabstand perfekt', 'sat', [s.soll], 'soll');
  gleich('Rauschabstand perfekt', 'kabel', [k.soll, 256], 'soll, Modulation 256QAM');

  gleich('Rauschabstand befriedigend', 'sat', [s.min, s.soll], 'min, soll');
  gleich('Rauschabstand befriedigend', 'kabel', [k.min, k.soll, 256], 'min, soll, 256QAM');

  gleich('Rauschabstand Minimum', 'sat', [s.min], 'min');
  gleich('Rauschabstand Minimum', 'kabel', [k.min, 256], 'min, 256QAM');
});

/* Hinweistext eines Eingabefelds holen */
function hinweis(feldId) {
  const m = SEITE.match(
    new RegExp('<label for="' + feldId + '">.*?<span class="hint">(.*?)</span>', 's'));
  assert.ok(m, `Hinweis am Feld ${feldId} nicht gefunden`);
  return m[1];
}

test('die Hinweise an den Eingabefeldern nennen dieselben Zahlen', () => {
  const s = D.GRENZWERTE.sat;
  const k = D.GRENZWERTE.kabel;
  const faelle = [
    ['i-pg',   [s.pegel.randUnten, s.pegel.ueber], 'randUnten, ueber'],
    ['i-snr',  [s.rausch.soll], 'soll'],
    ['i-kpg',  [k.pegel.randUnten, k.pegel.randOben], 'randUnten, randOben'],
    ['i-mer',  [k.rausch.soll, 256], 'soll, 256QAM']
  ];

  for (const [feld, erwartet, woher] of faelle) {
    const gefunden = zahlen(hinweis(feld));
    assert.deepStrictEqual(
      gefunden, erwartet,
      `Hinweis am Feld ${feld}: HTML nennt ${JSON.stringify(gefunden)}, ` +
      `grenzwerte.js nennt ${JSON.stringify(erwartet)} (${woher})`
    );
  }
});

test('grenzwerte.js wird von der Seite vor handbuch.js geladen', () => {
  const g = SEITE.indexOf('assets/grenzwerte.js');
  const h = SEITE.indexOf('assets/handbuch.js');
  assert.ok(g >= 0, 'grenzwerte.js ist nicht eingebunden');
  assert.ok(h >= 0, 'handbuch.js ist nicht eingebunden');
  assert.ok(g < h, 'grenzwerte.js muss vor handbuch.js stehen');
});

test('keine Schwelle steht doppelt — handbuch.js kennt keine Grenzwerte', () => {
  const js = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'handbuch.js'), 'utf8');
  const block = js.slice(
    js.indexOf('   Überpegel-Rechner\n'),
    js.indexOf('   Erstaufnahme und Notiz'));

  /* Alle Schwellen aus grenzwerte.js einsammeln. 0 und 1 bleiben aussen
     vor: das sind Array-Indizes wie felder[0], keine Grenzwerte. */
  const schwellen = new Set();
  for (const art of Object.keys(D.GRENZWERTE)) {
    const g = D.GRENZWERTE[art];
    for (const v of Object.values(g.pegel)) {
      if (typeof v === 'number') { schwellen.add(v); }
    }
    for (const v of Object.values(g.rausch)) {
      if (typeof v === 'number') { schwellen.add(v); }
    }
  }

  /* Zeichenketten ausklammern: dort stehen Fliesstext und SVG-Pfaddaten,
     deren Zahlen zufaellig mit Schwellen zusammenfallen koennen. Ein echter
     Grenzwert stuende als nackte Zahl im Code, nicht in einem String. */
  const nurCode = block
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/−/g, '-');
  const imBlock = new Set((nurCode.match(/-?\b\d+\b/g) || []).map(Number));
  const doppelt = [...schwellen]
    .filter((v) => Math.abs(v) >= 2 && imBlock.has(v))
    .sort((a, b) => a - b);

  assert.deepStrictEqual(
    doppelt, [],
    'Diese Schwellen stehen sowohl in grenzwerte.js als auch im ' +
    'Rechnerblock von handbuch.js: ' + doppelt.join(', ')
  );
});
