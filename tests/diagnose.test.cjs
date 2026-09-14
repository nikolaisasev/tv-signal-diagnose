/* Prüft die Diagnoselogik aus assets/grenzwerte.js.
   node --test tests/   ·   keine externen Pakete. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const D = require(path.join(__dirname, '..', 'assets', 'grenzwerte.js'));
const DATEN = JSON.parse(fs.readFileSync(path.join(__dirname, 'faelle.json'), 'utf8'));

const RAUSCHKLASSEN = ['Q0', 'Q1', 'Q2', 'Q3', 'Q4'];

test('jeder Fall liefert die erwartete Diagnose', () => {
  for (const f of DATEN.diagnosen) {
    const d = D.diagnose(f.art, f.pegel, f.rausch);
    assert.strictEqual(
      d.id, f.erwartet,
      `${f.name}: ${f.art} ${f.pegel}/${f.rausch} ` +
      `→ ${d.id} (${d.klassen.pegel}/${d.klassen.rausch}), erwartet ${f.erwartet}`
    );
  }
});

test('der Regressionsfall aus dem Anlass ist abgedeckt', () => {
  const d = D.diagnose('sat', -15, 10);
  assert.strictEqual(d.id, 'UEBERPEGEL-GRENZ');
  assert.strictEqual(d.klassen.pegel, 'P5', 'über −25 dBm ist zu hoch, nicht normal');
  assert.match(d.befund, /Pegel über dem Grenzwert/);
});

test('jede Matrixzelle wird von mindestens einem Fall abgedeckt', () => {
  const getroffen = new Set();
  for (const f of DATEN.diagnosen) {
    const k = D.klassifiziere(f.art, f.pegel, f.rausch);
    getroffen.add(`${f.art}.${k.pegel}.${k.rausch}`);
  }
  const fehlend = [];
  for (const art of Object.keys(D.MATRIX)) {
    for (const pk of Object.keys(D.MATRIX[art])) {
      for (const rk of RAUSCHKLASSEN) {
        if (!getroffen.has(`${art}.${pk}.${rk}`)) { fehlend.push(`${art} ${pk}/${rk}`); }
      }
    }
  }
  assert.deepStrictEqual(fehlend, [], 'nicht abgedeckte Zellen: ' + fehlend.join(', '));
});

test('alle Kombinationen sind in der Matrix belegt', () => {
  const erwartet = { sat: ['P1', 'P2', 'P3', 'P5'], kabel: ['P1', 'P2', 'P3', 'P4', 'P5'] };
  for (const art of Object.keys(erwartet)) {
    assert.deepStrictEqual(
      Object.keys(D.MATRIX[art]).sort(), erwartet[art].sort(),
      `${art}: unerwartete Pegelklassen`
    );
    for (const pk of erwartet[art]) {
      for (const rk of RAUSCHKLASSEN) {
        assert.ok(D.MATRIX[art][pk][rk], `${art} ${pk}/${rk} ist leer`);
      }
    }
  }
});

test('jede Diagnose-ID aus der Matrix existiert in DIAGNOSEN', () => {
  for (const art of Object.keys(D.MATRIX)) {
    for (const pk of Object.keys(D.MATRIX[art])) {
      for (const rk of RAUSCHKLASSEN) {
        const id = D.MATRIX[art][pk][rk];
        assert.ok(D.DIAGNOSEN[id], `${art} ${pk}/${rk} verweist auf unbekannte Diagnose ${id}`);
      }
    }
  }
});

test('keine toten Diagnosetexte — jede Diagnose wird verwendet', () => {
  const benutzt = new Set();
  for (const art of Object.keys(D.MATRIX)) {
    for (const pk of Object.keys(D.MATRIX[art])) {
      for (const rk of RAUSCHKLASSEN) { benutzt.add(D.MATRIX[art][pk][rk]); }
    }
  }
  const tot = Object.keys(D.DIAGNOSEN).filter((id) => !benutzt.has(id));
  assert.deepStrictEqual(tot, [], 'unbenutzte Diagnosen: ' + tot.join(', '));
});

test('jede Diagnose hat Befund, Begründung und mindestens zwei Schritte', () => {
  for (const [id, d] of Object.entries(D.DIAGNOSEN)) {
    assert.ok(d.befund && d.befund.length > 0, `${id}: kein Befund`);
    assert.ok(d.warum && d.warum.length > 0, `${id}: keine Begründung`);
    assert.ok(['gut', 'grenz', 'fehler', 'unklar'].includes(d.zustand), `${id}: unbekannter Zustand`);
    for (const art of ['sat', 'kabel']) {
      const schritte = D.schritteFuer(id, art);
      assert.ok(schritte.length >= 2, `${id} / ${art}: nur ${schritte.length} Schritt(e)`);
    }
  }
});

test('nie mehr als fünf Schritte, spezifische bleiben immer erhalten', () => {
  for (const [id, d] of Object.entries(D.DIAGNOSEN)) {
    for (const art of ['sat', 'kabel']) {
      const schritte = D.schritteFuer(id, art);
      assert.ok(schritte.length <= D.MAX_SCHRITTE, `${id} / ${art}: ${schritte.length} Schritte`);
      for (const eigen of d.schritte[art] || []) {
        assert.ok(schritte.includes(eigen), `${id} / ${art}: "${eigen}" wurde weggekürzt`);
      }
    }
  }
});

test('Werte außerhalb des Messbereichs werden abgefangen und benannt', () => {
  for (const f of DATEN.ausserhalb) {
    const r = D.pruefeWertebereich(f.art, f.pegel, f.rausch);
    assert.ok(r, `${f.name}: nicht abgefangen`);
    assert.ok(r.meldung.includes(f.nennt), `${f.name}: Meldung nennt "${f.nennt}" nicht — ${r.meldung}`);
    assert.match(r.meldung, /Gültig: /, `${f.name}: Meldung nennt keinen gültigen Bereich`);
    assert.ok(r.schritte.length > 0, `${f.name}: keine Schritte`);
  }
});

test('gültige Werte werden nicht abgefangen', () => {
  for (const f of DATEN.diagnosen) {
    assert.strictEqual(
      D.pruefeWertebereich(f.art, f.pegel, f.rausch), null,
      `${f.name}: ${f.pegel}/${f.rausch} faelschlich als unmoeglich abgewiesen`
    );
  }
});

test('jedes Ergebnis nennt beide Klassifizierungen sichtbar', () => {
  const d = D.diagnose('sat', -15, 10);
  assert.match(d.messwerte, /Pegel −15 dBm \(zu hoch, /);
  assert.match(d.messwerte, /SNR 10 dB \(Grenzbereich, /);
});

test('Grenz- und Überfälle nennen den Bereich, gegen den gemessen wurde', () => {
  const d = D.diagnose('sat', -15, 10);
  assert.match(d.messwerte, /zu hoch, über −25 dBm/);
  assert.match(d.messwerte, /Grenzbereich, 6 bis 11 dB/);

  const k = D.diagnose('kabel', 71, 32);
  assert.match(k.messwerte, /oberer Rand, 70 bis 78 dBµV/);
  assert.match(k.messwerte, /Grenzbereich, 30 bis 36 dB/);
});

test('jede Klasse hat eine Bereichsangabe', () => {
  for (const art of ['sat', 'kabel']) {
    for (const pk of Object.keys(D.MATRIX[art])) {
      const t = D.pegelBereich(art, pk);
      assert.ok(t && /\d/.test(t), `${art} ${pk}: keine Bereichsangabe`);
    }
    for (const rk of RAUSCHKLASSEN) {
      const t = D.rauschBereich(art, rk);
      assert.ok(t && /\d/.test(t), `${art} ${rk}: keine Bereichsangabe`);
    }
  }
});

test('die empfohlene Dämpfung bringt den Pegel in den perfekten Bereich', () => {
  for (const art of ['sat', 'kabel']) {
    const p = D.GRENZWERTE[art].pegel;
    const obenNormal = p.randOben === null ? p.ueber : p.randOben;
    /* über der Grenze bis zum Rand des Messbereichs durchgehen */
    for (let v = p.ueber + 0.5; v <= p.bis; v += 0.5) {
      const wert = Math.round(v * 10) / 10;
      const glied = D.empfohleneDaempfung(art, wert);
      const danach = wert - glied;
      assert.ok(
        danach <= obenNormal,
        `${art} ${wert}: ${glied} dB laesst ${danach} uebrig, ueber ${obenNormal}`
      );
      assert.ok(
        danach >= p.unten,
        `${art} ${wert}: ${glied} dB daempft auf ${danach} und damit unter ${p.unten}`
      );
    }
  }
});

test('kein Schritt nennt mehr eine feste Dämpfung', () => {
  for (const id of Object.keys(D.DIAGNOSEN)) {
    for (const art of ['sat', 'kabel']) {
      for (const schritt of D.schritteFuer(id, art)) {
        assert.ok(
          !/Dämpfungsglied \d/.test(schritt),
          `${id} / ${art}: feste Zahl im Schritt "${schritt}"`
        );
      }
    }
  }
});

test('der Platzhalter wird in der Ausgabe ersetzt', () => {
  const d = D.diagnose('sat', -15, 4);
  const mit = d.schritte.filter((x) => x.includes('Dämpfungsglied'));
  assert.ok(mit.length > 0, 'kein Dämpfungsschritt im Überpegelfall');
  for (const x of mit) {
    assert.ok(!x.includes('{daempfung}'), `Platzhalter nicht ersetzt: ${x}`);
    assert.match(x, /Dämpfungsglied \d+ dB/);
  }
});
