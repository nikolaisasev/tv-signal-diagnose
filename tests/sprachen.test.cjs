/* Haelt die beiden Quelldateien beieinander.

   quelle/de.html und quelle/en.html sind zwei Fassungen desselben
   Dokuments. Sie duerfen sich im Wortlaut unterscheiden, nicht aber im
   Bau: gleiche Abschnitte, gleiche Reihenfolge, gleiche Markierungen.
   Laufen sie auseinander, faellt es sonst erst auf, wenn jemand die
   englische Fassung liest und einen Abschnitt vermisst.

   Dazu die Gegenprobe zwischen Text und Daten: jeder ausgezeichnete
   Schluessel muss in allen Datendateien stehen, und keine Datendatei
   darf Schluessel mitschleppen, die niemand verwendet. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const S = require(path.join(__dirname, 'seiten.cjs'));
const B = require(path.join(S.WURZEL, 'bauen', 'erzeuge.cjs'));

const MAERKTE = [...new Set(B.FASSUNGEN.map((f) => f.markt))];

const idsVon = (text) =>
  [...text.matchAll(/<section class="sec" id="([^"]+)"/g)].map((m) => m[1]);

const markierungenVon = (text) =>
  [...text.matchAll(/<!-- ([a-z]+):([a-zA-Z]+):(anfang|ende) -->/g)]
    .map((m) => `${m[1]}:${m[2]}:${m[3]}`);

const schluesselVon = (text, attribut) =>
  [...new Set([...text.matchAll(new RegExp(attribut + '="([^"]+)"', 'g'))]
    .map((m) => m[1]))];

test('beide Quelldateien haben dieselben Abschnitts-IDs in derselben Reihenfolge', () => {
  const [[nameA, a], ...rest] = S.QUELLEN;
  for (const [nameB, b] of rest) {
    assert.deepStrictEqual(
      idsVon(b), idsVon(a),
      `${nameB} hat andere Abschnitte als ${nameA}`
    );
  }
});

/* Die Folge der Abschnitte ist Teil der Auskunft: erst messen, dann
   eingrenzen, dann nachschlagen. Sie steht hier, damit ein
   verschobener oder vergessener Abschnitt nicht erst beim Lesen
   auffaellt. */
const SOLLFOLGE = ['rechner', 'erstfragen', 'anderesgeraet-sat',
  'anderesgeraet-kabel', 'sat', 'transponder', 'kabel', 'gemessen'];

test('jede Datei führt die acht Abschnitte in der Sollfolge', () => {
  for (const [datei, text] of [...S.QUELLEN, ...S.ERZEUGT]) {
    assert.deepStrictEqual(idsVon(text), SOLLFOLGE,
      `${datei}: andere Abschnitte oder andere Reihenfolge`);
  }
});

test('die Abschnitte sind fortlaufend von 1 bis 8 nummeriert', () => {
  for (const [datei, text] of [...S.QUELLEN, ...S.ERZEUGT]) {
    const nummern = [...text.matchAll(/<p class="sec-num">[^\d]*(\d+)<\/p>/g)]
      .map((m) => Number(m[1]));
    assert.deepStrictEqual(nummern, [1, 2, 3, 4, 5, 6, 7, 8],
      `${datei}: Abschnittsnummern ${nummern.join(', ')}`);
  }
});

test('beide Quelldateien tragen dieselben Markierungspaare', () => {
  const [[nameA, a], ...rest] = S.QUELLEN;
  for (const [nameB, b] of rest) {
    assert.deepStrictEqual(
      markierungenVon(b), markierungenVon(a),
      `${nameB} hat andere Markierungen als ${nameA}`
    );
  }
});

test('jedes data-markt verweist auf einen Schlüssel, den jeder Markt kennt', () => {
  for (const [datei, text] of S.QUELLEN) {
    for (const schluessel of schluesselVon(text, 'data-markt')) {
      for (const markt of MAERKTE) {
        const m = require(path.join(S.WURZEL, 'assets', 'markt', markt + '.js'));
        assert.ok(
          schluessel in m.werte,
          `${datei} verlangt "${schluessel}", assets/markt/${markt}.js kennt ihn nicht`
        );
      }
    }
  }
});

