/* Haelt die erzeugten Matrizen am Code fest.

   Die Diagnosematrix steht an zwei Orten — in index.html zwischen den
   Markierungen und auf der Dokumentationsseite. Beide werden aus
   assets/grenzwerte.js erzeugt und liegen fertig im Repository, damit
   man sie ohne Werkzeug oeffnen kann. Wer eine Schwelle oder eine
   Matrixzelle aendert und npm run doku nicht laufen laesst, haette eine
   Anzeige, die etwas anderes behauptet als der Rechner. Genau das
   faengt dieser Test ab — fuer beide Dateien. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const D = require(path.join(__dirname, '..', 'assets', 'grenzwerte.js'));
const G = require(path.join(__dirname, '..', 'bauen', 'erzeuge-matrix.cjs'));
const S = require(path.join(__dirname, 'seiten.cjs'));

const RAUSCHKLASSEN = D.RAUSCHKLASSEN;
const lies = S.lies;
const B = require(path.join(__dirname, '..', 'bauen', 'erzeuge.cjs'));

/* Welche Textschicht eine Datei benutzt */
function texteFuer(datei) {
  const f = B.FASSUNGEN.find((x) => datei.startsWith(x.kennung + '/'));
  const sprache = f ? f.sprache : (datei.includes('en.html') ? 'en' : 'de');
  return S.texteVon(sprache);
}

const DOKU = lies('dokumentation/diagnosematrix.html');

test('die abgelegte Matrixseite entspricht dem Generator', () => {
  assert.strictEqual(
    DOKU, G.dokuSeite(),
    'dokumentation/diagnosematrix.html ist nicht mehr aktuell. ' +
    'Neu erzeugen mit: npm run doku'
  );
});

test('die Matrixblöcke jeder Fassung entsprechen dem Generator', () => {
  for (const [datei, text] of S.ALLE) {
    assert.strictEqual(
      text, G.setzeBloecke(text, datei, texteFuer(datei)),
      `die Matrix in ${datei} ist nicht mehr aktuell. Neu erzeugen mit: npm run bauen`
    );
  }
});

test('beide Markierungspaare sind in jeder Datei richtig geschachtelt', () => {
  for (const [datei, text] of S.ALLE) {
    for (const art of Object.keys(D.MATRIX)) {
      const anfang = `<!-- matrix:${art}:anfang -->`;
      const ende = `<!-- matrix:${art}:ende -->`;
      const a = text.indexOf(anfang);
      const b = text.indexOf(ende);
      assert.ok(a >= 0, `${anfang} fehlt in ${datei}`);
      assert.ok(b >= 0, `${ende} fehlt in ${datei}`);
      assert.ok(b > a, `${datei}: ${ende} steht vor ${anfang}`);
      assert.strictEqual(text.indexOf(anfang, a + 1), -1, `${datei}: ${anfang} steht doppelt`);
      assert.strictEqual(text.indexOf(ende, b + 1), -1, `${datei}: ${ende} steht doppelt`);
    }
  }
});

test('der Generator bricht ab, wenn eine Markierung fehlt', () => {
  const quelle = S.QUELLEN[0][1];
  const ohne = quelle.replace('<!-- matrix:kabel:ende -->', '');
  assert.throws(() => G.setzeBloecke(ohne), /Markierung fehlt/);
  const vertauscht = quelle
    .replace('<!-- matrix:sat:anfang -->', '@@A@@')
    .replace('<!-- matrix:sat:ende -->', '<!-- matrix:sat:anfang -->')
    .replace('@@A@@', '<!-- matrix:sat:ende -->');
  assert.throws(() => G.setzeBloecke(vertauscht), /vertauscht|doppelt/);
});

/* Aus dem Markup zurueckgelesen: Klasse mk-<zustand> je Zelle */
function zellen(quelle) {
  return [...quelle.matchAll(/<td class="mk-(\w+)" data-kennung="([^"]+)">(.*?)<\/td>/gs)];
}

for (const [name, quelle] of [['die Dokumentationsseite', () => DOKU],
                              ...S.ERZEUGT.map(([n, t]) => [n, () => t])]) {
  test(`${name}: jede Zellfarbe stimmt mit DIAGNOSEN überein`, () => {
    const T = texteFuer(name);
    const gefunden = zellen(quelle());
    assert.ok(gefunden.length > 0, 'keine Zellen gefunden');
    for (const [, zustand, id, text] of gefunden) {
      assert.ok(T.diagnosen[id], `unbekannte Kennung: ${id}`);
      assert.strictEqual(
        zustand, D.ZUSTAND[id],
        `${id} ist im Markup "${zustand}", in ZUSTAND aber "${D.ZUSTAND[id]}"`
      );
      assert.strictEqual(
        text.replace('<br>', ''), T.diagnosen[id].anzeige,
        `${id}: die Zelle zeigt "${text}", die Textschicht sagt "${T.diagnosen[id].anzeige}"`
      );
    }
  });

  test(`${name}: jede Matrixzelle kommt vor`, () => {
    for (const art of Object.keys(D.MATRIX)) {
      for (const pk of Object.keys(D.MATRIX[art])) {
        for (const rk of RAUSCHKLASSEN) {
          const id = D.MATRIX[art][pk][rk];
          assert.ok(quelle().includes(`data-kennung="${id}"`), `${art} ${pk}/${rk}: ${id} fehlt`);
        }
      }
    }
  });

  test(`${name}: die Befundlegende nennt jede Kennung mit ihrem Satz`, () => {
    for (const art of Object.keys(D.MATRIX)) {
      for (const id of G.kennungen(art)) {
        const d = texteFuer(name).diagnosen[id];
        assert.ok(
          quelle().includes(`<dt class="mk-${D.ZUSTAND[id]}" data-kennung="${id}">${d.anzeige}</dt>`),
          `${art}: Kennung ${id} fehlt in der Befundlegende`
        );
        assert.ok(
          quelle().includes(`<dd>${d.befund}</dd>`),
          `${art}: Befundsatz zu ${id} fehlt — "${d.befund}"`
        );
      }
    }
  });

  test(`${name}: nennt die Messbereiche aus GRENZWERTE`, () => {
    const z = (x) => String(x).replace('-', '−');
    for (const art of Object.keys(D.GRENZWERTE)) {
      const g = D.GRENZWERTE[art];
      for (const [feld, wert] of [
        ['Pegel von', g.pegel.von], ['Pegel bis', g.pegel.bis],
        ['Rausch von', g.rausch.von], ['Rausch bis', g.rausch.bis]
      ]) {
        assert.ok(quelle().includes(z(wert)), `${art}: ${feld} = ${wert} fehlt`);
      }
    }
  });
}

test('die Befundlegende ist nach Zustand sortiert', () => {
  const folge = ['gut', 'grenz', 'fehler', 'unklar'];
  for (const art of Object.keys(D.MATRIX)) {
    const raenge = G.kennungen(art).map((id) => folge.indexOf(D.ZUSTAND[id]));
    for (let i = 1; i < raenge.length; i++) {
      assert.ok(raenge[i] >= raenge[i - 1], `${art}: Reihenfolge der Zustände stimmt nicht`);
    }
  }
});

test('die Dokumentation lädt nichts aus dem Netz', () => {
  assert.ok(
    !/https?:\/\//.test(DOKU),
    'externe Adresse in der Dokumentation — sie muss offline funktionieren'
  );
});
