/* ============================================================
   Sichtbare Texte — Deutsch
   ------------------------------------------------------------
   Jeder Satz, jede Beschriftung, jeder Knopftext der Anwendung.
   Gemeinsam genutzt werden nur Zahlen, Kennungen und Logik; alles,
   was jemand liest, steht hier und in en.js daneben.

   Der Generator bindet in jede Fassung genau die Datei ihrer
   Seitensprache ein. Die Skripte fragen die Sprache nicht ab — sie
   finden vor, was geladen wurde.

   Dieselbe Datei wird im Browser per script src geladen und im Test
   per require gelesen. Kein fetch: unter file:// ist es gesperrt.

   Saetze, die aus Teilen zusammengesetzt werden, stehen hier als
   Funktion. Die Wortstellung gehoert zur Sprache, nicht zur Logik.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TEXTE = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    sprache: 'de',

    /* ---------- Empfangsarten und Felder ---------- */
    arten: {
    sat: {
      bezeichnung: 'Satellit · DVB-S/S2',
      pegel: 'Pegel',
      rausch: 'Rauschabstand',
      rauschKurz: 'SNR'
    },
    kabel: {
      bezeichnung: 'Kabel · DVB-C',
      pegel: 'Pegel',
      rausch: 'MER',
      rauschKurz: 'MER'
    }
    },

    /* ---------- Klassennamen ---------- */
    pegelklassen: {
    P1: 'zu niedrig',
    P2: 'unterer Rand',
    P3: 'normal',
    P4: 'oberer Rand',
    P5: 'zu hoch'
    },
    rauschklassen: {
    Q0: 'kein Einrasten',
    Q1: 'unter Minimum',
    Q2: 'Grenzbereich',
    Q3: 'gut',
    Q4: 'unplausibel hoch'
    },

    /* ---------- Diagnosen ----------
       anzeige steht in den Matrixzellen. Auf Deutsch ist sie gleich
       der Kennung; die Kennung selbst bleibt als data-kennung am
       Element, damit die Tests weiter ueber sie pruefen koennen. */
    diagnosen: {
    'KEIN-SIGNAL': {
      anzeige: 'KEIN-SIGNAL',
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
        kabel: [
          'Verteilerausgang wechseln.'
        ]
      }
    },

    'KONFIG': {
      anzeige: 'KONFIG',
      befund: 'Leistung kommt an, der Tuner rastet nicht ein.',
      warum: 'Der Pegel liegt im erwarteten Bereich, der Rauschabstand ist exakt null. Der Tuner ist auf etwas anderes eingestellt als das, was ankommt.',
      schritte: {
        gemeinsam: [
          'Suchlauf-Methode und Filter prüfen.'
        ],
        sat: [
          'Referenz-Transponder eingeben: 11494 MHz · H · SR 22000.',
          'LNB-Frequenz prüfen: Universal muss 9750 / 10600 MHz sein.',
          'DiSEqC: bei einem LNB auf Aus, bei mehreren die richtige Position A bis D wählen.',
          'Unicable-Anlage: eigene UB-Nummer und zugehörige Frequenz eintragen.'
        ],
        kabel: [
          'Vollständige Suche statt Netzwerk- oder Schnellsuche.',
          'Frequenz, Symbolrate und Modulation unter Manuelle Einstellung prüfen.',
          'Senderliste vor dem Suchlauf löschen lassen.'
        ]
      }
    },

    'KONFIG-ODER-UEBERPEGEL': {
      anzeige: 'KONFIG-ODER-UEBERPEGEL',
      befund: 'Sehr hoher Pegel, aber nichts dekodierbar.',
      warum: 'Zwei Ursachen sind möglich: eine falsche Einstellung, oder eine so starke Übersteuerung, dass der Tuner vollständig dichtmacht. Die Einstellung ist ohne Material prüfbar, deshalb zuerst.',
      schritte: {
        gemeinsam: [
          'Zuerst Einstellung prüfen: Suchlauf-Methode, Frequenz, Modulation.',
          'Danach Dämpfungsglied {daempfung} dB einsetzen und erneut messen.',
          'Steigt der Rauschabstand über null, war es Übersteuerung.',
          'Verstärker in der Leitung? Abschalten ist kostenlos.'
        ],
        sat: [
          'Referenz-Transponder eingeben: 11494 MHz · H · SR 22000.'
        ],
        kabel: [
          'Vollständige Suche statt Netzwerk- oder Schnellsuche.'
        ]
      }
    },

    'UNTERPEGEL': {
      anzeige: 'UNTERPEGEL',
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
      anzeige: 'UNTERPEGEL-GRENZ',
      befund: 'Pegel am unteren Rand, Reserve fast aufgebraucht.',
      warum: 'Es läuft noch, aber jede zusätzliche Dämpfung kippt es — Regen, ein weiterer Verteiler, ein gealterter Stecker. Das erklärt Aussetzer, die kommen und gehen.',
      schritte: {
        gemeinsam: [
          'Kein Dämpfungsglied.',
          'Stecker und Verteiler prüfen.',
          'Auf mehreren Kanälen gegenmessen.'
        ],
        sat: [
          'Bei Regen und Wind schlechter? Dann ist die Reserve zu knapp.'
        ],
        kabel: [
          'Kabellänge und Anzahl der Verteiler prüfen.'
        ]
      }
    },

    'RAND-UNTEN-OK': {
      anzeige: 'RAND-UNTEN-OK',
      befund: 'Pegel am unteren Rand, Rauschabstand gut.',
      warum: 'Derzeit unproblematisch. Auffällig ist nur, dass nach unten wenig Reserve bleibt.',
      schritte: {
        gemeinsam: [
          'Derzeit nichts nötig.',
          'Bei späteren Aussetzern Stecker und Kabellänge prüfen.'
        ],
        sat: [
          'Auf mehreren Transpondern gegenmessen.'
        ],
        kabel: [
          'Auf mehreren Kanälen gegenmessen.'
        ]
      }
    },

    'STOERUNG': {
      anzeige: 'STOERUNG',
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
      anzeige: 'STOERUNG-GRENZ',
      befund: 'Grenzbereich — Pegel stimmt, Rauschabstand ohne Reserve.',
      warum: 'Es läuft, aber der Abstand zum Minimum ist klein. Typisch für Aussetzer, die sporadisch auftreten und sich schwer nachstellen lassen.',
      schritte: {
        gemeinsam: [
          'Kein Verstärker, kein Dämpfungsglied.',
          'Stecker und Verteiler prüfen.',
          'Auf mehreren Kanälen gegenmessen.'
        ],
        sat: [
          'Bei Regen und Wind schlechter? Dann ist die Reserve zu knapp.'
        ],
        kabel: [
          'Alte Blechstecker gegen Kompressionsstecker tauschen.'
        ]
      }
    },

    'OK': {
      anzeige: 'OK',
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
        kabel: [
          'Fehlen nur verschlüsselte Sender: Abo, CI+-Modul oder Anbieter-Box.'
        ]
      }
    },

    'RAND-OBEN-OK': {
      anzeige: 'RAND-OBEN-OK',
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
      anzeige: 'UEBERPEGEL-BEGINN',
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
      anzeige: 'UEBERPEGEL',
      befund: 'Überpegel — der Tuner übersteuert.',
      warum: 'Hoher Pegel und gleichzeitig schlechter Rauschabstand. Die Eingangsstufe arbeitet nicht mehr linear und erzeugt Störprodukte im eigenen Kanal. Das ist der einzige Fall, in dem Dämpfen den Rauschabstand verbessert.',
      schritte: {
        gemeinsam: [
          'Verstärker in der Leitung? Abschalten ist kostenlos.',
          'Dämpfungsglied {daempfung} dB einsetzen und erneut messen.',
          'Steigt der Rauschabstand, ist es bestätigt.',
          'Bleibt er gleich, sitzt die Verzerrung schon vor dem Gerät — dann muss die Anlage eingepegelt werden.'
        ],
        sat: [
          'Wurde kürzlich ein neues LNB montiert? Neuere LNBs liefern mehr Pegel.'
        ],
        kabel: [
          'Im Mehrfamilienhaus ist der Kabelanbieter für das Einpegeln zuständig.'
        ]
      }
    },

    'UEBERPEGEL-GRENZ': {
      anzeige: 'UEBERPEGEL-GRENZ',
      befund: 'Pegel über dem Grenzwert, Rauschabstand bereits angegriffen.',
      warum: 'Übersteuerung ist wahrscheinlich, aber noch nicht voll durchgeschlagen. Sie zeigt sich zuerst als Klötzchen bei Schwankungen im Netz.',
      schritte: {
        gemeinsam: [
          'Verstärker in der Leitung? Abschalten ist kostenlos.',
          'Dämpfungsglied {daempfung} dB einsetzen und erneut messen.',
          'Steigt der Rauschabstand, ist es bestätigt.'
        ],
        sat: [
          'Auf mehreren Transpondern gegenmessen.'
        ],
        kabel: [
          'Auf mehreren Kanälen gegenmessen.'
        ]
      }
    },

    'PEGEL-HOCH-OK': {
      anzeige: 'PEGEL-HOCH-OK',
      befund: 'Pegel über dem Grenzwert, Rauschabstand noch gut.',
      warum: 'Der Pegel ist zu hoch, aber das Bild leidet bisher nicht darunter. Es fehlt nur der Puffer nach oben: Steigt der Pegel weiter, fängt es an zu stören.',
      schritte: {
        gemeinsam: [
          'Derzeit nichts nötig.',
          'Bei späteren Aussetzern Dämpfungsglied {daempfung} dB.',
          'Verstärker in der Leitung? Prüfen, ob er überhaupt gebraucht wird.'
        ],
        sat: [
          'Auf mehreren Transpondern gegenmessen, dort kann der Pegel höher liegen.'
        ],
        kabel: [
          'Auf mehreren Kanälen gegenmessen, dort kann der Pegel höher liegen.'
        ]
      }
    },

    'WIDERSPRUCH': {
      anzeige: 'WIDERSPRUCH',
      befund: 'Werte passen nicht zusammen.',
      warum: 'Niedriger Pegel bei gutem Rauschabstand kommt praktisch nicht vor. Meist ist der Transponder oder Kanal falsch eingegeben, oder die beiden Werte stammen aus verschiedenen Messungen.',
      schritte: {
        gemeinsam: [
          'Beide Werte in derselben Ansicht neu ablesen lassen.',
          'Auf die Einheit achten: negativ ist dBm, positiv zwischen 40 und 90 ist dBµV.',
          'Danach erneut auswerten.'
        ],
        sat: [
          'Referenz-Transponder eingeben: 11494 MHz · H · SR 22000.'
        ],
        kabel: [
          'Unter Manuelle Einstellung gegenprüfen.'
        ]
      }
    },

    'UNPLAUSIBEL': {
      anzeige: 'UNPLAUSIBEL',
      befund: 'Rauschabstand unplausibel hoch.',
      warum: 'Der Wert liegt über dem, was diese Empfangsart erreichen kann. Meist wird eine Prozentanzeige für einen dB-Wert gehalten.',
      schritte: {
        gemeinsam: [
          'Prüfen, ob die Anzeige dB oder Prozent zeigt.',
          'Prozentwerte sind herstellerskaliert und nicht umrechenbar.',
          'Unter Manuelle Einstellung gegenprüfen und erneut auswerten.'
        ],
        sat: [],
        kabel: []
      }
    }
    },

