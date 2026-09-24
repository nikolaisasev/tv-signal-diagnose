/* Haelt die Sprachschicht von der Logik getrennt.

   Vorher stand der Wortlaut dort, wo gerechnet wurde. Das faellt erst
   auf, wenn jemand die englische Fassung liest und einen deutschen
   Satz findet — und dann ist die Ursache eine Datei, die alle
   Fassungen gemeinsam nutzen. Deshalb hier zwei Pruefungen:

     1. Beide Textdateien fuehren dieselben Schluessel.
     2. In den gemeinsamen Dateien steht kein sichtbarer Wortlaut mehr.

   Dazu die Marktschicht: ein Eigenname bleibt, wie er ist; ein
   Begriff braucht je Sprache einen Wert. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const S = require(path.join(__dirname, 'seiten.cjs'));
const B = require(path.join(S.WURZEL, 'bauen', 'erzeuge.cjs'));
const D = require(path.join(S.WURZEL, 'assets', 'grenzwerte.js'));

const SPRACHEN = [...new Set(B.FASSUNGEN.map((f) => f.sprache))];
const MAERKTE = [...new Set(B.FASSUNGEN.map((f) => f.markt))];

/* Alle Pfade eines Baums, ohne die Werte */
function pfade(o, p) {
  const r = [];
  for (const k of Object.keys(o)) {
    const v = o[k];
    const q = p ? p + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) { r.push(...pfade(v, q)); }
    else { r.push(q); }
  }
  return r;
}

test('alle Textdateien führen dieselben Schlüssel', () => {
  const [erste, ...weitere] = SPRACHEN;
  const a = pfade(S.texteVon(erste), '').sort();
  for (const sprache of weitere) {
    const b = pfade(S.texteVon(sprache), '').sort();
    const fehlt = a.filter((x) => !b.includes(x));
    const zuviel = b.filter((x) => !a.includes(x));
    assert.deepStrictEqual(fehlt, [], `assets/texte/${sprache}.js fehlt: ${fehlt.join(', ')}`);
    assert.deepStrictEqual(zuviel, [], `assets/texte/${sprache}.js hat zusätzlich: ${zuviel.join(', ')}`);
  }
});

test('jede Diagnose hat in jeder Sprache Anzeige, Befund und Begründung', () => {
  for (const sprache of SPRACHEN) {
    const T = S.texteVon(sprache);
    for (const id of Object.keys(D.ZUSTAND)) {
      const d = T.diagnosen[id];
      assert.ok(d, `assets/texte/${sprache}.js kennt die Diagnose ${id} nicht`);
      for (const feld of ['anzeige', 'befund', 'warum']) {
        assert.ok(d[feld] && d[feld].length > 0, `${sprache}/${id}: ${feld} fehlt`);
      }
    }
  }
});

test('jede Klasse hat in jeder Sprache einen Namen', () => {
  for (const sprache of SPRACHEN) {
    const T = S.texteVon(sprache);
    for (const pk of D.PEGELKLASSEN) {
      assert.ok(T.pegelklassen[pk], `${sprache}: Pegelklasse ${pk} ohne Namen`);
    }
    for (const qk of D.RAUSCHKLASSEN) {
      assert.ok(T.rauschklassen[qk], `${sprache}: Rauschklasse ${qk} ohne Namen`);
    }
  }
});

/* Leitwoerter, die in den gemeinsamen Dateien nichts zu suchen haben.
   Sie stehen dort nur, wenn wieder Wortlaut hineingeraten ist. In
   Kommentaren duerfen sie vorkommen — geprueft wird der Code. */
const LEITWOERTER = ['Rauschabstand', 'Pegel am', 'Legende', 'Messbereich',
  'Was war', 'Jetzt prüfen', 'Dämpfungsglied', 'Verstärker', 'Stecker',
  'nicht möglich', 'Satellit ', 'Kabel '];

function nurCode(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
}

test('in den gemeinsamen Dateien steht kein sichtbarer Wortlaut', () => {
  const dateien = ['assets/grenzwerte.js', 'assets/handbuch.js',
    'bauen/erzeuge-matrix.cjs'];
  for (const datei of dateien) {
    const code = nurCode(S.lies(datei));
    for (const wort of LEITWOERTER) {
      assert.ok(
        !code.includes(wort),
        `${datei}: "${wort}" gehört in die Sprachschicht, nicht hierher`
      );
    }
  }
});

/* ---------- Marktschicht ---------- */
test('jeder Marktschlüssel trägt eine Art', () => {
  for (const markt of MAERKTE) {
    const m = require(path.join(S.WURZEL, 'assets', 'markt', markt + '.js'));
    for (const [schluessel, eintrag] of Object.entries(m.werte)) {
      assert.ok(eintrag && typeof eintrag === 'object',
        `assets/markt/${markt}.js: "${schluessel}" ist kein Eintrag mit Art`);
      assert.ok(['name', 'begriff'].includes(eintrag.art),
        `assets/markt/${markt}.js: "${schluessel}" hat die Art "${eintrag.art}"`);
    }
  }
});

test('jeder Eigenname hat einen Wert, jeder Begriff einen je Sprache', () => {
  for (const markt of MAERKTE) {
    const m = require(path.join(S.WURZEL, 'assets', 'markt', markt + '.js'));
    for (const [schluessel, eintrag] of Object.entries(m.werte)) {
      if (eintrag.art === 'name') {
        assert.ok(typeof eintrag.wert === 'string' && eintrag.wert.length > 0,
          `assets/markt/${markt}.js: Eigenname "${schluessel}" ohne Wert`);
        continue;
      }
      for (const sprache of SPRACHEN) {
        assert.ok(typeof eintrag[sprache] === 'string' && eintrag[sprache].length > 0,
          `assets/markt/${markt}.js: Begriff "${schluessel}" fehlt für ${sprache}`);
      }
    }
  }
});

/* Das war der Anlass: "allocated by the Antennenbauer". */
test('kein Begriff steht in der englischen Fassung noch deutsch da', () => {
  const enFassungen = B.FASSUNGEN.filter((f) => f.sprache === 'en');
  const gebaut = B.alleFassungen();
  for (const fassung of enFassungen) {
    const text = gebaut.get(fassung.kennung);
    const m = require(path.join(S.WURZEL, 'assets', 'markt', fassung.markt + '.js'));
    for (const [schluessel, eintrag] of Object.entries(m.werte)) {
      if (eintrag.art !== 'begriff' || eintrag.de === eintrag.en) { continue; }
      const stelle = text.match(new RegExp('data-markt="' + schluessel + '"[^>]*>([^<]*)<'));
      if (!stelle) { continue; }
      assert.strictEqual(stelle[1], eintrag.en,
        `${fassung.kennung}: "${schluessel}" zeigt "${stelle[1]}" statt "${eintrag.en}"`);
    }
  }
});
