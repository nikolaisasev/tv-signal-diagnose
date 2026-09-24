/* ============================================================
   Erzeugt die Markt- und Sprachfassungen
   ------------------------------------------------------------
   Aus zwei Quelldateien und drei Datendateien entstehen vier
   fertige Seiten:

     quelle/de.html  +  assets/markt/de.js  ->  de-DE/index.html
     quelle/de.html  +  assets/markt/at.js  ->  de-AT/index.html
     quelle/de.html  +  assets/markt/ch.js  ->  de-CH/index.html
     quelle/en.html  +  assets/markt/de.js  ->  en-DE/index.html

   Drei Schichten, die sich nicht vermischen: die Physik steht in
   grenzwerte.js, die Landestatsachen in assets/markt/, die
   Menuewege in assets/menue/ und der Fliesstext in quelle/.
   Eine Tatsache steht damit an genau einer Stelle.

   Zwei Einsetzverfahren:

     Block  <!-- markt:transponder:anfang --> … :ende
            und <!-- matrix:sat:anfang --> … :ende
            Der Inhalt dazwischen wird ersetzt.

     Wert   <span data-markt="satellit">Astra 19,2° Ost</span>
            <span data-menue="signalwerte">Alle Einstellungen → …</span>
            Der sichtbare Text bleibt in der Quelle stehen, damit
            sie ohne Generator lesbar und im Browser benutzbar
            ist. Beim Bauen wird er ersetzt.

   Die Menuesprache folgt der Sprache der Fassung: wer die englische
   Fassung waehlt, bekommt auch die englischen Menuewege. Einen
   eigenen Schalter dafuer gibt es nicht.

   Aufruf:  node bauen/erzeuge.cjs   (oder npm run bauen)
   Geprueft von tests/erzeugt.test.cjs und tests/sprachen.test.cjs
   ============================================================ */

const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const MATRIX = require(path.join(__dirname, 'erzeuge-matrix.cjs'));

const lies = (...teile) => fs.readFileSync(path.join(WURZEL, ...teile), 'utf8');
const daten = (...teile) => require(path.join(WURZEL, ...teile));

/* ---------- Welche Fassungen es gibt ----------
   Die Kennung folgt BCP 47: Sprache klein, Markt gross. Weitere
   Fassungen brauchen nur eine Zeile mehr — fr-CH oder it-CH
   ergaenzen hier, die Quelldatei dazu anlegen, fertig. */
const FASSUNGEN = [
  { kennung: 'de-DE', sprache: 'de', markt: 'de' },
  { kennung: 'de-AT', sprache: 'de', markt: 'at' },
  { kennung: 'de-CH', sprache: 'de', markt: 'ch' },
  { kennung: 'en-DE', sprache: 'en', markt: 'de' }
];

const MENUESPRACHEN = ['de', 'en'];

const KOPF = (fassung) =>
  '<!-- Erzeugt von bauen/erzeuge.cjs — nicht von Hand bearbeiten.\n' +
  '     Quelle: quelle/' + fassung.sprache + '.html\n' +
  '     Markt:  assets/markt/' + fassung.markt + '.js\n' +
  '     Neu erzeugen mit: npm run bauen -->\n';

/* ---------- kleine Helfer ---------- */
const schuetze = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Ein Markierungspaar ersetzen. Wie beim Matrixbauer: fehlt eine
   Markierung oder steht das Paar verkehrt herum, bricht der Lauf ab
   und es wird nichts geschrieben. Eine halb ersetzte Seite waere
   schlimmer als gar keine. */
function setzeBlock(quelle, raum, schluessel, inhalt, name) {
  const anfang = `<!-- ${raum}:${schluessel}:anfang -->`;
  const ende = `<!-- ${raum}:${schluessel}:ende -->`;
  const a = quelle.indexOf(anfang);
  const b = quelle.indexOf(ende);
  if (a < 0) { throw new Error(`Markierung fehlt in ${name}: ${anfang}`); }
  if (b < 0) { throw new Error(`Markierung fehlt in ${name}: ${ende}`); }
  if (b < a) { throw new Error(`Markierungen vertauscht in ${name}: ${ende} steht vor ${anfang}`); }
  if (quelle.indexOf(anfang, a + 1) >= 0) { throw new Error(`Markierung doppelt in ${name}: ${anfang}`); }
  return quelle.slice(0, a + anfang.length) + inhalt + quelle.slice(b);
}

