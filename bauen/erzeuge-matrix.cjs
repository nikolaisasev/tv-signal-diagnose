/* Erzeugt die Diagnosematrizen aus assets/grenzwerte.js.

   Zwei Verwender teilen sich denselben Fragmentbauer:
     dokumentation/diagnosematrix.html  — die ganze Seite, hier geschrieben
     bauen/erzeuge.cjs                  — setzt dasselbe Fragment zwischen
                                          die Markierungen jeder Fassung
                                          <!-- matrix:<art>:anfang --> … ende

   Die Matrix wird nirgends abgeschrieben, sondern aus derselben Datei
   gelesen, die auch der Rechner benutzt — sonst traefe eine geaenderte
   Schwelle auf eine Tabelle, die etwas anderes behauptet.

   Die Beschriftungen kommen aus der Textschicht der jeweiligen
   Fassung. Aus grenzwerte.js stammen nur Zahlen, Kennungen und
   Zustaende — in der Zelle steht die Anzeigebezeichnung, die Kennung
   daneben als data-kennung.

   Aufruf:  node bauen/erzeuge-matrix.cjs   (oder npm run doku)
   Geprueft von tests/dokumentation.test.cjs
*/

const fs = require('node:fs');
const path = require('node:path');

const D = require(path.join(__dirname, '..', 'assets', 'grenzwerte.js'));

/* Die Beschriftungen kommen aus der Textschicht der jeweiligen Fassung.
   Ohne Angabe die deutsche — so bleibt die Dokumentationsseite, wie sie
   ist, und der Seitenbauer reicht die englische durch. */
const texte = (t) => t || require(path.join(__dirname, '..', 'assets', 'texte', 'de.js'));

const RAUSCHKLASSEN = D.RAUSCHKLASSEN;
const PEGELKLASSEN = D.PEGELKLASSEN;
/* Reihenfolge der Befundlegende: vom unauffaelligen zum unklaren Fall */
const ZUSTANDSFOLGE = ['gut', 'grenz', 'fehler', 'unklar'];

/* Minuszeichen als echtes Zeichen, wie im Rechner */
const z = (x) => String(x).replace('-', '−');

/* Bereiche mit beiden Grenzen. Der Rechner nennt die Klasse offen
   ("ab 11 dB"), hier steht das Fenster vollstaendig — in einer Tabelle
   soll ablesbar sein, wo eine Klasse endet. */
function pegelBereich(art, klasse, T) {
  const p = D.GRENZWERTE[art].pegel;
  const obenNormal = p.randOben === null ? p.ueber : p.randOben;
  switch (klasse) {
    case 'P1': return `&lt; ${z(p.unten)}`;
    case 'P2': return `${z(p.unten)} … &lt;${z(p.randUnten)}`;
    case 'P3': return `${z(p.randUnten)} … ${z(obenNormal)}`;
    case 'P4': return p.randOben === null ? null : `&gt;${z(p.randOben)} … ${z(p.ueber)}`;
    default:   return `&gt; ${z(p.ueber)}`;
  }
}
function rauschBereich(art, klasse, T) {
  const r = D.GRENZWERTE[art].rausch;
  switch (klasse) {
    case 'Q0': return T.bereiche.exakt('0', '');
    case 'Q1': return `&lt; ${z(r.min)}`;
    case 'Q2': return `${z(r.min)} … &lt;${z(r.soll)}`;
    case 'Q3': return `${z(r.soll)} … ${z(r.unplausibel)}`;
    default:   return `&gt; ${z(r.unplausibel)}`;
  }
}



/* Lange Kennungen an der Bindestrichstelle umbrechen lassen */
const umbrich = (id) => id.replace('KONFIG-ODER-', 'KONFIG-ODER-<br>');

function kopfzelle(art, qk, T) {
  return `    <th scope="col"><span class="mk-kl">${qk}</span>` +
    `<span class="mk-na">${T.rauschklassen[qk]}</span>` +
    `<span class="mk-br">${rauschBereich(art, qk, T)}</span></th>`;
}

