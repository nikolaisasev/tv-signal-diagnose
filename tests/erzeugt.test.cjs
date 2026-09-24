/* Haelt die erzeugten Fassungen am Generator fest.

   Die vier Fassungen liegen fertig im Repository, damit man sie ohne
   Werkzeug oeffnen kann. Genau daraus entsteht die Gefahr: Wer eine
   Quelle oder eine Datendatei aendert und npm run bauen nicht laufen
   laesst, gibt eine Seite weiter, die etwas anderes zeigt als die
   Quelle sagt. Und wer eine erzeugte Datei von Hand bessert, verliert
   die Aenderung beim naechsten Lauf.

   Beides faengt dieser Test ab, ohne selbst zu schreiben. */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const S = require(path.join(__dirname, 'seiten.cjs'));
const B = require(path.join(S.WURZEL, 'bauen', 'erzeuge.cjs'));

const GEBAUT = B.alleFassungen();

test('jede erzeugte Fassung entspricht der Ausgabe des Generators', () => {
  for (const [datei, text] of S.ERZEUGT) {
    const kennung = datei.split('/')[0];
    assert.strictEqual(
      text, GEBAUT.get(kennung),
      `${datei} ist nicht mehr aktuell. Neu erzeugen mit: npm run bauen`
    );
  }
});

test('ein zweiter Lauf ohne Quelländerung ergibt dasselbe', () => {
  const nochmal = B.alleFassungen();
  for (const [kennung, text] of GEBAUT) {
    assert.strictEqual(
      nochmal.get(kennung), text,
      `${kennung}: zwei Läufe hintereinander liefern verschiedenes Ergebnis`
    );
  }
});

test('jede Fassung trägt den Hinweis, dass sie erzeugt ist', () => {
  for (const [datei, text] of S.ERZEUGT) {
    assert.ok(
      text.includes('nicht von Hand bearbeiten'),
      `${datei}: der Hinweis am Kopf fehlt`
    );
    assert.ok(
      text.includes('npm run bauen'),
      `${datei}: der Kopf sagt nicht, wie neu erzeugt wird`
    );
  }
});

/* Ein Platzhalter, der stehen blieb, ist schlimmer als ein Fehler beim
   Bauen: die Seite sieht fertig aus und zeigt trotzdem die Quelle. */
test('keine erzeugte Fassung enthält einen nicht ersetzten Platzhalter', () => {
  for (const [datei, text] of S.ERZEUGT) {
    assert.ok(!text.includes('{{'), `${datei}: unersetzter Platzhalter {{…}}`);

    /* Leeres Markierungspaar heisst: der Block wurde nicht gefüllt. */
    for (const m of text.matchAll(/<!-- (markt|matrix|schalter):([a-zA-Z]+):anfang -->(\s*)<!-- \1:\2:ende -->/g)) {
      assert.fail(`${datei}: Block ${m[1]}:${m[2]} ist leer geblieben`);
    }
  }
});

/* Die Menuesprache ist die Sprache der Fassung. Frueher standen beide
   im Markup und ein Schalter tauschte sie; das ist weg. Steht der Weg
   einer anderen Sprache in der Datei, stimmt die Zuordnung nicht mehr. */
