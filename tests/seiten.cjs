/* Sammelstelle fuer die Dateien, die es seit dem Umbau mehrfach gibt.

   Vorher lag alles in index.html, und jeder Test las diese eine Datei.
   Jetzt gibt es zwei Quellen und vier erzeugte Fassungen. Ein Test, der
   nur eine davon prueft, uebersieht drei. Deshalb holen sich alle Tests
   ihre Dateiliste hier. Kommt eine Fassung hinzu, erscheint sie von
   selbst in jedem Test — die Liste steht in bauen/erzeuge.cjs. */

const path = require('node:path');
const fs = require('node:fs');

const WURZEL = path.join(__dirname, '..');
const { FASSUNGEN } = require(path.join(WURZEL, 'bauen', 'erzeuge.cjs'));

const lies = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');

/* [Name, Inhalt] — der Name steht in den Fehlermeldungen */
const QUELLEN = [...new Set(FASSUNGEN.map((f) => f.sprache))]
  .map((s) => [`quelle/${s}.html`, lies(`quelle/${s}.html`)]);

const ERZEUGT = FASSUNGEN
  .map((f) => [`${f.kennung}/index.html`, lies(`${f.kennung}/index.html`)]);

const ALLE = [...QUELLEN, ...ERZEUGT];

/* Sichtbarer Text ohne Auszeichnung. Menuewege stehen seit 6.2 in
   Gliedern; wer den Weg als Ganzes sucht, braucht ihn zusammengesetzt. */
const nurText = (html) => html
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ');

/* Die Textschicht einer Fassung */
const texteVon = (sprache) =>
  require(path.join(WURZEL, 'assets', 'texte', sprache + '.js'));

module.exports = { WURZEL, lies, QUELLEN, ERZEUGT, ALLE, FASSUNGEN, nurText, texteVon };