test('jedes data-menue verweist auf einen Schlüssel, den jede Menüsprache kennt', () => {
  for (const [datei, text] of S.QUELLEN) {
    for (const schluessel of schluesselVon(text, 'data-menue')) {
      for (const sprache of B.MENUESPRACHEN) {
        const m = require(path.join(S.WURZEL, 'assets', 'menue', sprache + '.js'));
        assert.ok(
          schluessel in m.wege,
          `${datei} verlangt "${schluessel}", assets/menue/${sprache}.js kennt ihn nicht`
        );
      }
    }
  }
});

test('jedes data-menuepunkt verweist auf einen Schlüssel, den jede Menüsprache kennt', () => {
  for (const [datei, text] of S.QUELLEN) {
    for (const schluessel of schluesselVon(text, 'data-menuepunkt')) {
      for (const sprache of B.MENUESPRACHEN) {
        const m = require(path.join(S.WURZEL, 'assets', 'menue', sprache + '.js'));
        assert.ok(
          schluessel in m.punkte,
          `${datei} verlangt "${schluessel}", assets/menue/${sprache}.js kennt ihn nicht`
        );
      }
    }
  }
});

test('jeder Blockschlüssel eines Marktes kommt in beiden Quellen vor', () => {
  for (const markt of MAERKTE) {
    const m = require(path.join(S.WURZEL, 'assets', 'markt', markt + '.js'));
    for (const schluessel of Object.keys(m.bloecke)) {
      for (const [datei, text] of S.QUELLEN) {
        assert.ok(
          text.includes(`<!-- markt:${schluessel}:anfang -->`),
          `assets/markt/${markt}.js bringt den Block "${schluessel}" mit, ` +
          `${datei} hat keine Markierung dafür`
        );
      }
    }
  }
});

/* Totes Material faellt niemandem auf, solange niemand danach sucht.
   Schluessel, die absichtlich vorgehalten werden, stehen in der Liste
   "reserviert" der jeweiligen Marktdatei — damit bleibt der Unterschied
   zwischen "vorbereitet" und "vergessen" sichtbar. */
test('kein Schlüssel in den Datendateien ist unbenutzt und unangemeldet', () => {
  const textAll = S.QUELLEN.map(([, t]) => t).join('\n');

  for (const markt of MAERKTE) {
    const m = require(path.join(S.WURZEL, 'assets', 'markt', markt + '.js'));
    const angemeldet = new Set(m.reserviert || []);
    for (const schluessel of Object.keys(m.werte)) {
      if (angemeldet.has(schluessel)) { continue; }
      assert.ok(
        textAll.includes(`data-markt="${schluessel}"`),
        `assets/markt/${markt}.js: "${schluessel}" wird nirgends verwendet. ` +
        `Entweder auszeichnen oder in reserviert aufnehmen.`
      );
    }
  }

  for (const sprache of B.MENUESPRACHEN) {
    const m = require(path.join(S.WURZEL, 'assets', 'menue', sprache + '.js'));
    for (const schluessel of Object.keys(m.wege)) {
      assert.ok(
        textAll.includes(`data-menue="${schluessel}"`),
        `assets/menue/${sprache}.js: Menüweg "${schluessel}" wird nirgends verwendet`
      );
    }
    for (const schluessel of Object.keys(m.punkte)) {
      assert.ok(
        textAll.includes(`data-menuepunkt="${schluessel}"`),
        `assets/menue/${sprache}.js: Menüpunkt "${schluessel}" wird nirgends verwendet`
      );
    }
  }
});

