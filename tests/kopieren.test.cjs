/* Haelt den Kopierknopf an den Menuewegen fest.

   Ein Menueweg wandert in Tickets und Nachrichten. Abgeschrieben
   verrutscht gerade bei den langen Pfaden mit Klammerzusatz leicht ein
   Zeichen — deshalb der Knopf. Was er kopiert, muss genau der sichtbare
   Pfad sein: kein Sternchen, kein geschuetztes Leerzeichen, kein
   Knopftext.

   Geprueft wird hier der Bau; dass der Klick wirklich kopiert, laesst
   sich nur im Browser sehen und steht im Bericht. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const S = require(path.join(__dirname, 'seiten.cjs'));
const B = require(path.join(S.WURZEL, 'bauen', 'erzeuge.cjs'));

const GEBAUT = B.alleFassungen();
const CSS = S.lies('assets/stil.css');
const JS = S.lies('assets/handbuch.js');

/* Ein Weg steht auf genau einer Zeile */
function wegzeilen(text) {
  return text.split('\n').filter((z) => z.includes('data-menue='));
}

test('jeder Menüweg trägt einen Kopierknopf', () => {
  for (const [datei, text] of S.ERZEUGT) {
    const zeilen = wegzeilen(text);
    assert.ok(zeilen.length > 0, `${datei}: kein Menüweg gefunden`);
    for (const zeile of zeilen) {
      const schluessel = zeile.match(/data-menue="([^"]+)"/)[1];
      assert.strictEqual((zeile.match(/class="mw-kopieren"/g) || []).length, 1,
        `${datei}: "${schluessel}" hat keinen oder mehr als einen Kopierknopf`);
      assert.ok(zeile.includes('class="mw-status"'),
        `${datei}: "${schluessel}" hat keine Stelle für die Rückmeldung`);
    }
  }
});

/* Der Knopf traegt ein Zeichen, kein Wort — dasselbe wie am Messwert
   des Rechners. Was er tut, sagt das aria-label. */
test('der Knopf trägt ein Zeichen, und sein Zweck steht in der Textschicht', () => {
  for (const fassung of B.FASSUNGEN) {
    const T = S.texteVon(fassung.sprache);
    const text = GEBAUT.get(fassung.kennung);
    for (const zeile of wegzeilen(text)) {
      assert.ok(zeile.includes(`aria-label="${T.menue.kopierenLang}"`),
        `${fassung.kennung}: das aria-label nennt den Zweck nicht`);
      assert.ok(/<button type="button" class="mw-kopieren"[^>]*><\/button>/.test(zeile),
        `${fassung.kennung}: der Knopf trägt Text statt eines Zeichens`);
      assert.ok(/class="mw-kopieren" hidden/.test(zeile),
        `${fassung.kennung}: der Knopf ist nicht verborgen angelegt`);
    }
  }
  /* Die Meldungen setzt das Skript — es darf sie nicht selbst
     formulieren. */
  for (const schluessel of ['kopiert', 'markiert']) {
    assert.ok(JS.includes(`TEXTE.menue.${schluessel}`),
      `handbuch.js holt "${schluessel}" nicht aus der Textschicht`);
  }
});

/* Das Sinnbild steht einmal im Code. Zwei Beschreibungen desselben
   Zeichens laufen frueher oder spaeter auseinander. */
test('beide Kopierknöpfe benutzen dasselbe Zeichen', () => {
  assert.strictEqual((JS.match(/M10\.5 14\.5h-8a1 1 0 0 1-1-1v-9/g) || []).length, 1,
    'das Kopierzeichen ist mehrfach beschrieben');
  assert.ok(JS.includes('var TVZEICHEN'), 'die Zeichen stehen nicht an einer Stelle');
  for (const stelle of ['ZEICHEN_KOPIEREN = TVZEICHEN.kopieren',
    'knopf.innerHTML = TVZEICHEN.kopieren']) {
    assert.ok(JS.includes(stelle), `"${stelle}" fehlt — ein Knopf holt sein Zeichen woanders`);
  }
});

/* Ohne Skript koennte der Knopf nichts ausrichten; dann soll er auch
   nicht im Weg stehen. */
test('der Knopf wird erst vom Skript sichtbar gemacht', () => {
  assert.ok(JS.includes("knopf.removeAttribute('hidden')"),
    'handbuch.js zeigt den Knopf nicht');
});

/* A2: der Balken vor dem ersten Wort ist weg, das Sternchen steht
   hinter dem letzten Glied — ausserhalb der Glieder, damit es nicht
   mitkopiert wird. */
