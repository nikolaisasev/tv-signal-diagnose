/* Erzeugt dokumentation/diagnosematrix.html aus assets/grenzwerte.js.

   Die Matrix wird nicht abgeschrieben, sondern aus derselben Datei
   gelesen, die auch der Rechner benutzt. Damit kann die Dokumentation
   nicht vom Code abdriften — genau der Fehler, gegen den die uebrige
   Testsuite dieses Projekts gebaut ist.

   Aufruf:  node dokumentation/erzeuge-matrix.cjs
   Geprueft von tests/dokumentation.test.cjs
*/

const fs = require('node:fs');
const path = require('node:path');

const D = require(path.join(__dirname, '..', 'assets', 'grenzwerte.js'));

const RAUSCHKLASSEN = ['Q0', 'Q1', 'Q2', 'Q3', 'Q4'];
const PEGELKLASSEN = ['P1', 'P2', 'P3', 'P4', 'P5'];

/* Minuszeichen als echtes Zeichen, wie im Rechner */
const z = (x) => String(x).replace('-', '−');

/* Bereiche mit beiden Grenzen. Der Rechner nennt die Klasse offen
   ("ab 11 dB"), hier steht das Fenster vollstaendig — in einer Tabelle
   soll ablesbar sein, wo eine Klasse endet. */
function pegelBereich(art, klasse) {
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
function rauschBereich(art, klasse) {
  const r = D.GRENZWERTE[art].rausch;
  switch (klasse) {
    case 'Q0': return 'exakt 0';
    case 'Q1': return `&lt; ${z(r.min)}`;
    case 'Q2': return `${z(r.min)} … &lt;${z(r.soll)}`;
    case 'Q3': return `${z(r.soll)} … ${z(r.unplausibel)}`;
    default:   return `&gt; ${z(r.unplausibel)}`;
  }
}

const NAMEN_P = D.PEGELKLASSEN;
const NAMEN_Q = D.RAUSCHKLASSEN;

function kopfzelle(art, qk) {
  return `    <th scope="col"><span class="mk-kl">${qk}</span>` +
    `<span class="mk-na">${NAMEN_Q[qk]}</span>` +
    `<span class="mk-br">${rauschBereich(art, qk)}</span></th>`;
}

/* Gibt null zurueck, wenn die Klasse es in dieser Empfangsart nicht
   gibt — bei Satellit fehlt P4, weil kein oberer Randbereich definiert
   ist. Das steht in der Bildunterschrift; eine leere Zeile dafuer
   brauchte es nicht. */
function zeile(art, pk) {
  if (!D.MATRIX[art][pk]) { return null; }
  const bereich = pegelBereich(art, pk);
  const kopf =
    `    <th scope="row"><span class="mk-kl">${pk}</span>` +
    `<span class="mk-na">${NAMEN_P[pk]}</span>` +
    (bereich ? `<span class="mk-br">${bereich}</span>` : '') + '</th>';

  const zellen = RAUSCHKLASSEN.map((qk) => {
    const id = D.MATRIX[art][pk][qk];
    const zustand = D.DIAGNOSEN[id].zustand;
    /* Lange Kennungen an der Bindestrichstelle umbrechen lassen */
    const text = id.replace('KONFIG-ODER-', 'KONFIG-ODER-<br>');
    return `    <td class="mk-${zustand}">${text}</td>`;
  });
  return [kopf, ...zellen].join('\n');
}

function tabelle(art, ueberschrift, unterzeile, bildunterschrift) {
  const zeilen = PEGELKLASSEN
    .map((pk) => zeile(art, pk))
    .filter((x) => x !== null)
    .map((x) => `  <tr>\n${x}\n  </tr>`);
  return `      <h2>${ueberschrift}</h2>
      <p class="mk-quelle">${unterzeile}</p>
      <div class="tw"><table class="matrixtabelle">
${bildunterschrift ? `  <caption>${bildunterschrift}</caption>\n` : ''}  <tr>
    <th class="mk-ecke"></th>
${RAUSCHKLASSEN.map((qk) => kopfzelle(art, qk)).join('\n')}
  </tr>
${zeilen.join('\n')}
      </table></div>`;
}

const sat = D.GRENZWERTE.sat;
const kabel = D.GRENZWERTE.kabel;

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Arbeitsunterlage: nicht in Suchmaschinen aufnehmen -->
<meta name="robots" content="noindex, nofollow">
<title>Diagnosematrix — TV-Diagnose</title>
<link rel="stylesheet" href="../assets/stil.css">
<link rel="stylesheet" href="matrix.css">
</head>
<body>

<main class="fall">
<div class="shell">
  <div class="track-body">
    <h1 class="track-title">Diagnosematrix</h1>
    <p class="mk-sub">Zeile = Pegelklasse · Spalte = Rauschabstandsklasse · Zelle = Befund</p>

    <section class="sec">
${tabelle('sat', 'Satellit · DVB-S/S2',
  `Pegel in dBm, Messbereich ${z(sat.pegel.von)} … ${z(sat.pegel.bis)} · ` +
  `SNR in dB, Messbereich ${z(sat.rausch.von)} … ${z(sat.rausch.bis)}`,
  'Kein oberer Randbereich definiert, deshalb entfällt P4')}

${tabelle('kabel', 'Kabel · DVB-C, 256QAM',
  `Pegel in dBµV, Messbereich ${z(kabel.pegel.von)} … ${z(kabel.pegel.bis)} · ` +
  `MER in dB, Messbereich ${z(kabel.rausch.von)} … ${z(kabel.rausch.bis)}`,
  '')}

      <p class="mk-legende">
        <span><i class="mk-gut"></i>gut</span>
        <span><i class="mk-grenz"></i>grenz</span>
        <span><i class="mk-fehler"></i>fehler</span>
        <span><i class="mk-unklar"></i>unklar</span>
      </p>

      <p class="mk-quelle mk-fuss">Erzeugt aus assets/grenzwerte.js · <code>node dokumentation/erzeuge-matrix.cjs</code></p>
    </section>
  </div>
</div>
</main>

</body>
</html>
`;

const ziel = path.join(__dirname, 'diagnosematrix.html');
if (require.main === module) {
  fs.writeFileSync(ziel, html, 'utf8');
  process.stdout.write('geschrieben: ' + path.relative(process.cwd(), ziel) + '\n');
}

module.exports = { html, ziel };
