/* Haelt die ausgelagerte Formelseite an ihrem Platz.

   Der Block "Formeln und Umrechnung" stand im Abschnitt Grundlagen und
   liegt jetzt als eigene Seite formeln.html daneben — bewusst ohne
   Verweis aus index.html. Beides kann unbemerkt zurueckkippen: ein
   Absatz wandert wieder in die Anwendung, oder jemand setzt "der
   Vollstaendigkeit halber" einen Link. Genau das faengt dieser Test ab.

   Dazu der Daempfungsrechner: seine Richtwerte stehen im Code, die
   Tabelle daneben steht auf der Seite. Sie duerfen nicht auseinander
   laufen. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const S = require(path.join(__dirname, 'seiten.cjs'));
const lies = S.lies;

const FORMELN = lies('formeln.html');
const HANDBUCH = lies('assets/handbuch.js');

/* Je ein Satz aus jedem Unterpunkt des Blocks. Steht einer davon
   wieder in index.html, ist der Block zurueckgewandert. */
const SAETZE = [
  'dB ist eine logarithmische Skala',
  'dBm bezieht sich auf 1 Milliwatt',
  'Die gesamte TV-Technik ist auf 75 Ohm genormt',
  'Der Dämpfungsbelag wird in dB je 100 Meter angegeben',
  'Prüft, ob die gemessene Pegeldifferenz zur Kabellänge passt',
  'Der Tuner bekommt alle Kanäle gleichzeitig',
  'An die Stelle des Kanals tritt der'
];

test('der Formelblock steht vollständig auf formeln.html', () => {
  for (const satz of SAETZE) {
    assert.ok(FORMELN.includes(satz), `formeln.html fehlt: "${satz}"`);
  }
});

test('der Formelblock steht in keiner Fassung', () => {
  for (const [datei, text] of S.ALLE) {
    for (const satz of SAETZE) {
      assert.ok(
        !text.includes(satz),
        `dieser Satz gehört auf formeln.html, steht aber wieder in ` +
        `${datei}: "${satz}"`
      );
    }
  }
});

test('keine Fassung verweist auf formeln.html', () => {
  for (const [datei, text] of S.ALLE) {
    assert.ok(
      !text.includes('formeln.html'),
      `die Seite soll absichtlich unverlinkt bleiben — ${datei} verweist darauf`
    );
  }
});

test('der Dämpfungsrechner steht genau einmal, und zwar auf formeln.html', () => {
  for (const id of ['kd-laenge', 'kd-go', 'kd-reset', 'kd-out']) {
    const marke = 'id="' + id + '"';
    const inFormeln = FORMELN.split(marke).length - 1;
    assert.strictEqual(inFormeln, 1, `${marke} steht ${inFormeln}-mal in formeln.html`);
    for (const [datei, text] of S.ALLE) {
      assert.ok(!text.includes(marke), `${marke} steht noch in ${datei}`);
    }
  }
});

test('formeln.html lädt grenzwerte.js vor handbuch.js', () => {
  const g = FORMELN.indexOf('assets/grenzwerte.js');
  const h = FORMELN.indexOf('assets/handbuch.js');
  assert.ok(g >= 0, 'grenzwerte.js ist nicht eingebunden');
  assert.ok(h >= 0, 'handbuch.js ist nicht eingebunden — der Rechner bliebe stumm');
  assert.ok(g < h, 'grenzwerte.js muss vor handbuch.js stehen');
});

test('formeln.html lädt nichts aus dem Netz', () => {
  assert.ok(
    !/https?:\/\//.test(FORMELN),
    'externe Adresse in formeln.html — die Seite muss offline laufen'
  );
});

/* Die Tabelle nennt je Frequenz zwei Richtwerte, der Rechner haelt
   dieselbe Spanne als BELAG. Wer eine Zahl nur an einem der beiden
   Orte aendert, bekommt hier einen roten Test statt einer Seite, die
   etwas anderes behauptet als ihr eigener Rechner. */
function belagAusCode() {
  const m = HANDBUCH.match(/var BELAG=\{([^}]*)\}/);
  assert.ok(m, 'BELAG nicht in handbuch.js gefunden');
  const lies1 = (art) => {
    const t = m[1].match(new RegExp(art + ':\\[(\\d+),(\\d+)\\]'));
    assert.ok(t, `BELAG.${art} nicht gefunden`);
    return [Number(t[1]), Number(t[2])].sort((a, b) => a - b);
  };
  return { sat: lies1('sat'), kabel: lies1('kabel') };
}

function tabellenwerte(zeilenanfang) {
  const zeile = FORMELN.split('\n').find((x) => x.includes(zeilenanfang));
  assert.ok(zeile, `Tabellenzeile "${zeilenanfang}" fehlt in formeln.html`);
  return (zeile.match(/~(\d+) dB \/ 100 m/g) || [])
    .map((x) => Number(x.match(/\d+/)[0]))
    .sort((a, b) => a - b);
}

test('die Richtwerttabelle nennt dieselbe Spanne wie der Dämpfungsrechner', () => {
  const belag = belagAusCode();
  assert.deepStrictEqual(
    tabellenwerte('2150 MHz — obere Sat-ZF'), belag.sat,
    'Satellit: Tabelle auf formeln.html und BELAG in handbuch.js weichen ab'
  );
  assert.deepStrictEqual(
    tabellenwerte('862 MHz — oberes Kabelband'), belag.kabel,
    'Kabel: Tabelle auf formeln.html und BELAG in handbuch.js weichen ab'
  );
});