/* ---------- data-Werte ersetzen ----------
   Sucht das Element mit dem Attribut und tauscht seinen Inhalt.
   Verschachtelte Elemente kaemen hier nicht durch; die Werte sind
   aber durchweg kurze Angaben ohne eigenes Markup, und der Test
   faellt auf, sobald das nicht mehr stimmt. */
function setzeWerte(quelle, attribut, hole, name) {
  const muster = new RegExp(
    '(<([a-z0-9]+)([^>]*\\s' + attribut + '="([^"]+)"[^>]*)>)([^<]*)(</\\2>)', 'gi');
  let getroffen = 0;
  const ergebnis = quelle.replace(muster, (alles, auf, tag, attr, schluessel, inhalt, zu) => {
    const neu = hole(schluessel, inhalt, name);
    getroffen++;
    return auf + neu + zu;
  });
  return { text: ergebnis, getroffen };
}

/* ---------- Marktwerte ----------
   Ein Eigenname ist in jeder Sprache derselbe; ein Begriff hat je
   Seitensprache einen eigenen Wert. Die Art steht am Schluessel, damit
   sie nicht erraten werden muss. */
function marktwert(markt, schluessel, fassung, name) {
  const eintrag = markt.werte[schluessel];
  if (!eintrag) {
    throw new Error(`Marktangabe "${schluessel}" fehlt in assets/markt/${markt.kennung}.js (gebraucht von ${name})`);
  }
  if (!eintrag.art) {
    throw new Error(`Marktangabe "${schluessel}" in assets/markt/${markt.kennung}.js hat keine Art`);
  }
  if (eintrag.art === 'name') { return eintrag.wert; }
  const wert = eintrag[fassung.sprache];
  if (wert === undefined) {
    throw new Error(`Begriff "${schluessel}" in assets/markt/${markt.kennung}.js fehlt für ${fassung.sprache}`);
  }
  return wert;
}

/* ---------- Menuewege ----------
   Die Menuesprache folgt der Sprache der Fassung: die deutschen
   Fassungen zeigen den deutschen Weg, die englische den englischen.
   Es gibt dafuer keinen Schalter mehr — wer die englische Fassung
   waehlt, waehlt damit auch das englische Geraetemenue.

   Ein ungepruefter englischer Weg behaelt den deutschen Text und
   traegt data-todo: eine erfundene Uebersetzung waere am Geraet nicht
   auffindbar und damit schaedlicher als der Originalweg. */
function menueMarkup(schluessel, sprache, name) {
  const tabelle = daten('assets', 'menue', sprache + '.js');
  const T = daten('assets', 'texte', sprache + '.js');
  const weg = tabelle.wege[schluessel];
  if (!weg) {
    throw new Error(`Menueweg "${schluessel}" fehlt in assets/menue/${sprache}.js (gebraucht von ${name})`);
  }

  /* Ungeprueft heisst: gezeigt, aber gekennzeichnet. Frueher stand dafuer
     ein Balken am linken Rand — der sass unmittelbar vor dem ersten Wort
     und stoerte das Bild. Jetzt ein hochgestelltes Sternchen am Ende.
     Es steht ausserhalb der Glieder und wird deshalb nicht mitkopiert. */
  const todo = weg.geprueft ? '' : ' data-todo="Menuebezeichnung nicht belegt"';
  const stern = weg.geprueft ? ''
    : `<sup class="mw-stern" role="note" title="${schuetze(T.menue.ungeprueft)}"` +
      ` aria-label="${schuetze(T.menue.ungeprueft)}">*</sup>`;

  /* Der Knopf gehoert in den Kasten, nicht in den Pfadtext: der Text
     bekommt rechts Innenabstand, damit er nie darunter laeuft.

     Er traegt ein Zeichen, kein Wort — dasselbe wie am Messwert des
     Rechners. Das Zeichen setzt handbuch.js ein, und erst dann wird
     der Knopf sichtbar: ohne Skript koennte er nichts ausrichten.
     Was er tut, sagt das aria-label aus der Textschicht. */
  return `<span class="mw"${todo}>${glieder(weg.text)}${stern}</span>` +
    `<button type="button" class="mw-kopieren" hidden` +
    ` aria-label="${schuetze(T.menue.kopierenLang)}"` +
    ` title="${schuetze(T.menue.kopierenLang)}"></button>` +
    `<span class="mw-status" role="status" aria-live="polite"></span>`;
}

