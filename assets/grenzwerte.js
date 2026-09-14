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
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.DIAGNOSE = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
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
      bezeichnung: 'Satellit · DVB-S/S2',
      pegel: {
        name: 'Pegel', einheit: 'dBm',
        von: -90, bis: -10,
        unten: -70, randUnten: -65, randOben: null, ueber: -25
      },
      rausch: {
        name: 'Rauschabstand', kurz: 'SNR', einheit: 'dB',
        von: 0, bis: 25,
        min: 6, soll: 11, unplausibel: 20
      }
    },
    kabel: {
      bezeichnung: 'Kabel · DVB-C',
      pegel: {
        name: 'Pegel', einheit: 'dBµV',
        von: 20, bis: 100,
        unten: 45, randUnten: 50, randOben: 70, ueber: 78
      },
      rausch: {
        name: 'MER', kurz: 'MER', einheit: 'dB',
        von: 0, bis: 45,
        /* Gilt für 256QAM. Offene Frage: 42 dB als Obergrenze ist gesetzt,
           aber nicht belegt. Bei Satellit stammen die 20 dB aus der
           Richtwerttabelle. */
        min: 30, soll: 36, unplausibel: 42
      }
    }
  };

  var PEGELKLASSEN = {
    P1: 'zu niedrig',
    P2: 'unterer Rand',
    P3: 'normal',
    P4: 'oberer Rand',
    P5: 'zu hoch'
  };
  var RAUSCHKLASSEN = {
    Q0: 'kein Einrasten',
    Q1: 'unter Minimum',
    Q2: 'Grenzbereich',
    Q3: 'gut',
    Q4: 'unplausibel hoch'
  };

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
     Befund, Begründung und Schritte. Die Schritte erscheinen in der
     Reihenfolge: erst die gemeinsamen, dann die der Empfangsart. */
  var DIAGNOSEN = {
    'KEIN-SIGNAL': {
      zustand: 'fehler',
      befund: 'Kein Signal am Tuner.',
      warum: 'Pegel unter dem Sollbereich und kein Rauschabstand — es kommt praktisch nichts an. Bei einer falschen Einstellung läge dagegen Leistung an.',
      schritte: {
        gemeinsam: [
          'Kabel an Dose und am Gerät prüfen, Stecker fest?',
          'Richtigen Antenneneingang am Gerät gewählt?',
          'Gegenprobe: anderes Gerät an dieselbe Dose.'
        ],
        sat: [
          'LNB-Strom im Menü auf Ein.',
          'F-Stecker auf Kurzschluss prüfen — abstehende Litze am Innenleiter.'
        ],
        kabel: ['Verteilerausgang wechseln.']
      }
    },

    'KONFIG': {
      zustand: 'fehler',
      befund: 'Leistung kommt an, der Tuner rastet nicht ein.',
      warum: 'Der Pegel liegt im erwarteten Bereich, der Rauschabstand ist exakt null. Der Tuner ist auf etwas anderes eingestellt als das, was ankommt.',
      schritte: {
        gemeinsam: ['Suchlauf-Methode und Filter prüfen.'],
        sat: [
          'Referenz-Transponder eingeben: 11494 MHz · H · SR 22000.',
          'LNB-Frequenz prüfen: Universal muss 9750 / 10600 MHz sein.',
          'DiSEqC bei einem LNB auf Aus.',
          'Unicable-Anlage: eigene UB-Nummer und zugehörige Frequenz eintragen.'
        ],
        kabel: [
          'Vollständige Suche statt Netzwerk- oder Schnellsuche.',
          'Frequenz, Symbolrate und Modulation im manuellen Suchlauf prüfen.',
          'Senderliste vor dem Suchlauf löschen lassen.'
        ]
      }
    },

    'KONFIG-ODER-UEBERPEGEL': {
      zustand: 'fehler',
      befund: 'Sehr hoher Pegel, aber nichts dekodierbar.',
      warum: 'Zwei Ursachen sind möglich: eine falsche Einstellung, oder eine so starke Übersteuerung, dass der Tuner vollständig dichtmacht. Die Einstellung ist ohne Material prüfbar, deshalb zuerst.',
      schritte: {
        gemeinsam: [
          'Zuerst Einstellung prüfen: Suchlauf-Methode, Frequenz, Modulation.',
          'Danach Dämpfungsglied {daempfung} dB einsetzen und erneut messen.',
          'Steigt der Rauschabstand über null, war es Übersteuerung.',
          'Verstärker in der Leitung? Abschalten ist kostenlos.'
        ],
        sat: ['Referenz-Transponder eingeben: 11494 MHz · H · SR 22000.'],
        kabel: ['Vollständige Suche statt Netzwerk- oder Schnellsuche.']
      }
    },

    'UNTERPEGEL': {
      zustand: 'fehler',
      befund: 'Unterpegel — zu wenig Leistung am Tuner.',
      warum: 'Das Nutzsignal liegt zu dicht am Rauschen, deshalb bricht der Rauschabstand ein. Ein Dämpfungsglied verschlimmert diesen Zustand.',
      schritte: {
        gemeinsam: [
          'Kein Dämpfungsglied.',
          'Stecker prüfen, alte Blechstecker gegen Kompressionsstecker tauschen.',
          'Kabellänge und Anzahl der Verteiler prüfen.'
        ],
        sat: [
          'Ausrichtung der Schüssel prüfen lassen, nach Sturm besonders.',
          'Feuchtigkeit im LNB oder im F-Stecker prüfen lassen.'
        ],
        kabel: [
          'Je höher die Etage, desto länger die Leitung.',
          'Verstärker ist Sache des Kabelanbieters — und hilft nur nahe an der Quelle.'
        ]
      }
    },

    'UNTERPEGEL-GRENZ': {
      zustand: 'grenz',
      befund: 'Pegel am unteren Rand, Reserve fast aufgebraucht.',
      warum: 'Es läuft noch, aber jede zusätzliche Dämpfung kippt es — Regen, ein weiterer Verteiler, ein gealterter Stecker. Das erklärt Aussetzer, die kommen und gehen.',
      schritte: {
        gemeinsam: [
          'Kein Dämpfungsglied.',
          'Stecker und Verteiler prüfen.',
          'Auf mehreren Kanälen gegenmessen.'
        ],
        sat: ['Bei Regen und Wind schlechter? Dann ist die Reserve zu knapp.'],
        kabel: ['Kabellänge und Anzahl der Verteiler prüfen.']
      }
    },

    'RAND-UNTEN-OK': {
      zustand: 'grenz',
      befund: 'Pegel am unteren Rand, Rauschabstand gut.',
      warum: 'Derzeit unproblematisch. Auffällig ist nur, dass nach unten wenig Reserve bleibt.',
      schritte: {
        gemeinsam: [
          'Derzeit nichts nötig.',
          'Bei späteren Aussetzern Stecker und Kabellänge prüfen.'
        ],
        sat: ['Auf mehreren Transpondern gegenmessen.'],
        kabel: ['Auf mehreren Kanälen gegenmessen.']
      }
    },

    'STOERUNG': {
      zustand: 'fehler',
      befund: 'Störung im Signalweg — Pegel stimmt, Signal ist verzerrt.',
      warum: 'Es kommt genug Leistung an und der Rauschabstand ist trotzdem schlecht. Also wird etwas eingestreut oder reflektiert. Weder Verstärker noch Dämpfungsglied ändern daran etwas, weil beide Nutzsignal und Störung gleichermaßen anheben oder senken.',
      schritte: {
        gemeinsam: [
          'Kein Verstärker, kein Dämpfungsglied.',
          'Stecker und Schirmung prüfen, alte Blechstecker gegen Kompressionsstecker tauschen.',
          'Kabel auf Knicke, Quetschungen und gelöste Schirmung prüfen.'
        ],
        sat: [
          'Feuchtigkeit im LNB oder im F-Stecker prüfen lassen.',
          'Bleibt es: Antennenbauer.'
        ],
        kabel: [
          'LTE-Filter einsetzen, Abstand zu Mobilfunkgeräten und LED-Netzteilen vergrößern.',
          'Bleibt es: Kabelanbieter.'
        ]
      }
    },

    'STOERUNG-GRENZ': {
      zustand: 'grenz',
      befund: 'Grenzbereich — Pegel stimmt, Rauschabstand ohne Reserve.',
      warum: 'Es läuft, aber der Abstand zum Minimum ist klein. Typisch für Aussetzer, die sporadisch auftreten und sich schwer nachstellen lassen.',
      schritte: {
        gemeinsam: [
          'Kein Verstärker, kein Dämpfungsglied.',
          'Stecker und Verteiler prüfen.',
          'Auf mehreren Kanälen gegenmessen.'
        ],
        sat: ['Bei Regen und Wind schlechter? Dann ist die Reserve zu knapp.'],
        kabel: ['Alte Blechstecker gegen Kompressionsstecker tauschen.']
      }
    },

    'OK': {
      zustand: 'gut',
      befund: 'Empfangswerte in Ordnung — die Ursache liegt woanders.',
      warum: 'Pegel und Rauschabstand liegen beide im guten Bereich. Ein Empfangsproblem ist damit ausgeschlossen.',
      schritte: {
        gemeinsam: [
          'Suchlauf-Methode und Filter prüfen.',
          'Betrifft es nur eine Quelle: HDMI-Kabel und Eingang prüfen.',
          'Betrifft es auch Apps: Netzwerk oder Gerät, nicht der Empfang.'
        ],
        sat: [
          'Richtigen Satelliten gewählt? Satellitenliste statt Blindscan.',
          'Fehlen nur die Privaten: HD+ oder CI+-Modul prüfen.'
        ],
        kabel: ['Fehlen nur verschlüsselte Sender: Abo, CI+-Modul oder Anbieter-Box.']
      }
    },

    'RAND-OBEN-OK': {
      zustand: 'grenz',
      befund: 'Pegel am oberen Rand, Rauschabstand gut.',
      warum: 'Noch innerhalb der Toleranz. Auffällig, weil nach oben wenig Reserve bleibt — steigt der Pegel weiter, beginnt die Übersteuerung.',
      schritte: {
        gemeinsam: [
          'Derzeit nichts nötig.',
          'Bei späteren Klötzchen: Dämpfungsglied {daempfung} dB.'
        ],
        sat: [],
        kabel: [
          'Auf mehreren Kanälen gegenmessen, dort kann der Pegel höher liegen.',
          'Wohnung nah am Hausverstärker?'
        ]
      }
    },

    'UEBERPEGEL-BEGINN': {
      zustand: 'fehler',
      befund: 'Beginnende Übersteuerung — Pegel am oberen Rand, Rauschabstand fällt.',
      warum: 'Diese Kombination ist typisch für einen Tuner an seiner Grenze: die Regelung steht am Anschlag, kleine Pegelschwankungen schlagen sofort auf den Rauschabstand durch.',
      schritte: {
        gemeinsam: [
          'Verstärker in der Leitung? Abschalten ist kostenlos.',
          'Dämpfungsglied {daempfung} dB einsetzen und erneut messen.',
          'Steigt der Rauschabstand, ist die Übersteuerung bestätigt.'
        ],
        sat: [],
        kabel: [
          'Wohnung nah am Hausverstärker? Anlage nie eingepegelt?',
          'Auf mehreren Kanälen gegenmessen.'
        ]
      }
    },

    'UEBERPEGEL': {
      zustand: 'fehler',
      befund: 'Überpegel — der Tuner übersteuert.',
      warum: 'Hoher Pegel und gleichzeitig schlechter Rauschabstand. Die Eingangsstufe arbeitet nicht mehr linear und erzeugt Störprodukte im eigenen Kanal. Das ist der einzige Fall, in dem Dämpfen den Rauschabstand verbessert.',
      schritte: {
        gemeinsam: [
          'Verstärker in der Leitung? Abschalten ist kostenlos.',
          'Dämpfungsglied {daempfung} dB einsetzen und erneut messen.',
          'Steigt der Rauschabstand, ist es bestätigt.',
          'Bleibt er gleich, sitzt die Verzerrung schon vor dem Gerät — dann muss die Anlage eingepegelt werden.'
        ],
        sat: ['Wurde kürzlich ein neues LNB montiert? Neuere LNBs liefern mehr Pegel.'],
        kabel: ['Im Mehrfamilienhaus ist der Kabelanbieter für das Einpegeln zuständig.']
      }
    },

    'UEBERPEGEL-GRENZ': {
      zustand: 'fehler',
      befund: 'Pegel über dem Grenzwert, Rauschabstand bereits angegriffen.',
      warum: 'Übersteuerung ist wahrscheinlich, aber noch nicht voll durchgeschlagen. Sie zeigt sich zuerst als Klötzchen bei Schwankungen im Netz.',
      schritte: {
        gemeinsam: [
          'Verstärker in der Leitung? Abschalten ist kostenlos.',
          'Dämpfungsglied {daempfung} dB einsetzen und erneut messen.',
          'Steigt der Rauschabstand, ist es bestätigt.'
        ],
        sat: ['Auf mehreren Transpondern gegenmessen.'],
        kabel: ['Auf mehreren Kanälen gegenmessen.']
      }
    },

    'PEGEL-HOCH-OK': {
      zustand: 'grenz',
      befund: 'Pegel über dem Grenzwert, Rauschabstand noch gut.',
      warum: 'Der Pegel ist zu hoch, aber das Bild leidet bisher nicht darunter. Es fehlt nur der Puffer nach oben: Steigt der Pegel weiter, fängt es an zu stören.',
      schritte: {
        gemeinsam: [
          'Derzeit nichts nötig.',
          'Bei späteren Aussetzern Dämpfungsglied {daempfung} dB.',
          'Verstärker in der Leitung? Prüfen, ob er überhaupt gebraucht wird.'
        ],
        sat: ['Auf mehreren Transpondern gegenmessen, dort kann der Pegel höher liegen.'],
        kabel: ['Auf mehreren Kanälen gegenmessen, dort kann der Pegel höher liegen.']
      }
    },

    'WIDERSPRUCH': {
      zustand: 'unklar',
      befund: 'Werte passen nicht zusammen.',
      warum: 'Niedriger Pegel bei gutem Rauschabstand kommt praktisch nicht vor. Meist ist der Transponder oder Kanal falsch eingegeben, oder die beiden Werte stammen aus verschiedenen Messungen.',
      schritte: {
        gemeinsam: [
          'Beide Werte in derselben Ansicht neu ablesen lassen.',
          'Auf die Einheit achten: negativ ist dBm, positiv zwischen 40 und 90 ist dBµV.',
          'Danach erneut auswerten.'
        ],
        sat: ['Referenz-Transponder eingeben: 11494 MHz · H · SR 22000.'],
        kabel: ['Im manuellen Suchlauf gegenprüfen.']
      }
    },

    'UNPLAUSIBEL': {
      zustand: 'unklar',
      befund: 'Rauschabstand unplausibel hoch.',
      warum: 'Der Wert liegt über dem, was diese Empfangsart erreichen kann. Meist wird eine Prozentanzeige für einen dB-Wert gehalten.',
      schritte: {
        gemeinsam: [
          'Prüfen, ob die Anzeige dB oder Prozent zeigt.',
          'Prozentwerte sind herstellerskaliert und nicht umrechenbar.',
          'Im manuellen Suchlauf gegenprüfen und erneut auswerten.'
        ],
        sat: [],
        kabel: []
      }
    }
  };

  var MAX_SCHRITTE = 5;

  /* Erst die gemeinsamen Schritte, dann die der Empfangsart. Wird es zu
     lang, entfallen gemeinsame von hinten — die spezifischen sind die
     genaueren und bleiben immer stehen. */
  function schritteFuer(id, art) {
    var d = DIAGNOSEN[id];
    var eigen = (d.schritte[art] || []).slice();
    var frei = Math.max(0, MAX_SCHRITTE - eigen.length);
    return d.schritte.gemeinsam.slice(0, frei).concat(eigen);
  }

  /* Minuszeichen als echtes Zeichen, nicht als Bindestrich */
  function zahl(x) { return String(x).replace('-', '−'); }

  /* Wo die Klasse liegt, in Zahlen. Ohne das bleibt "Grenzbereich" eine
     Behauptung — mit der Angabe ist nachvollziehbar, wogegen gemessen
     wurde und wie weit der Wert danebenliegt. */
  function pegelBereich(art, klasse) {
    var p = GRENZWERTE[art].pegel, e = ' ' + p.einheit;
    var obenNormal = p.randOben === null ? p.ueber : p.randOben;
    switch (klasse) {
      case 'P1': return 'unter ' + zahl(p.unten) + e;
      case 'P2': return zahl(p.unten) + ' bis ' + zahl(p.randUnten) + e;
      case 'P3': return zahl(p.randUnten) + ' bis ' + zahl(obenNormal) + e;
      case 'P4': return zahl(p.randOben) + ' bis ' + zahl(p.ueber) + e;
      default:   return 'über ' + zahl(p.ueber) + e;
    }
  }
  function rauschBereich(art, klasse) {
    var g = GRENZWERTE[art].rausch, e = ' ' + g.einheit;
    switch (klasse) {
      case 'Q0': return 'exakt 0' + e;
      case 'Q1': return 'unter ' + zahl(g.min) + e;
      case 'Q2': return zahl(g.min) + ' bis ' + zahl(g.soll) + e;
      case 'Q3': return 'ab ' + zahl(g.soll) + e;
      default:   return 'über ' + zahl(g.unplausibel) + e;
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
    [[pegel, g.pegel], [rausch, g.rausch]].forEach(function (paar) {
      var w = paar[0], f = paar[1];
      if (w !== null && w !== undefined && (w < f.von || w > f.bis)) {
        treffer.push({ wert: w, feld: f });
      }
    });
    if (!treffer.length) { return null; }

    var was = treffer.map(function (t) {
      return t.feld.name + ' ' + zahl(t.wert) + ' ' + t.feld.einheit;
    });
    var gueltig = treffer.map(function (t) {
      return zahl(t.feld.von) + ' bis ' + zahl(t.feld.bis) + ' ' + t.feld.einheit;
    });
    return {
      meldung: was.join(' und ') + (treffer.length > 1 ? ' sind' : ' ist') +
        ' nicht möglich. Gültig: ' + gueltig.join(' und ') + '.',
      schritte: [
        'Wert erneut ablesen lassen.',
        'Auf die Einheit achten: negativ ist dBm, positiv zwischen 40 und 90 ist dBµV.',
        'Umrechnung bei 75 Ohm: dBm = dBµV − 108,75.'
      ]
    };
  }

  /* ---------- Diagnose ---------- */
  function diagnose(art, pegel, rausch) {
    var klassen = klassifiziere(art, pegel, rausch);
    var id = MATRIX[art][klassen.pegel][klassen.rausch];
    var d = DIAGNOSEN[id];
    var g = GRENZWERTE[art];
    var glied = empfohleneDaempfung(art, pegel);
    var schritte = schritteFuer(id, art).map(function (x) {
      return x.replace('{daempfung}', String(glied));
    });
    return {
      id: id,
      zustand: d.zustand,
      befund: d.befund,
      warum: d.warum,
      schritte: schritte,
      klassen: klassen,
      daempfung: glied,
      messwerte: g.pegel.name + ' ' + zahl(pegel) + ' ' + g.pegel.einheit +
        ' (' + PEGELKLASSEN[klassen.pegel] + ', ' + pegelBereich(art, klassen.pegel) + ') · ' +
        g.rausch.kurz + ' ' + zahl(rausch) + ' ' + g.rausch.einheit +
        ' (' + RAUSCHKLASSEN[klassen.rausch] + ', ' + rauschBereich(art, klassen.rausch) + ')'
    };
  }

  return {
    GRENZWERTE: GRENZWERTE,
    MATRIX: MATRIX,
    DIAGNOSEN: DIAGNOSEN,
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