/* ---------- Wie ein Bereich beschrieben wird ----------
       Die Zahlen kommen aus grenzwerte.js, die Wortstellung von hier. */
    bereiche: {
      unter: function (x, e) { return 'unter ' + x + e; },
      spanne: function (a, b, e) { return a + ' bis ' + b + e; },
      ueber: function (x, e) { return 'über ' + x + e; },
      exakt: function (x, e) { return 'exakt ' + x + e; },
      ab: function (x, e) { return 'ab ' + x + e; }
    },

    /* ---------- Rechner ---------- */
    rechner: {
      jetztPruefen: 'Jetzt prüfen',
      werteFehlen: 'Werte fehlen.',
      werteFehlenSchritte: [
        'Pegel und Rauschabstand eintragen.',
        'Beide stehen unter Support → Schnellhilfe → Selbstdiagnose und Pflege → RF/HDMI.'
      ],
      kopiert: 'Messwerte kopiert',
      kopierenFehlt: 'Kopieren nicht möglich',
      /* "Pegel 120 dBµV ist nicht möglich. Gültig: 20 bis 100 dBµV." */
      bereichMeldung: function (was, gueltig, mehrere) {
        return was + (mehrere ? ' sind' : ' ist') +
          ' nicht möglich. Gültig: ' + gueltig + '.';
      },
      bereichSchritte: [
        'Wert erneut ablesen lassen.',
        'Auf die Einheit achten: negativ ist dBm, positiv zwischen 40 und 90 ist dBµV.',
        'Umrechnung bei 75 Ohm: dBm = dBµV − 108,75.'
      ],
      und: ' und ',
      bis: ' bis ',
      /* "Pegel −40 dBm (normal, −65 … −25)" */
      messwert: function (feld, wert, einheit, klasse, bereich) {
        return feld + ' ' + wert + ' ' + einheit + ' (' + klasse + ', ' + bereich + ')';
      },
      messwerteTrenner: ' · '
    },

    /* ---------- Dämpfungsrechner ---------- */
    daempfung: {
      laengeFehlt: 'Länge eintragen, 1 bis 300 Meter.',
      laengeFehltSchritte: [
        'Kabellänge in Metern eintragen — eine Schätzung genügt.',
        'Frequenzbereich wählen: Satellit oder Kabel.'
      ],
      laengeUnmoeglich: function (laenge, min, max) {
        return 'Kabellänge ' + laenge + ' m ist nicht möglich. Gültig: ' +
          min + ' bis ' + max + ' m.';
      },
      laengeUnmoeglichSchritte: [
        'Länge erneut schätzen — gemeint ist der Weg von der Dose zum Gerät.',
        'Bei sehr langen Wegen die Anlage abschnittsweise betrachten.'
      ],
      erwartet: function (min, max) {
        return 'Erwartete Kabeldämpfung: ' + min + ' bis ' + max + ' dB.';
      },
      erwartetSchritte: [
        'Verteiler und Dosen dämpfen zusätzlich — je Verteilerausgang 4 bis 8 dB, je Dose 2 bis 6 dB.',
        'Richtwerte. Der tatsächliche Belag steht im Datenblatt des Kabels.'
      ]
    },