/* Ein einzelner Menuepunkt im Fliesstext. Dieselbe Quelle wie die
   Wege — sonst stuende "Benutzer" im Satz, waehrend der Pfad daneben
   "User" sagt. */
function menuepunkt(schluessel, sprache, name) {
  const tabelle = daten('assets', 'menue', sprache + '.js');
  const punkt = tabelle.punkte[schluessel];
  if (!punkt) {
    throw new Error(`Menuepunkt "${schluessel}" fehlt in assets/menue/${sprache}.js (gebraucht von ${name})`);
  }
  const todo = punkt.geprueft ? '' : ' data-todo="Menuebezeichnung nicht belegt"';
  return `<span class="mp"${todo}>${schuetze(punkt.text)}</span>`;
}

/* Ein Menueweg wird an den Pfeilen zerlegt. Jedes Glied bleibt
   zusammen, umbrochen wird zwischen den Gliedern — so steht ein
   Menuepunkt wie "Programme Tuning (Programme Tuning & Settings)" nie
   halb in der einen und halb in der naechsten Zeile.

   Passt ein Glied trotzdem nicht in die Zeile, darf es innerhalb
   umbrechen: ein abgeschnittener Weg ist unbrauchbar. Das regelt das
   Stylesheet. */
function glieder(text) {
  const teile = text.split(' → ');
  return teile.map((teil, i) => {
    /* Der Pfeil gehoert an das Ende seines Glieds, durch ein geschuetztes
       Leerzeichen daran gebunden. Umbrochen wird dann nur zwischen den
       Gliedern — also hinter einem Pfeil, nie davor und nie mitten in
       einem Menuepunkt. */
    const pfeil = i < teile.length - 1
      ? '&nbsp;<span class="mw-pfeil">→</span>' : '';
    return `<span class="mw-glied">${schuetze(teil)}${pfeil}</span>`;
  }).join(' ');
}

/* ---------- Fassungswaehler ----------
   Ein Element: geschlossen nennt es die Kennung der offenen Fassung,
   geoeffnet bietet es die anderen an. Gebaut aus details und summary,
   ohne Skript.

   Am Knopf steht nur die Kennung. Sprache und Markt dazu stuenden
   zweimal da — in der Auswahl nennt sie die Zeile darunter — und der
   Knopf draengte die Ueberschrift in eine zweite Zeile.

   Die Liste nennt stets alle erzeugten Fassungen. Eine Beschraenkung
   auf denselben Markt haette bedeutet, dass man von de-CH aus gar
   nicht nach en-DE kommt. */
const TEXTE = {
  de: { gruppeFassung: 'Fassung', jetzt: 'aktuell', knopf: 'Fassung wählen' },
  en: { gruppeFassung: 'Version', jetzt: 'current', knopf: 'Choose version' }
};

/* Sprache und Markt einer Fassung, in der Sprache der lesenden Seite */
function fassungWas(ziel, sprache) {
  const wort = { de: 'Deutsch', en: 'English' }[ziel.sprache];
  const land = {
    de: { de: 'Deutschland', at: 'Österreich', ch: 'Schweiz' },
    en: { de: 'Germany', at: 'Austria', ch: 'Switzerland' }
  }[sprache][ziel.markt];
  return `${wort} · ${land}`;
}

