/* ============================================================
   Grenzwerte, Klassifizierung und Diagnosen
   ------------------------------------------------------------
   Reine Rechenlogik: keine DOM-Zugriffe, keine Abhängigkeiten.
   Dadurch lässt sie sich im Browser per script-Tag laden und im
   Test per require prüfen — dieselbe Datei, dieselben Zahlen.

   Wirkkette: Eingabe → Klassifizierung → Diagnose → Schritte.

   Pegel und Rauschabstand werden getrennt in Klassen eingeteilt.
   Erst die Kombination beider Klassen ergibt die Diagnose. Eine
   Kette aus Einzelschwellen kann dagegen ein Ergebnis liefern,
   das dem zweiten Messwert widerspricht — genau daran krankte
   die vorige Fassung.

   Die Zahlen stehen zusätzlich in der Grenzwerttabelle der Seite.
   tests/tabelle.test.cjs vergleicht beide Orte miteinander.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    /* Im Test ohne Seite: die deutschen Texte. Wer die englischen
       braucht, laedt assets/texte/en.js selbst. */
    module.exports = factory(function () { return require('./texte/de.js'); });
  } else {
    /* Im Browser hat die Seite ihre Textdatei schon geladen. Die Sprache
       wird nicht abgefragt — es ist da, was da ist. */
    root.DIAGNOSE = factory(function () { return root.TEXTE; });
  }
}(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';

  /* ---------- Schwellen ----------
     unten     darunter zu niedrig
     randUnten unten bis hierher: unterer Rand
     randOben  ab hier bis ueber: oberer Rand (null = keiner)
     ueber     darüber zu hoch
     min       darunter kein stabiler Empfang
     soll      ab hier gut
     unplausibel darüber Fehlmessung                                   */
  var GRENZWERTE = {
    sat: {
      pegel: {
        einheit: 'dBm',
        von: -90, bis: -10,
        unten: -70, randUnten: -65, randOben: null, ueber: -25
      },
      rausch: {
        einheit: 'dB',
        von: 0, bis: 25,
        min: 6, soll: 11, unplausibel: 20
      }
    },
    kabel: {
      pegel: {
        einheit: 'dBµV',
        von: 20, bis: 100,
        unten: 45, randUnten: 50, randOben: 70, ueber: 78
      },
      rausch: {
        einheit: 'dB',
        von: 0, bis: 45,
        /* Gilt für 256QAM. Offene Frage: 42 dB als Obergrenze ist gesetzt,
           aber nicht belegt. Bei Satellit stammen die 20 dB aus der
           Richtwerttabelle. */
        min: 30, soll: 36, unplausibel: 42
      }
    }
  };

  /* Die Reihenfolge der Klassen. Die Namen stehen in der Textschicht. */
  var PEGELKLASSEN = ['P1', 'P2', 'P3', 'P4', 'P5'];
  var RAUSCHKLASSEN = ['Q0', 'Q1', 'Q2', 'Q3', 'Q4'];

  /* ---------- Klassifizierung ---------- */

  function pegelKlasse(art, pegel) {
    var p = GRENZWERTE[art].pegel;
    if (pegel < p.unten) { return 'P1'; }
    if (pegel < p.randUnten) { return 'P2'; }
    /* Ohne oberen Randbereich reicht normal bis einschließlich ueber */
    var obereGrenzeNormal = p.randOben === null ? p.ueber : p.randOben;
    if (pegel <= obereGrenzeNormal) { return 'P3'; }
    if (pegel <= p.ueber) { return 'P4'; }
    return 'P5';
  }

  function rauschKlasse(art, rausch) {
    var g = GRENZWERTE[art].rausch;
    if (rausch === 0) { return 'Q0'; }
    if (rausch < g.min) { return 'Q1'; }
    if (rausch < g.soll) { return 'Q2'; }
    if (rausch <= g.unplausibel) { return 'Q3'; }
    return 'Q4';
  }

  function klassifiziere(art, pegel, rausch) {
    return { pegel: pegelKlasse(art, pegel), rausch: rauschKlasse(art, rausch) };
  }

  /* ---------- Matrix ----------
     art -> Pegelklasse -> Rauschklasse -> Diagnose.
     Bei Satellit fehlt P4, weil kein oberer Randbereich definiert ist. */
  var MATRIX = {
    sat: {
      P1: { Q0: 'KEIN-SIGNAL',            Q1: 'UNTERPEGEL', Q2: 'UNTERPEGEL',       Q3: 'WIDERSPRUCH',    Q4: 'UNPLAUSIBEL' },
      P2: { Q0: 'KONFIG',                 Q1: 'UNTERPEGEL', Q2: 'UNTERPEGEL-GRENZ', Q3: 'RAND-UNTEN-OK',  Q4: 'UNPLAUSIBEL' },
      P3: { Q0: 'KONFIG',                 Q1: 'STOERUNG',   Q2: 'STOERUNG-GRENZ',   Q3: 'OK',             Q4: 'UNPLAUSIBEL' },
      P5: { Q0: 'KONFIG-ODER-UEBERPEGEL', Q1: 'UEBERPEGEL', Q2: 'UEBERPEGEL-GRENZ', Q3: 'PEGEL-HOCH-OK',  Q4: 'UNPLAUSIBEL' }
    },
    kabel: {
      P1: { Q0: 'KEIN-SIGNAL',            Q1: 'UNTERPEGEL', Q2: 'UNTERPEGEL',        Q3: 'WIDERSPRUCH',   Q4: 'UNPLAUSIBEL' },
      P2: { Q0: 'KONFIG',                 Q1: 'UNTERPEGEL', Q2: 'UNTERPEGEL-GRENZ',  Q3: 'RAND-UNTEN-OK', Q4: 'UNPLAUSIBEL' },
      P3: { Q0: 'KONFIG',                 Q1: 'STOERUNG',   Q2: 'STOERUNG-GRENZ',    Q3: 'OK',            Q4: 'UNPLAUSIBEL' },
      P4: { Q0: 'KONFIG',                 Q1: 'UEBERPEGEL', Q2: 'UEBERPEGEL-BEGINN', Q3: 'RAND-OBEN-OK',  Q4: 'UNPLAUSIBEL' },
      P5: { Q0: 'KONFIG-ODER-UEBERPEGEL', Q1: 'UEBERPEGEL', Q2: 'UEBERPEGEL-GRENZ',  Q3: 'PEGEL-HOCH-OK', Q4: 'UNPLAUSIBEL' }
    }
  };

  /* ---------- Diagnosen ----------
     Hier steht nur noch, wie eine Diagnose zu werten ist. Befund,
     Begruendung und Schritte sind Wortlaut und stehen in der
     Textschicht — sie aendern sich mit der Sprache, der Zustand nicht. */
  var ZUSTAND = {
    'KEIN-SIGNAL': 'fehler',
    'KONFIG': 'fehler',
    'KONFIG-ODER-UEBERPEGEL': 'fehler',
    'UNTERPEGEL': 'fehler',
    'UNTERPEGEL-GRENZ': 'grenz',
    'RAND-UNTEN-OK': 'grenz',
    'STOERUNG': 'fehler',
    'STOERUNG-GRENZ': 'grenz',
    'OK': 'gut',
    'RAND-OBEN-OK': 'grenz',
    'UEBERPEGEL-BEGINN': 'fehler',
    'UEBERPEGEL': 'fehler',
    'UEBERPEGEL-GRENZ': 'fehler',
    'PEGEL-HOCH-OK': 'grenz',
    'WIDERSPRUCH': 'unklar',
    'UNPLAUSIBEL': 'unklar'
  };

  /* Die Schritte erscheinen in der Reihenfolge: erst die gemeinsamen,
     dann die der Empfangsart. */
  var MAX_SCHRITTE = 5;

  /* Erst die gemeinsamen Schritte, dann die der Empfangsart. Wird es zu
     lang, entfallen gemeinsame von hinten — die spezifischen sind die
     genaueren und bleiben immer stehen. */
  function schritteFuer(id, art) {
    var s = T().diagnosen[id].schritte;
    var eigen = (s[art] || []).slice();
    var frei = Math.max(0, MAX_SCHRITTE - eigen.length);
    return s.gemeinsam.slice(0, frei).concat(eigen);
  }

  /* Minuszeichen als echtes Zeichen, nicht als Bindestrich */
  function zahl(x) { return String(x).replace('-', '−'); }

  /* Wo die Klasse liegt, in Zahlen. Ohne das bleibt "Grenzbereich" eine
     Behauptung — mit der Angabe ist nachvollziehbar, wogegen gemessen
     wurde und wie weit der Wert danebenliegt. */
  function pegelBereich(art, klasse) {
    var p = GRENZWERTE[art].pegel, e = ' ' + p.einheit, b = T().bereiche;
    var obenNormal = p.randOben === null ? p.ueber : p.randOben;
    switch (klasse) {
      case 'P1': return b.unter(zahl(p.unten), e);
      case 'P2': return b.spanne(zahl(p.unten), zahl(p.randUnten), e);
      case 'P3': return b.spanne(zahl(p.randUnten), zahl(obenNormal), e);
      case 'P4': return b.spanne(zahl(p.randOben), zahl(p.ueber), e);
      default:   return b.ueber(zahl(p.ueber), e);
    }
  }
  function rauschBereich(art, klasse) {
    var g = GRENZWERTE[art].rausch, e = ' ' + g.einheit, b = T().bereiche;
    switch (klasse) {
      case 'Q0': return b.exakt('0', e);
      case 'Q1': return b.unter(zahl(g.min), e);
      case 'Q2': return b.spanne(zahl(g.min), zahl(g.soll), e);
      case 'Q3': return b.ab(zahl(g.soll), e);
      default:   return b.ueber(zahl(g.unplausibel), e);
    }
  }

  /* ---------- Empfohlene Dämpfung ----------
     Ein festes 10-dB-Glied reicht nicht überall: bei Satellit erstreckt
     sich der Überpegelbereich von −25 bis −10 dBm, also über 15 dB. Bei
     −15 dBm landet ein 10-dB-Glied exakt auf der Grenze, bei −12 dBm
     immer noch darüber. Deshalb wird aus dem gemessenen Wert gerechnet.

     Ziel ist der perfekte Bereich mit etwas Abstand zur Grenze; gewählt
     wird das kleinste handelsübliche Glied, das dorthin reicht. */
  /* Bis 30 dB, weil der Messbereich bei Kabel bis 100 dBµV reicht und
     ein 20-dB-Glied von dort aus nicht in den perfekten Bereich kommt.
     Solche Pegel bedeuten ohnehin eine nie eingepegelte Anlage — der
     erste Schritt bleibt deshalb der Verstärker in der Leitung. */
  var GLIEDER = [6, 10, 15, 20, 25, 30];
  var ABSTAND = 3;

  function empfohleneDaempfung(art, pegel) {
    var p = GRENZWERTE[art].pegel;
    var ziel = (p.randOben === null ? p.ueber : p.randOben) - ABSTAND;
    var noetig = pegel - ziel;
    for (var i = 0; i < GLIEDER.length; i++) {
      if (GLIEDER[i] >= noetig) { return GLIEDER[i]; }
    }
    return GLIEDER[GLIEDER.length - 1];
  }

  /* ---------- Wertebereich ----------
     Läuft vor jeder Diagnose. Liegt ein Wert außerhalb dessen, was ein
     Tuner messen kann, wird nicht diagnostiziert, sondern auf den
     Eingabefehler hingewiesen. Häufigster Fall: dBµV im dBm-Feld. */
  function pruefeWertebereich(art, pegel, rausch) {
    var g = GRENZWERTE[art];
    var treffer = [];
    [[pegel, g.pegel, 'pegel'], [rausch, g.rausch, 'rausch']].forEach(function (paar) {
      var w = paar[0], f = paar[1];
      if (w !== null && w !== undefined && (w < f.von || w > f.bis)) {
        treffer.push({ wert: w, feld: f, feldname: paar[2] });
      }
    });
    if (!treffer.length) { return null; }

    var t = T(), r = t.rechner;
    var was = treffer.map(function (x) {
      return t.arten[art][x.feldname] + ' ' + zahl(x.wert) + ' ' + x.feld.einheit;
    });
    var gueltig = treffer.map(function (x) {
      return zahl(x.feld.von) + r.bis + zahl(x.feld.bis) + ' ' + x.feld.einheit;
    });
    return {
      meldung: r.bereichMeldung(was.join(r.und), gueltig.join(r.und), treffer.length > 1),
      schritte: r.bereichSchritte.slice()
    };
  }

  /* ---------- Diagnose ---------- */
  function diagnose(art, pegel, rausch) {
    var klassen = klassifiziere(art, pegel, rausch);
    var id = MATRIX[art][klassen.pegel][klassen.rausch];
    var g = GRENZWERTE[art];
    var t = T(), d = t.diagnosen[id], f = t.arten[art], r = t.rechner;
    var glied = empfohleneDaempfung(art, pegel);
    var schritte = schritteFuer(id, art).map(function (x) {
      return x.replace('{daempfung}', String(glied));
    });
    return {
      id: id,
      zustand: ZUSTAND[id],
      befund: d.befund,
      warum: d.warum,
      schritte: schritte,
      klassen: klassen,
      daempfung: glied,
      messwerte:
        r.messwert(f.pegel, zahl(pegel), g.pegel.einheit,
          t.pegelklassen[klassen.pegel], pegelBereich(art, klassen.pegel)) +
        r.messwerteTrenner +
        r.messwert(f.rauschKurz, zahl(rausch), g.rausch.einheit,
          t.rauschklassen[klassen.rausch], rauschBereich(art, klassen.rausch))
    };
  }

  return {
    GRENZWERTE: GRENZWERTE,
    MATRIX: MATRIX,
    ZUSTAND: ZUSTAND,
    PEGELKLASSEN: PEGELKLASSEN,
    RAUSCHKLASSEN: RAUSCHKLASSEN,
    MAX_SCHRITTE: MAX_SCHRITTE,
    klassifiziere: klassifiziere,
    schritteFuer: schritteFuer,
    empfohleneDaempfung: empfohleneDaempfung,
    pegelBereich: pegelBereich,
    rauschBereich: rauschBereich,
    diagnose: diagnose,
    pruefeWertebereich: pruefeWertebereich
  };
}));
