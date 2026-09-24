/* Vergleicht die angezeigten Zahlen mit denen im Rechner.

   Genau diese Lücke war der Anlass des Umbaus: die Tabelle wies über
   −25 dBm Übersteuerung aus, der Rechner meldete Grenzbereich. Wer eine
   Zahl nur an einem der beiden Orte ändert, soll das hier merken.

   Die Grenzwerttabellen der Seite sind inzwischen durch die erzeugte
   Diagnosematrix ersetzt; sie prueft tests/dokumentation.test.cjs.
   Hier bleiben die Hinweise an den Eingabefeldern, die Reihenfolge der
   Skripte und die Dopplungspruefung. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const D = require(path.join(__dirname, '..', 'assets', 'grenzwerte.js'));
const S = require(path.join(__dirname, 'seiten.cjs'));

/* Die Seite schreibt Minus als −, JavaScript als -. */
function zahlen(text) {
  return (text.replace(/−/g, '-').match(/-?\d+(?:[.,]\d+)?/g) || [])
    .map((x) => parseFloat(x.replace(',', '.')));
}

/* Hinweistext eines Eingabefelds holen */
function hinweis(seite, datei, feldId) {
  const m = seite.match(
    new RegExp('<label for="' + feldId + '">.*?<span class="hint">(.*?)</span>', 's'));
  assert.ok(m, `${datei}: Hinweis am Feld ${feldId} nicht gefunden`);
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

  for (const [datei, seite] of S.ALLE) {
    for (const [feld, erwartet, woher] of faelle) {
      const gefunden = zahlen(hinweis(seite, datei, feld));
      assert.deepStrictEqual(
        gefunden, erwartet,
        `${datei}, Feld ${feld}: HTML nennt ${JSON.stringify(gefunden)}, ` +
        `grenzwerte.js nennt ${JSON.stringify(erwartet)} (${woher})`
      );
    }
  }
});

test('grenzwerte.js wird von jeder Fassung vor handbuch.js geladen', () => {
  for (const [datei, seite] of S.ALLE) {
    const g = seite.indexOf('assets/grenzwerte.js');
    const h = seite.indexOf('assets/handbuch.js');
    assert.ok(g >= 0, `${datei}: grenzwerte.js ist nicht eingebunden`);
    assert.ok(h >= 0, `${datei}: handbuch.js ist nicht eingebunden`);
    assert.ok(g < h, `${datei}: grenzwerte.js muss vor handbuch.js stehen`);
  }
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
