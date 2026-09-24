/* Haelt die Menuebezeichnungen an der Bedienungsanleitung fest.

   Diese Namen sind kein Stil, sondern Fundstellen: Wer am Geraet nach
   "Manueller Suchlauf" sucht oder nach einer DiSEqC-Nummer, findet
   nichts — der Punkt heisst "Manuelle Einstellung", und die Anschluesse
   tragen Buchstaben. Beides schreibt sich beim Umformulieren leicht
   wieder zurueck, deshalb steht es hier.

   Geprueft werden beide Quelldateien und alle erzeugten Fassungen: ein
   Test, der nur eine Datei ansieht, uebersieht seit dem Umbau fuenf.

   Quelle: eGuide webOS 25, Abschnitte 6.10.1 bis 6.10.6, deutsche und
   englische Fassung abgeglichen. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const S = require(path.join(__dirname, 'seiten.cjs'));

const WEITERE = ['formeln.html', 'assets/grenzwerte.js', 'assets/handbuch.js',
  'README.md', 'BITTE-LESEN.txt'];

const inhalt = [...S.ALLE, ...WEITERE.map((p) => [p, S.lies(p)])];

/* Sprachunabhaengig geprueft wird, was in beiden Fassungen gleich
   dasteht: die Schreibweise der DiSEqC-Anschluesse, die Frequenzliste
   und der Menueeintrag "Benutzer". Die Prosa darum herum ist
   uebersetzt und wird je Sprache verglichen. */
const istEnglisch = (datei) => datei.includes('en.html') || datei.startsWith('en-');

test('der Menüpunkt heißt nirgends mehr "Manueller Suchlauf"', () => {
  for (const [datei, text] of inhalt) {
    assert.ok(
      !/manuelle[rmn]?\s+suchlauf/i.test(text),
      `${datei}: der Punkt heißt "Manuelle Einstellung", englisch "Manual Tuning"`
    );
  }
});

/* Die Menuesprache folgt der Sprache der Fassung: die deutschen
   Fassungen zeigen den deutschen Weg, die englische den englischen. */
test('der Menüweg zur Manuellen Einstellung lautet wie in der Anleitung', () => {
  const weg = {
    de: 'Alle Einstellungen → Allgemein → Sender → ' +
      'Sendereinstellung (Programmsuche und -einstellungen) → Manuelle Einstellung',
    en: 'All Settings → General → Programmes → ' +
      'Programme Tuning (Programme Tuning & Settings) → Manual Tuning'
  };
  /* Der Weg steht seit 6.2 in Gliedern; zusammengesetzt muss er
     wieder wortgleich dastehen. */
  for (const [datei, text] of S.ERZEUGT) {
    const sprache = istEnglisch(datei) ? 'en' : 'de';
    const roh = S.nurText(text);
    assert.ok(roh.includes(weg[sprache]),
      `${datei}: der Menüweg lautet nicht wie in der Anleitung`);
    const andere = sprache === 'de' ? 'en' : 'de';
    assert.ok(!roh.includes(weg[andere]),
      `${datei}: hier steht zusätzlich der ${andere}-Weg — die Menüsprache folgt der Fassung`);
  }

  /* In beiden Quellen steht der deutsche Wortlaut: er ist der
     sichtbare Rueckfall, wenn jemand die Quelle ohne Generator
     oeffnet. Die Sprachfassung setzt erst der Bauer ein. */
  for (const [datei, text] of S.QUELLEN) {
    assert.ok(S.nurText(text).includes(weg.de),
      `${datei}: der Menüweg lautet nicht wie in der Anleitung`);
  }
});

/* DiSEqC steht im Menue mit A, B, C, D sowie ToneA und ToneB. Eine Ziffer
   unmittelbar dahinter waere wieder die alte, falsche Bezeichnung. Die
   Norm-Nennungen "DiSEqC 1.0" und "Unicable 1" sind etwas anderes und
   bleiben erlaubt. */
test('DiSEqC wird nirgends mit Zahlen bezeichnet', () => {
  /* Erst die Auszeichnung entfernen: In einer Tabelle stehen Punkt und
     Sollwert in getrennten Zellen, und dazwischen laegen sonst mehr
     Zeichen als das Muster zulaesst. */
  const muster = /DiSEqC(?!\s+\d\.\d)[^.\n]{0,40}?\b(?:Position\s*)?[1-8]\b/i;
  for (const [datei, text] of inhalt) {
    const nurText = text.replace(/<[^>]+>/g, ' ');
    const treffer = nurText.match(muster);
    assert.ok(!treffer, `${datei}: DiSEqC mit Zahl — "${treffer && treffer[0]}"`);
  }
});

test('die Buchstabenbezeichnung und die LNB-Liste stehen in jeder Fassung', () => {
  for (const [datei, text] of S.ALLE) {
    assert.ok(text.includes('A~D / ToneA~B'), `${datei}: die Schreibweise A~D / ToneA~B fehlt`);
    for (const stueck of ['9750/10750', '10600', '10750', '11300', '5150', 'MDU1', 'MDU5']) {
      assert.ok(text.includes(stueck), `${datei}: ${stueck} fehlt in der LNB-Liste`);
    }
    /* Der Menüeintrag heißt seit 6.3 so, wie er am Gerät heißt:
       deutsch "Benutzer", englisch "User". In den Quellen steht der
       deutsche Wortlaut als sichtbarer Rückfall; die Sprachfassung
       setzt erst der Generator ein. */
    const quelle = datei.startsWith('quelle/');
    const eintrag = (!quelle && istEnglisch(datei)) ? 'User' : 'Benutzer';
    assert.ok(text.includes(eintrag),
      `${datei}: der Menüeintrag "${eintrag}" fehlt`);
  }
});

test('der Schritt zum Abschalten trägt die Erklärung zum gegenseitigen Ausschluss', () => {
  const teile = {
    de: ['schließen einander aus', 'Motortyp selbst ab', 'falschen Befehle'],
    en: ['mutually exclusive', 'motor type off by itself', 'wrong commands']
  };
  for (const [datei, text] of S.ALLE) {
    const sprache = istEnglisch(datei) ? 'en' : 'de';
    const marke = sprache === 'de' ? 'DiSEqC auf Aus' : 'DiSEqC off';
    const zeile = text.split('\n').find((x) => x.includes(marke));
    assert.ok(zeile, `${datei}: der Schritt "${marke}" fehlt`);
    for (const teil of teile[sprache]) {
      assert.ok(zeile.includes(teil), `${datei}: die Erklärung ist unvollständig — "${teil}" fehlt`);
    }
  }
});