/* Gibt null zurueck, wenn die Klasse es in dieser Empfangsart nicht
   gibt — bei Satellit fehlt P4, weil kein oberer Randbereich definiert
   ist. Das steht in der Bildunterschrift. */
function zeile(art, pk, T) {
  if (!D.MATRIX[art][pk]) { return null; }
  const bereich = pegelBereich(art, pk, T);
  const kopf =
    `    <th scope="row"><span class="mk-kl">${pk}</span>` +
    `<span class="mk-na">${T.pegelklassen[pk]}</span>` +
    (bereich ? `<span class="mk-br">${bereich}</span>` : '') + '</th>';

  /* In der Zelle steht die Anzeigebezeichnung der Fassung, die Kennung
     bleibt als Attribut daneben — die Tests pruefen ueber sie weiter. */
  const zellen = RAUSCHKLASSEN.map((qk) => {
    const id = D.MATRIX[art][pk][qk];
    return `    <td class="mk-${D.ZUSTAND[id]}" data-kennung="${id}">` +
      `${umbrich(T.diagnosen[id].anzeige)}</td>`;
  });
  return [kopf, ...zellen].join('\n');
}

/* Welche Kennungen in dieser Matrix vorkommen, sortiert nach Zustand
   und darin alphabetisch. */
function kennungen(art) {
  const drin = new Set();
  for (const pk of Object.keys(D.MATRIX[art])) {
    for (const qk of RAUSCHKLASSEN) { drin.add(D.MATRIX[art][pk][qk]); }
  }
  return [...drin].sort((a, b) => {
    const ra = ZUSTANDSFOLGE.indexOf(D.ZUSTAND[a]);
    const rb = ZUSTANDSFOLGE.indexOf(D.ZUSTAND[b]);
    return ra !== rb ? ra - rb : a.localeCompare(b, 'de');
  });
}

/* Die Zellen tragen Kennungen. Wer einen Messwert nachschlaegt, soll
   nicht mit einem Kuerzel dastehen — die Legende loest jede Kennung mit
   dem Befundsatz aus grenzwerte.js auf, derselben Quelle wie die Matrix. */
function befundlegende(art, T) {
  const zeilen = kennungen(art).map((id) => {
    const d = T.diagnosen[id];
    return `          <dt class="mk-${D.ZUSTAND[id]}" data-kennung="${id}">${d.anzeige}</dt>\n` +
      `          <dd>${d.befund}</dd>`;
  });
  return `      <details class="legende-aus">
        <summary>${T.matrix.legendeZeigen}</summary>
        <dl class="mk-befunde">
${zeilen.join('\n')}
        </dl>
      </details>`;
}

function zustandslegende(T) {
  const z = T.matrix.zustaende;
  return `      <p class="mk-legende">
        <span><i class="mk-gut"></i>${z.gut}</span>
        <span><i class="mk-grenz"></i>${z.grenz}</span>
        <span><i class="mk-fehler"></i>${z.fehler}</span>
        <span><i class="mk-unklar"></i>${z.unklar}</span>
      </p>`;
}

/* ---------- Fragment: alles ausser der Ueberschrift ----------
   index.html fuehrt eine h3-Ebene, die Dokumentationsseite eine h2.
   Deshalb bringt der Bauer keine eigene Ueberschrift mit. */
