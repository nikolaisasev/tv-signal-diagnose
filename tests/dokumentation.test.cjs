/* Haelt die Dokumentation am Code fest.

   dokumentation/diagnosematrix.html wird aus assets/grenzwerte.js
   erzeugt und liegt fertig im Repository, damit man sie ohne Werkzeug
   oeffnen kann. Beides kann auseinanderlaufen: wer eine Schwelle oder
   eine Matrixzelle aendert und die Seite nicht neu erzeugt, haette
   eine Dokumentation, die etwas anderes behauptet als der Rechner.
   Genau das faengt dieser Test ab. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const D = require(path.join(__dirname, '..', 'assets', 'grenzwerte.js'));
const { html } = require(path.join(__dirname, '..', 'dokumentation', 'erzeuge-matrix.cjs'));

const DATEI = path.join(__dirname, '..', 'dokumentation', 'diagnosematrix.html');
const ABGELEGT = fs.readFileSync(DATEI, 'utf8');

test('die abgelegte Matrixseite entspricht dem Generator', () => {
  assert.strictEqual(
    ABGELEGT, html,
    'dokumentation/diagnosematrix.html ist nicht mehr aktuell. ' +
    'Neu erzeugen mit: node dokumentation/erzeuge-matrix.cjs'
  );
});

test('jede Matrixzelle steht in der Seite', () => {
  for (const art of Object.keys(D.MATRIX)) {
    for (const pk of Object.keys(D.MATRIX[art])) {
      for (const rk of ['Q0', 'Q1', 'Q2', 'Q3', 'Q4']) {
        const id = D.MATRIX[art][pk][rk];
        /* Lange Kennungen werden im Markup umgebrochen */
        const gesucht = id.replace('KONFIG-ODER-', 'KONFIG-ODER-<br>');
        assert.ok(
          ABGELEGT.includes(gesucht),
          `${art} ${pk}/${rk}: ${id} fehlt in der Dokumentation`
        );
      }
    }
  }
});

test('die Zustandsfarbe jeder Zelle stimmt mit DIAGNOSEN überein', () => {
  /* Aus dem Markup zurueckgelesen: Klasse mk-<zustand> je Zelle */
  const zellen = [...ABGELEGT.matchAll(/<td class="mk-(\w+)">(.*?)<\/td>/gs)]
    .filter(([, zustand]) => zustand !== 'leer');
  assert.ok(zellen.length > 0, 'keine Zellen gefunden');

  for (const [, zustand, text] of zellen) {
    const id = text.replace('<br>', '');
    assert.ok(D.DIAGNOSEN[id], `unbekannte Kennung in der Dokumentation: ${id}`);
    assert.strictEqual(
      zustand, D.DIAGNOSEN[id].zustand,
      `${id} ist in der Dokumentation "${zustand}", in DIAGNOSEN aber ` +
      `"${D.DIAGNOSEN[id].zustand}"`
    );
  }
});

test('die Seite nennt die Messbereiche aus GRENZWERTE', () => {
  const z = (x) => String(x).replace('-', '−');
  for (const art of Object.keys(D.GRENZWERTE)) {
    const g = D.GRENZWERTE[art];
    for (const [feld, wert] of [
      ['Pegel von', g.pegel.von], ['Pegel bis', g.pegel.bis],
      ['Rausch von', g.rausch.von], ['Rausch bis', g.rausch.bis]
    ]) {
      assert.ok(
        ABGELEGT.includes(z(wert)),
        `${art}: ${feld} = ${wert} steht nicht in der Dokumentation`
      );
    }
  }
});

test('die Dokumentation laedt nichts aus dem Netz', () => {
  assert.ok(
    !/https?:\/\//.test(ABGELEGT),
    'externe Adresse in der Dokumentation — sie muss offline funktionieren'
  );
});