test('jeder Menüweg steht in der Sprache seiner Fassung', () => {
  for (const fassung of B.FASSUNGEN) {
    const text = GEBAUT.get(fassung.kennung);
    const tabelle = require(path.join(S.WURZEL, 'assets', 'menue', fassung.sprache + '.js'));
    /* Ein Weg steht auf genau einer Zeile; seine Glieder sind eigene
       Elemente, deshalb zeilenweise statt Element für Element. */
    const traeger = text.split('\n')
      .filter((z) => z.includes('data-menue='))
      .map((z) => [z.match(/data-menue="([^"]+)"/)[1], z]);
    assert.ok(traeger.length > 0, `${fassung.kennung}: kein Menüweg gefunden`);
    for (const [schluessel, inhalt] of traeger) {
      assert.ok(S.nurText(inhalt).includes(tabelle.wege[schluessel].text),
        `${fassung.kennung}: Menüweg "${schluessel}" ist nicht der aus menue/${fassung.sprache}.js`);
      assert.strictEqual((inhalt.match(/class="mw"/g) || []).length, 1,
        `${fassung.kennung}: Menüweg "${schluessel}" steht mehrfach im Markup`);
      /* Jedes Glied ein eigenes Element — sonst bricht der Weg mitten
         in einem Menuepunkt um oder wird abgeschnitten. */
      const teile = tabelle.wege[schluessel].text.split(' → ');
      assert.strictEqual((inhalt.match(/class="mw-glied"/g) || []).length, teile.length,
        `${fassung.kennung}: "${schluessel}" ist nicht in ${teile.length} Glieder zerlegt`);
    }
  }
});

/* A4: ein Menuepunkt im Fliesstext kommt aus derselben Quelle wie die
   Wege. Sonst steht "Benutzer" im Satz und "User" im Pfad daneben. */
test('jeder Menüpunkt im Fließtext steht in der Sprache seiner Fassung', () => {
  for (const fassung of B.FASSUNGEN) {
    const text = GEBAUT.get(fassung.kennung);
    const tabelle = require(path.join(S.WURZEL, 'assets', 'menue', fassung.sprache + '.js'));
    const treffer = [...text.matchAll(/data-menuepunkt="([^"]+)"[^>]*><span class="mp"[^>]*>([^<]*)</g)];
    assert.ok(treffer.length > 0, `${fassung.kennung}: kein Menüpunkt gefunden`);
    for (const [, schluessel, wortlaut] of treffer) {
      assert.strictEqual(wortlaut, tabelle.punkte[schluessel].text,
        `${fassung.kennung}: Menüpunkt "${schluessel}" zeigt "${wortlaut}"`);
    }
  }
});

/* A1: ungepruefte Bezeichnungen werden gezeigt, nicht ersetzt — aber
   markiert. */
test('ein ungeprüfter Menüweg erscheint englisch und trägt data-todo', () => {
  const en = require(path.join(S.WURZEL, 'assets', 'menue', 'en.js'));
  const text = GEBAUT.get(B.FASSUNGEN.find((f) => f.sprache === 'en').kennung);
  for (const [schluessel, weg] of Object.entries(en.wege)) {
    const zeile = text.split('\n').find((z) => z.includes(`data-menue="${schluessel}"`));
    assert.ok(zeile, `Menüweg "${schluessel}" fehlt in der englischen Fassung`);
    assert.ok(S.nurText(zeile).includes(weg.text),
      `"${schluessel}": die englische Fassung zeigt nicht den englischen Weg`);
    assert.strictEqual(/data-todo/.test(zeile), !weg.geprueft,
      `"${schluessel}": Markierung passt nicht zu geprueft: ${weg.geprueft}`);
  }
});

test('keine Fassung trägt einen Umschalter für die Menüsprache', () => {
  for (const [datei, text] of S.ERZEUGT) {
    for (const rest of ['tvm-de', 'tvm-en', 'name="tvmenue"', 'mw-de', 'mw-en']) {
      assert.ok(!text.includes(rest),
        `${datei}: Rest des alten Menüsprach-Umschalters — ${rest}`);
    }
  }
});

test('die Marktangaben stehen so in der Fassung wie in der Marktdatei', () => {
  for (const fassung of B.FASSUNGEN) {
    const markt = require(path.join(S.WURZEL, 'assets', 'markt', fassung.markt + '.js'));
    const text = GEBAUT.get(fassung.kennung);
    for (const m of text.matchAll(/data-markt="([^"]+)"[^>]*>([^<]*)</g)) {
      const eintrag = markt.werte[m[1]];
      const erwartet = eintrag.art === 'name' ? eintrag.wert : eintrag[fassung.sprache];
      assert.strictEqual(
        m[2], erwartet,
        `${fassung.kennung}: "${m[1]}" zeigt "${m[2]}", ` +
        `assets/markt/${fassung.markt}.js sagt "${erwartet}"`
      );
    }
    for (const [schluessel, zeilen] of Object.entries(markt.bloecke)) {
      for (const zeile of zeilen) {
        assert.ok(
          text.includes(zeile),
          `${fassung.kennung}: Zeile aus Block "${schluessel}" fehlt — "${zeile}"`
        );
      }
    }
  }
});