test('beide Menüsprachen führen dieselben Schlüssel', () => {
  const [erste, ...weitere] = B.MENUESPRACHEN;
  const a = require(path.join(S.WURZEL, 'assets', 'menue', erste + '.js'));
  for (const sprache of weitere) {
    const b = require(path.join(S.WURZEL, 'assets', 'menue', sprache + '.js'));
    for (const raum of ['wege', 'punkte']) {
      assert.deepStrictEqual(
        Object.keys(b[raum]).sort(), Object.keys(a[raum]).sort(),
        `assets/menue/${sprache}.js führt andere ${raum} als ${erste}.js`
      );
    }
  }
});

/* Seit 6.3 wird ein unbelegter Weg nicht mehr durch den deutschen
   ersetzt: eine englische Seite mit deutschen Pfaden ist unbrauchbar.
   Die Markierung bleibt, der Text ist englisch. */
test('kein englischer Menüweg steht noch auf Deutsch da', () => {
  const de = require(path.join(S.WURZEL, 'assets', 'menue', 'de.js'));
  const en = require(path.join(S.WURZEL, 'assets', 'menue', 'en.js'));
  for (const raum of ['wege', 'punkte']) {
    for (const schluessel of Object.keys(de[raum])) {
      assert.notStrictEqual(
        en[raum][schluessel].text, de[raum][schluessel].text,
        `assets/menue/en.js: "${schluessel}" ist noch der deutsche Wortlaut`
      );
    }
  }
});

/* A2: Die Zwischenstufe heisst in der Anleitung ueberall gleich. */
test('alle deutschen Menüwege schreiben die Zwischenstufe gleich', () => {
  const de = require(path.join(S.WURZEL, 'assets', 'menue', 'de.js'));
  for (const [schluessel, weg] of Object.entries(de.wege)) {
    assert.ok(
      !weg.text.includes('Sendersuchlauf und Einstellungen'),
      `assets/menue/de.js: "${schluessel}" nennt einen Punkt, den es im Menü nicht gibt`
    );
    if (weg.text.includes(' Sender → ')) {
      assert.ok(
        weg.text.includes('Sendereinstellung (Programmsuche und -einstellungen)'),
        `assets/menue/de.js: "${schluessel}" schreibt die Zwischenstufe anders`
      );
    }
  }
});

/* Zaehlt, laesst aber nicht durchfallen: eine unfertige Uebersetzung
   soll benutzbar bleiben und trotzdem sichtbar sein. */
test('offene Übersetzungen werden gezählt', () => {
  let summe = 0;
  const zeilen = [];
  for (const [datei, text] of [...S.QUELLEN, ...S.ERZEUGT]) {
    const n = (text.match(/data-todo/g) || []).length;
    summe += n;
    zeilen.push(`${datei}: ${n}`);
  }

  /* Bereiche der Textschicht, die uebersetzt, aber nicht geprueft sind */
  const entwuerfe = [];
  for (const sprache of [...new Set(B.FASSUNGEN.map((f) => f.sprache))]) {
    for (const bereich of (S.texteVon(sprache).entwuerfe || [])) {
      entwuerfe.push(`${sprache}:${bereich}`);
      summe += 1;
    }
  }

  const ungeprueft = [];
  for (const sprache of B.MENUESPRACHEN) {
    const m = require(path.join(S.WURZEL, 'assets', 'menue', sprache + '.js'));
    for (const raum of ['wege', 'punkte']) {
      for (const [schluessel, eintrag] of Object.entries(m[raum])) {
        if (!eintrag.geprueft) { ungeprueft.push(`${sprache}:${raum}:${schluessel}`); }
      }
    }
  }
  summe += ungeprueft.length;

  process.stdout.write(
    '\n# offene Übersetzungen, zusammen ' + summe +
    '\n#   im Markup — ' + zeilen.join(' · ') +
    '\n#   in der Textschicht — ' +
    (entwuerfe.length ? entwuerfe.join(', ') : 'keine') +
    '\n#   unbelegte Menübezeichnungen — ' +
    (ungeprueft.length ? ungeprueft.join(', ') : 'keine') + '\n');
  assert.ok(true);
});