function fragment(art, t) {
  const T = texte(t);
  const g = D.GRENZWERTE[art];
  const f = T.arten[art];
  const unterzeile = T.matrix.quelle(
    f.pegel, g.pegel.einheit, z(g.pegel.von), z(g.pegel.bis),
    f.rauschKurz, g.rausch.einheit, z(g.rausch.von), z(g.rausch.bis));
  const bildunterschrift = g.pegel.randOben === null ? T.matrix.keinOberrand : '';
  const zeilen = PEGELKLASSEN
    .map((pk) => zeile(art, pk, T))
    .filter((x) => x !== null)
    .map((x) => `  <tr>\n${x}\n  </tr>`);

  return `      <p class="mk-quelle">${unterzeile}</p>
      <div class="tw"><table class="matrixtabelle">
${bildunterschrift ? `  <caption>${bildunterschrift}</caption>\n` : ''}  <tr>
    <th class="mk-ecke"></th>
${RAUSCHKLASSEN.map((qk) => kopfzelle(art, qk, T)).join('\n')}
  </tr>
${zeilen.join('\n')}
      </table></div>
${zustandslegende(T)}
${befundlegende(art, T)}`;
}

/* ---------- Dokumentationsseite ---------- */
function dokuSeite(t) {
  const T = texte(t);
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Arbeitsunterlage: nicht in Suchmaschinen aufnehmen -->
<meta name="robots" content="noindex, nofollow">
<title>${T.matrix.seitentitel} — TV-Diagnose</title>
<link rel="stylesheet" href="../assets/stil.css">
<link rel="stylesheet" href="matrix.css">
</head>
<body>

<main class="fall">
<div class="shell">
  <div class="track-body">
    <h1 class="track-title">${T.matrix.seitentitel}</h1>
    <p class="mk-sub">${T.matrix.seitenzeile}</p>

    <section class="sec">
      <h2>${T.matrix.ueberschrift.sat}</h2>
${fragment('sat', T)}

      <h2>${T.matrix.ueberschrift.kabel}</h2>
${fragment('kabel', T)}

      <p class="mk-quelle mk-fuss">${T.matrix.fusszeile}<code>npm run doku</code></p>
    </section>
  </div>
</div>
</main>

</body>
</html>
`;
}

/* ---------- Bloecke in einer Quelldatei ----------
   Ersetzt ausschliesslich den Inhalt zwischen den Markierungen. Fehlt
   eine oder steht das Paar verkehrt herum, wird nichts geschrieben:
   stilles Ueberspringen waere die gefaehrlichere Variante, weil die
   Seite dann unbemerkt veraltete Zahlen zeigte.

   `name` steht nur in den Fehlermeldungen — seit es vier Fassungen
   gibt, muss dort stehen, welche Datei gemeint ist. */
function setzeBloecke(quelle, name = 'die Quelldatei', t) {
  let s = quelle;
  for (const art of Object.keys(D.MATRIX)) {
    const anfang = `<!-- matrix:${art}:anfang -->`;
    const ende = `<!-- matrix:${art}:ende -->`;
    const a = s.indexOf(anfang);
    const b = s.indexOf(ende);
    if (a < 0) { throw new Error(`Markierung fehlt in ${name}: ${anfang}`); }
    if (b < 0) { throw new Error(`Markierung fehlt in ${name}: ${ende}`); }
    if (b < a) { throw new Error(`Markierungen vertauscht in ${name}: ${ende} steht vor ${anfang}`); }
    if (s.indexOf(anfang, a + 1) >= 0) { throw new Error(`Markierung doppelt in ${name}: ${anfang}`); }
    s = s.slice(0, a + anfang.length) + '\n' + fragment(art, t) + '\n      ' + s.slice(b);
  }
  return s;
}

/* ---------- Schreiben ---------- */
const dokuZiel = path.join(__dirname, '..', 'dokumentation', 'diagnosematrix.html');

if (require.main === module) {
  fs.writeFileSync(dokuZiel, dokuSeite(), 'utf8');
  const rel = (p) => path.relative(path.join(__dirname, '..'), p);
  process.stdout.write('geschrieben: ' + rel(dokuZiel) + '\n');
}

module.exports = {
  fragment, dokuSeite, setzeBloecke,
  kennungen, dokuZiel,
  get html() { return dokuSeite(); }
};