/* ---------- Menüwege ---------- */
    menue: {
      kopieren: 'Kopieren',
      kopierenLang: 'Menüweg kopieren',
      kopiert: 'Kopiert',
      markiert: 'Markiert — mit Strg+C kopieren',
      ungeprueft: 'Englische Bezeichnung noch nicht gegen die Anleitung geprüft'
    },

    /* ---------- Matrix ---------- */
    matrix: {
      messbereich: 'Messbereich',
      /* "Pegel in dBm, Messbereich −90 … −10 · SNR in dB, Messbereich 0 … 25" */
      quelle: function (pegel, pegelEinheit, pegelVon, pegelBis,
        rausch, rauschEinheit, rauschVon, rauschBis) {
        return pegel + ' in ' + pegelEinheit + ', Messbereich ' + pegelVon + ' … ' + pegelBis +
          ' · ' + rausch + ' in ' + rauschEinheit + ', Messbereich ' + rauschVon + ' … ' + rauschBis;
      },
      keinOberrand: 'Kein oberer Randbereich definiert, deshalb entfällt P4',
      legendeZeigen: 'Legende zeigen',
      zustaende: {
        gut: 'gut',
        grenz: 'grenz',
        fehler: 'fehler',
        unklar: 'unklar'
      },
      ueberschrift: {
        sat: 'Satellit · DVB-S/S2',
        kabel: 'Kabel · DVB-C, 256QAM'
      },
      seitentitel: 'Diagnosematrix',
      seitenzeile: 'Zeile = Pegelklasse · Spalte = Rauschabstandsklasse · Zelle = Befund',
      fusszeile: 'Erzeugt aus assets/grenzwerte.js · '
    },

    /* ---------- Erstfragen ----------
       Die Kennungen der Optionen sind sprachneutral; sie werden
       ausgewertet. Nur die Anzeige steht hier.

       ZU PRUEFEN — die Antwortoptionen sind der einzige Teil, der
       nicht aus dem Handbuch stammt. Sie sind aus dem vorhandenen
       Text abgeleitet, aber neu formuliert. Die Hinweistexte sind
       dagegen woertlich uebernommen. */
    fragen: {
      aenderung: {
        pre: 'Kurz vor dem Problem: ',
        legende: 'Was war kurz vor dem Problem?',
        optionen: {
          neuesGeraet: 'Neues Gerät',
          update: 'Update',
          umzug: 'Umzug',
          renovierung: 'Renovierung',
          handwerker: 'Handwerker im Haus',
          neuerRouter: 'Neuer Router',
          neuerTarif: 'Neuer Tarif',
          sturm: 'Sturm oder Gewitter',
          werksreset: 'Werksreset',
          nichtsBekannt: 'Nichts bekannt'
        },
        voll: {
          nichtsBekannt: 'Problem trat plötzlich auf, keine Änderung kurz davor'
        },
        hinweise: {
          sturm: 'Nach Sturm ist die Schüssel oft verdreht, und Wasser dringt ins LNB oder in den F-Stecker. Ein Gewitter kann Überspannung bis in den Tuner schicken. Zuerst Ausrichtung und Stecker prüfen lassen.'
        },
        text: {
          label: 'Was genau, und wie lange her?',
          platzhalter: 'z. B. neuer Receiver seit zwei Wochen'
        }
      },
      empfangsart: {
        pre: 'Empfang: ',
        legende: 'Empfangsart',
        optionen: { sat: 'Satellit', kabel: 'Kabel' },
        voll: {},
        hinweise: {},
        text: { label: 'Anbieter', platzhalter: 'z. B. Vodafone' }
      },
      vorher: {
        pre: 'Vorgeschichte: ',
        legende: 'Lief es vorher?',
        optionen: {
          liefJahrelang: 'lief jahrelang',
          liefStoerungsfrei: 'lief bisher störungsfrei',
          nieInOrdnung: 'war noch nie in Ordnung'
        },
        voll: {},
        hinweise: {
          liefJahrelang: 'Keine Konfiguration. Die ändert sich nicht von selbst'
        },
        text: { label: 'Seit wann gestört?', platzhalter: 'z. B. seit etwa drei Wochen' }
      },
      andereGeraet: {
        pre: 'Anderes Gerät an derselben Dose: ',
        legende: 'Anderes Gerät an derselben Dose?',
        optionen: {
          laeuft: 'läuft',
          laeuftNicht: 'läuft ebenfalls nicht',
          nichtGeprueft: 'nicht geprüft'
        },
        voll: {},
        hinweise: {},
        verweise: { laeuft: 'Anderes Gerät läuft · Satellit' },
        text: { label: 'Welches Gerät?', platzhalter: 'z. B. Receiver im Schlafzimmer' }
      },
      haus: {
        pre: 'Gebäude: ',
        legende: 'Gebäude',
        optionen: { einfamilien: 'Einfamilienhaus', mehrfamilien: 'Mehrfamilienhaus' },
        voll: {},
        hinweise: {},
        text: { label: 'Wie viele Parteien?', platzhalter: 'z. B. 12 Parteien' }
      }
    },

    /* ---------- Notiz ---------- */
    notiz: {
      kopiert: 'In die Zwischenablage kopiert.',
      kopierenFehlt: 'Kopieren nicht möglich. Text oben markieren und mit Strg+C bzw. Cmd+C kopieren.',
      rechnerVorsatz: 'Rechner: ',
      richtung: '→ Richtung: '
    },

    /* ---------- Was noch Entwurf ist ----------
       Leer: die deutschen Texte sind die des Handbuchs. */
    entwuerfe: []
  };
}));