test('ungeprüfte Wege tragen das Sternchen statt des Balkens', () => {
  for (const fassung of B.FASSUNGEN) {
    const tabelle = require(path.join(S.WURZEL, 'assets', 'menue', fassung.sprache + '.js'));
    const T = S.texteVon(fassung.sprache);
    const text = GEBAUT.get(fassung.kennung);
    for (const zeile of wegzeilen(text)) {
      const schluessel = zeile.match(/data-menue="([^"]+)"/)[1];
      const geprueft = tabelle.wege[schluessel].geprueft;
      assert.strictEqual(/class="mw-stern"/.test(zeile), !geprueft,
        `${fassung.kennung}: "${schluessel}" — Sternchen passt nicht zu geprueft: ${geprueft}`);
      if (geprueft) { continue; }
      assert.ok(zeile.includes(`title="${T.menue.ungeprueft}"`),
        `${fassung.kennung}: "${schluessel}" — das Sternchen erklärt sich nicht`);
      /* Hinter dem letzten Glied, nicht davor */
      assert.ok(zeile.indexOf('class="mw-stern"') > zeile.lastIndexOf('class="mw-glied"'),
        `${fassung.kennung}: "${schluessel}" — das Sternchen steht nicht am Ende`);
      /* Und ausserhalb der Glieder */
      assert.ok(!/<span class="mw-glied">[^<]*<sup/.test(zeile),
        `${fassung.kennung}: "${schluessel}" — das Sternchen steckt in einem Glied und würde mitkopiert`);
    }
  }
});

test('am Anfang eines Menüwegs steht kein Balken mehr', () => {
  assert.ok(
    /\.path \.mw\[data-todo\]\{border-left:0;padding-left:0;\}/.test(CSS),
    'der Balken am Pfadanfang ist nicht abgeschaltet'
  );
});

test('der Knopf entfällt im Druck, das Sternchen bleibt', () => {
  const druck = CSS.slice(CSS.indexOf('@media print'));
  assert.ok(/\.mw-kopieren\{display:none !important;\}|,\.mw-kopieren\{display:none !important;\}/.test(druck) ||
    /\.mw-kopieren[^}]*display:none/.test(druck),
  'der Kopierknopf erscheint im Ausdruck');
  assert.ok(!/\.mw-stern[^}]*display:none/.test(druck),
    'das Sternchen fehlt im Ausdruck — ein gedruckter Pfad gäbe Unbelegtes als gesichert aus');
});

/* Unter 600 px eine eigene Zeile, damit der Pfad die volle Breite
   behaelt. */
test('unter 600 px steht der Knopf unter dem Pfad', () => {
  const block = CSS.slice(CSS.indexOf('@media(max-width:599px)'));
  assert.ok(block.length > 0, 'keine Regel für schmale Bildschirme');
  const bis = block.slice(0, block.indexOf('\n}'));
  assert.ok(/\.mw-kopieren\{[\s\S]*position:static/.test(bis),
    'der Knopf bleibt auch schmal absolut positioniert');
  assert.ok(/\.path:has\(\.mw\)\{padding-right:12px;\}/.test(bis),
    'der Pfad bekommt die volle Breite nicht zurück');
});

/* Das Skript baut den Text aus den Gliedern. Nimmt es stattdessen den
   Elementtext, wandert das Sternchen mit in die Zwischenablage. */
test('kopiert wird aus den Gliedern, nicht aus dem Elementtext', () => {
  const block = JS.slice(JS.indexOf('function pfadText'), JS.indexOf('function markiere'));
  assert.ok(block.includes(".querySelectorAll('.mw-glied')"),
    'pfadText liest nicht die Glieder');
  assert.ok(block.includes('\\u00a0'),
    'das geschützte Leerzeichen wird nicht in ein normales umgesetzt');
});

test('der sichtbare Weg wird kopiert, nicht ein verborgener', () => {
  const block = JS.slice(JS.indexOf('function wegZu'), JS.indexOf('function pfadText'));
  assert.ok(block.includes('offsetParent'),
    'wegZu unterscheidet nicht zwischen sichtbarem und verborgenem Weg');
});

/* Nie stillschweigend nichts tun: drei Stufen, jede mit Rueckmeldung. */
test('der Kopierknopf hat eine Rückfallebene', () => {
  const block = JS.slice(JS.indexOf('Kopierknopf an den Menuewegen'));
  for (const stufe of ['navigator.clipboard', 'execCommand', 'markiere(weg)']) {
    assert.ok(block.includes(stufe), `die Stufe "${stufe}" fehlt`);
  }
});