function schalterFassung(fassung) {
  const t = TEXTE[fassung.sprache];

  const eintraege = FASSUNGEN.map((ziel) => {
    const was = `<span class="fw-was">${fassungWas(ziel, fassung.sprache)}</span>`;
    if (ziel.kennung === fassung.kennung) {
      return `          <li class="fw-jetzt"><span class="fw-kennung">${ziel.kennung}</span>${was}` +
        `<span class="fw-marke">${t.jetzt}</span></li>`;
    }
    return `          <li><a href="../${ziel.kennung}/index.html" hreflang="${ziel.sprache}">` +
      `<span class="fw-kennung">${ziel.kennung}</span>${was}</a></li>`;
  }).join('\n');

  return `
      <details class="fw">
        <summary aria-label="${t.knopf} — ${fassung.kennung}, ${fassungWas(fassung, fassung.sprache)}">
          <span class="fw-stand"><span class="fw-kennung">${fassung.kennung}</span></span>
          <span class="fw-pfeil" aria-hidden="true">▾</span>
        </summary>
        <div class="fw-inhalt">
          <p class="fw-gruppe">${t.gruppeFassung}</p>
          <ul class="fw-liste">
${eintraege}
          </ul>
        </div>
      </details>
      `;
}

/* ---------- eine Fassung bauen ---------- */
function baue(fassung) {
  const name = fassung.kennung;
  const markt = daten('assets', 'markt', fassung.markt + '.js');
  let s = lies('quelle', fassung.sprache + '.html');

  /* Matrix zuerst: sie bringt eigene Markierungen mit. Die
     Beschriftungen kommen aus der Textschicht dieser Fassung. */
  const texte = daten("assets", "texte", fassung.sprache + ".js");
  s = MATRIX.setzeBloecke(s, name, texte);

  /* Marktbloecke */
  for (const [schluessel, zeilen] of Object.entries(markt.bloecke)) {
    const inhalt = '\n' + zeilen
      .map((z) => `      <span class="path">${schuetze(z)}</span>`)
      .join('\n') + '\n      ';
    s = setzeBlock(s, 'markt', schluessel, inhalt, name);
  }

  /* Marktwerte */
  const m = setzeWerte(s, 'data-markt',
    (schluessel) => schuetze(marktwert(markt, schluessel, fassung, name)), name);
  s = m.text;

  /* Menuewege und einzelne Menuepunkte */
  const w = setzeWerte(s, 'data-menue',
    (schluessel) => menueMarkup(schluessel, fassung.sprache, name), name);
  s = w.text;

  const mp = setzeWerte(s, 'data-menuepunkt',
    (schluessel) => menuepunkt(schluessel, fassung.sprache, name), name);
  s = mp.text;

  /* Fassungswaehler */
  s = setzeBlock(s, 'schalter', 'fassung', schalterFassung(fassung), name);

  /* Kopfzeile mit dem Hinweis, dass hier nichts von Hand geaendert wird */
  s = s.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + KOPF(fassung));

  return s;
}

/* ---------- alle Fassungen ---------- */
function alleFassungen() {
  const ergebnis = new Map();
  for (const fassung of FASSUNGEN) {
    ergebnis.set(fassung.kennung, baue(fassung));
  }
  return ergebnis;
}

function zielDatei(kennung) {
  return path.join(WURZEL, kennung, 'index.html');
}

if (require.main === module) {
  /* Erst alles bilden, dann schreiben. Bricht eine Fassung ab,
     bleibt keine der vorherigen halb erneuert zurueck. */
  const gebaut = alleFassungen();
  for (const [kennung, inhalt] of gebaut) {
    fs.mkdirSync(path.join(WURZEL, kennung), { recursive: true });
    fs.writeFileSync(zielDatei(kennung), inhalt, 'utf8');
  }
  process.stdout.write('geschrieben: ' +
    [...gebaut.keys()].map((k) => k + '/index.html').join(', ') + '\n');
}

module.exports = { FASSUNGEN, MENUESPRACHEN, baue, alleFassungen, zielDatei };