/* Der Waehler ersetzt die beiden frueheren Umschalter. Die alte
   Beschraenkung, dass nur zwischen Fassungen desselben Marktes
   gewechselt wird, ist absichtlich gefallen: von de-CH kam man sonst
   gar nicht nach en-DE. */
test('der Fassungswähler listet alle Fassungen, die eigene nicht verlinkt', () => {
  for (const fassung of B.FASSUNGEN) {
    const text = GEBAUT.get(fassung.kennung);
    const block = text.slice(text.indexOf('<details class="fw">'),
      text.indexOf('</details>', text.indexOf('<details class="fw">')));
    assert.ok(block.length > 0, `${fassung.kennung}: kein Fassungswähler`);

    for (const ziel of B.FASSUNGEN) {
      assert.ok(block.includes(ziel.kennung),
        `${fassung.kennung}: ${ziel.kennung} fehlt in der Auswahl`);
    }

    const verweise = [...block.matchAll(/href="\.\.\/([^/]+)\/index\.html"/g)]
      .map((m) => m[1]).sort();
    const erwartet = B.FASSUNGEN
      .filter((f) => f.kennung !== fassung.kennung)
      .map((f) => f.kennung).sort();
    assert.deepStrictEqual(verweise, erwartet,
      `${fassung.kennung}: die Auswahl verweist auf ${verweise.join(', ')}`);

    assert.ok(block.includes(`class="fw-jetzt"><span class="fw-kennung">${fassung.kennung}</span>`),
      `${fassung.kennung}: die eigene Fassung ist nicht als aktuell gekennzeichnet`);
  }
});

test('der Fassungswähler zeigt geschlossen, welche Fassung offen ist', () => {
  for (const fassung of B.FASSUNGEN) {
    const text = GEBAUT.get(fassung.kennung);
    const m = text.match(/<span class="fw-stand">([\s\S]*?)<\/span>\s*<span class="fw-pfeil"/);
    assert.ok(m, `${fassung.kennung}: keine Beschriftung am Wähler`);
    assert.ok(m[1].includes(fassung.kennung), `${fassung.kennung}: Kennung fehlt`);
  }
});

test('der Fassungswähler kommt ohne Skript aus', () => {
  for (const [datei, text] of S.ERZEUGT) {
    const block = text.slice(text.indexOf('<details class="fw">'),
      text.indexOf('</details>', text.indexOf('<details class="fw">')));
    assert.ok(!/\bon[a-z]+=/i.test(block), `${datei}: Ereignisattribut im Wähler`);
    assert.ok(!/<script/i.test(block), `${datei}: Skript im Wähler`);
    assert.ok(block.includes('<summary'), `${datei}: der Wähler ist kein details/summary`);
  }
});

/* Ein Verweis ins Leere faellt am Bildschirm nicht auf — der Sprung
   passiert schlicht nicht. Deshalb hier. */
test('kein Verweis zeigt ins Leere', () => {
  const fs2 = require('node:fs');
  for (const [datei, text] of S.ERZEUGT) {
    const ids = new Set([...text.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const m of text.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(ids.has(m[1]), `${datei}: Sprungziel #${m[1]} gibt es nicht`);
    }
    const ordner = path.join(S.WURZEL, datei.split('/')[0]);
    for (const m of text.matchAll(/(?:href|src)="((?!#|https?:)[^"]+)"/g)) {
      const ziel = path.resolve(ordner, m[1]);
      assert.ok(fs2.existsSync(ziel), `${datei}: ${m[1]} gibt es nicht`);
    }
  }
});

test('jede Fassung lädt ihre Mittel aus dem Nachbarverzeichnis', () => {
  for (const [datei, text] of S.ERZEUGT) {
    for (const mittel of ['../assets/stil.css', '../assets/grenzwerte.js',
      '../assets/handbuch.js']) {
      assert.ok(text.includes(mittel), `${datei}: ${mittel} fehlt`);
    }
    assert.ok(
      !/https?:\/\//.test(text),
      `${datei}: externe Adresse — die Fassung muss offline laufen`
    );
    assert.ok(
      !/\bfetch\s*\(|XMLHttpRequest|type="module"/.test(text),
      `${datei}: Ladeweg, der unter file:// gesperrt ist`
    );
  }
});
