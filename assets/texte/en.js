/* ============================================================
   Sichtbare Texte — Englisch
   ------------------------------------------------------------
   Gleiche Schluessel wie de.js. Ein Test vergleicht beide
   Schluesselbaeume; fehlt ein Eintrag, wird er rot.

   Saemtliche Eintraege sind Entwuerfe. Die Liste "entwuerfe" am
   Ende nennt die Bereiche, die noch nicht geprueft sind; der Test
   zaehlt sie zusammen mit den data-todo-Stellen im HTML und gibt
   die Summe aus, ohne rot zu werden. Wer einen Bereich geprueft
   hat, streicht ihn dort.

   Kennungen, Zahlen und Einheiten bleiben unveraendert: sie sind
   keine Sprache. Ebenso Eigennamen und die Bezeichnungen aus der
   Bedienungsanleitung.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.TEXTE = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    sprache: 'en',

    /* ---------- Empfangsarten und Felder ---------- */
    arten: {
      sat: {
        bezeichnung: 'Satellite · DVB-S/S2',
        pegel: 'Level',
        rausch: 'Noise margin',
        rauschKurz: 'SNR'
      },
      kabel: {
        bezeichnung: 'Cable · DVB-C',
        pegel: 'Level',
        rausch: 'MER',
        rauschKurz: 'MER'
      }
    },

    /* ---------- Klassennamen ---------- */
    pegelklassen: {
      P1: 'too low',
      P2: 'lower edge',
      P3: 'normal',
      P4: 'upper edge',
      P5: 'too high'
    },
    rauschklassen: {
      Q0: 'no lock',
      Q1: 'below minimum',
      Q2: 'marginal',
      Q3: 'good',
      Q4: 'implausibly high'
    },

    /* ---------- Diagnosen ---------- */
    diagnosen: {
      'KEIN-SIGNAL': {
        anzeige: 'NO-SIGNAL',
        befund: 'No signal at the tuner.',
        warum: 'Level below the expected range and no noise margin at all — practically nothing is arriving. A wrong setting would still show power.',
        schritte: {
          gemeinsam: [
            'Check the cable at the outlet and at the device — are the plugs tight?',
            'Is the right aerial input selected on the device?',
            'Cross-check: another device on the same outlet.'
          ],
          sat: [
            'LNB power in the menu set to On.',
            'Check the F connector for a short — a stray strand at the centre conductor.'
          ],
          kabel: [
            'Change the distributor output.'
          ]
        }
      },

      'KONFIG': {
        anzeige: 'CONFIG',
        befund: 'Power arrives, but the tuner does not lock.',
        warum: 'The level is within the expected range, the noise margin is exactly zero. The tuner is set to something other than what is arriving.',
        schritte: {
          gemeinsam: [
            'Check the search method and the filter.'
          ],
          sat: [
            'Enter the reference transponder: 11494 MHz · H · SR 22000.',
            'Check the LNB frequency: Universal has to be 9750 / 10600 MHz.',
            'DiSEqC: off with a single LNB; with several, pick the right position A to D.',
            'Unicable installation: enter its own UB number and the matching frequency.'
          ],
          kabel: [
            'Full search instead of a network or quick search.',
            'Check frequency, symbol rate and modulation under Manual Tuning.',
            'Have the channel list cleared before the search.'
          ]
        }
      },

      'KONFIG-ODER-UEBERPEGEL': {
        anzeige: 'CONFIG-OR-OVERLOAD',
        befund: 'Very high level, but nothing decodable.',
        warum: 'Two causes are possible: a wrong setting, or overload so severe that the tuner shuts down completely. The setting can be checked without any equipment, so it comes first.',
        schritte: {
          gemeinsam: [
            'Check the setting first: search method, frequency, modulation.',
            'Then fit a {daempfung} dB attenuator and measure again.',
            'If the noise margin rises above zero, it was overload.',
            'An amplifier in the line? Switching it off costs nothing.'
          ],
          sat: [
            'Enter the reference transponder: 11494 MHz · H · SR 22000.'
          ],
          kabel: [
            'Full search instead of a network or quick search.'
          ]
        }
      },

      'UNTERPEGEL': {
        anzeige: 'LOW-LEVEL',
        befund: 'Low level — too little power at the tuner.',
        warum: 'The wanted signal sits too close to the noise, which is why the noise margin collapses. An attenuator makes this worse.',
        schritte: {
          gemeinsam: [
            'No attenuator.',
            'Check the plugs; replace old crimp plugs with compression plugs.',
            'Check the cable length and the number of distributors.'
          ],
          sat: [
            'Have the alignment of the dish checked, especially after a storm.',
            'Have the LNB and the F connector checked for moisture.'
          ],
          kabel: [
            'The higher the floor, the longer the line.',
            'An amplifier is the cable provider\'s business — and only helps close to the source.'
          ]
        }
      },

      'UNTERPEGEL-GRENZ': {
        anzeige: 'LOW-LEVEL-MARGINAL',
        befund: 'Level at the lower edge, reserve almost used up.',
        warum: 'It still works, but any further attenuation tips it over — rain, one more distributor, an aged plug. That explains dropouts that come and go.',
        schritte: {
          gemeinsam: [
            'No attenuator.',
            'Check plugs and distributors.',
            'Cross-measure on several channels.'
          ],
          sat: [
            'Worse in rain and wind? Then the reserve is too small.'
          ],
          kabel: [
            'Check the cable length and the number of distributors.'
          ]
        }
      },

      'RAND-UNTEN-OK': {
        anzeige: 'LOWER-EDGE-OK',
        befund: 'Level at the lower edge, noise margin good.',
        warum: 'No problem at present. The only thing worth noting is how little reserve is left downwards.',
        schritte: {
          gemeinsam: [
            'Nothing needed at present.',
            'If dropouts appear later, check plugs and cable length.'
          ],
          sat: [
            'Cross-measure on several transponders.'
          ],
          kabel: [
            'Cross-measure on several channels.'
          ]
        }
      },

      'STOERUNG': {
        anzeige: 'INTERFERENCE',
        befund: 'Interference in the signal path — level correct, signal distorted.',
        warum: 'Enough power is arriving and the noise margin is poor all the same. So something is being picked up or reflected. Neither an amplifier nor an attenuator changes that, because both raise or lower wanted signal and interference alike.',
        schritte: {
          gemeinsam: [
            'No amplifier, no attenuator.',
            'Check plugs and shielding; replace old crimp plugs with compression plugs.',
            'Check the cable for kinks, crushing and loosened shielding.'
          ],
          sat: [
            'Have the LNB and the F connector checked for moisture.',
            'If it persists: antenna installer.'
          ],
          kabel: [
            'Fit an LTE filter; increase the distance to mobile devices and LED power supplies.',
            'If it persists: cable provider.'
          ]
        }
      },

      'STOERUNG-GRENZ': {
        anzeige: 'INTERFERENCE-MARGINAL',
        befund: 'Marginal — level correct, noise margin without reserve.',
        warum: 'It works, but the gap to the minimum is small. Typical of dropouts that occur sporadically and are hard to reproduce.',
        schritte: {
          gemeinsam: [
            'No amplifier, no attenuator.',
            'Check plugs and distributors.',
            'Cross-measure on several channels.'
          ],
          sat: [
            'Worse in rain and wind? Then the reserve is too small.'
          ],
          kabel: [
            'Replace old crimp plugs with compression plugs.'
          ]
        }
      },

      'OK': {
        anzeige: 'OK',
        befund: 'Reception values fine — the cause lies elsewhere.',
        warum: 'Level and noise margin are both in the good range. A reception problem is therefore ruled out.',
        schritte: {
          gemeinsam: [
            'Check the search method and the filter.',
            'If it affects only one source: check the HDMI cable and input.',
            'If it affects apps as well: network or device, not reception.'
          ],
          sat: [
            'Right satellite selected? Satellite list instead of a blind scan.',
            'If only the commercial channels are missing: check HD+ or the CI+ module.'
          ],
          kabel: [
            'If only encrypted channels are missing: subscription, CI+ module or provider box.'
          ]
        }
      },

      'RAND-OBEN-OK': {
        anzeige: 'UPPER-EDGE-OK',
        befund: 'Level at the upper edge, noise margin good.',
        warum: 'Still within tolerance. Worth noting because little reserve is left upwards — if the level rises further, overload begins.',
        schritte: {
          gemeinsam: [
            'Nothing needed at present.',
            'If blocking appears later: {daempfung} dB attenuator.'
          ],
          sat: [],
          kabel: [
            'Cross-measure on several channels; the level can be higher there.',
            'Flat close to the building amplifier?'
          ]
        }
      },

      'UEBERPEGEL-BEGINN': {
        anzeige: 'OVERLOAD-ONSET',
        befund: 'Onset of overload — level at the upper edge, noise margin falling.',
        warum: 'This combination is typical of a tuner at its limit: the gain control is at its end stop, and small level changes go straight through to the noise margin.',
        schritte: {
          gemeinsam: [
            'An amplifier in the line? Switching it off costs nothing.',
            'Fit a {daempfung} dB attenuator and measure again.',
            'If the noise margin rises, the overload is confirmed.'
          ],
          sat: [],
          kabel: [
            'Flat close to the building amplifier? Installation never levelled?',
            'Cross-measure on several channels.'
          ]
        }
      },

      'UEBERPEGEL': {
        anzeige: 'OVERLOAD',
        befund: 'Overload — the tuner is overdriven.',
        warum: 'High level and a poor noise margin at the same time. The input stage no longer works linearly and produces interference products inside its own channel. This is the only case in which attenuation improves the noise margin.',
        schritte: {
          gemeinsam: [
            'An amplifier in the line? Switching it off costs nothing.',
            'Fit a {daempfung} dB attenuator and measure again.',
            'If the noise margin rises, it is confirmed.',
            'If it stays the same, the distortion is already there before the device — then the installation has to be levelled.'
          ],
          sat: [
            'Was a new LNB fitted recently? Newer LNBs deliver more level.'
          ],
          kabel: [
            'In a multi-family building, levelling is the cable provider\'s responsibility.'
          ]
        }
      },

      'UEBERPEGEL-GRENZ': {
        anzeige: 'OVERLOAD-MARGINAL',
        befund: 'Level above the limit, noise margin already affected.',
        warum: 'Overload is likely but has not come through fully yet. It first shows as blocking whenever the network fluctuates.',
        schritte: {
          gemeinsam: [
            'An amplifier in the line? Switching it off costs nothing.',
            'Fit a {daempfung} dB attenuator and measure again.',
            'If the noise margin rises, it is confirmed.'
          ],
          sat: [
            'Cross-measure on several transponders.'
          ],
          kabel: [
            'Cross-measure on several channels.'
          ]
        }
      },

      'PEGEL-HOCH-OK': {
        anzeige: 'HIGH-LEVEL-OK',
        befund: 'Level above the limit, noise margin still good.',
        warum: 'The level is too high, but the picture is not suffering from it so far. What is missing is only the headroom: if the level rises further, it starts to interfere.',
        schritte: {
          gemeinsam: [
            'Nothing needed at present.',
            'If dropouts appear later: {daempfung} dB attenuator.',
            'An amplifier in the line? Check whether it is needed at all.'
          ],
          sat: [
            'Cross-measure on several transponders; the level can be higher there.'
          ],
          kabel: [
            'Cross-measure on several channels; the level can be higher there.'
          ]
        }
      },

      'WIDERSPRUCH': {
        anzeige: 'CONTRADICTION',
        befund: 'Values contradict each other.',
        warum: 'A low level with a good noise margin practically never occurs. Usually the transponder or channel is entered wrongly, or the two values come from different readings.',
        schritte: {
          gemeinsam: [
            'Have both values read again in the same view.',
            'Mind the unit: negative is dBm, positive between 40 and 90 is dBµV.',
            'Then evaluate again.'
          ],
          sat: [
            'Enter the reference transponder: 11494 MHz · H · SR 22000.'
          ],
          kabel: [
            'Cross-check under Manual Tuning.'
          ]
        }
      },

      'UNPLAUSIBEL': {
        anzeige: 'IMPLAUSIBLE',
        befund: 'Noise margin implausibly high.',
        warum: 'The value is above what this reception type can reach. Usually a percentage reading is being taken for a dB value.',
        schritte: {
          gemeinsam: [
            'Check whether the display shows dB or percent.',
            'Percentages are scaled per manufacturer and cannot be converted.',
            'Cross-check under Manual Tuning and evaluate again.'
          ],
          sat: [],
          kabel: []
        }
      }
    },

/* ---------- Wie ein Bereich beschrieben wird ---------- */
    bereiche: {
      unter: function (x, e) { return 'below ' + x + e; },
      spanne: function (a, b, e) { return a + ' to ' + b + e; },
      ueber: function (x, e) { return 'above ' + x + e; },
      exakt: function (x, e) { return 'exactly ' + x + e; },
      ab: function (x, e) { return 'from ' + x + e; }
    },

    /* ---------- Rechner ---------- */
    rechner: {
      jetztPruefen: 'Check now',
      werteFehlen: 'Values missing.',
      werteFehlenSchritte: [
        'Enter level and noise margin.',
        /* Die englischen Namen dieses Zweigs sind nicht belegt, deshalb
           steht hier derselbe deutsche Weg wie in assets/menue/en.js. */
        'Both are under Support → Schnellhilfe → Selbstdiagnose und Pflege → RF/HDMI.'
      ],
      kopiert: 'Readings copied',
      kopierenFehlt: 'Copying not possible',
      bereichMeldung: function (was, gueltig, mehrere) {
        return was + (mehrere ? ' are' : ' is') +
          ' not possible. Valid: ' + gueltig + '.';
      },
      bereichSchritte: [
        'Have the value read again.',
        'Mind the unit: negative is dBm, positive between 40 and 90 is dBµV.',
        'Conversion at 75 ohms: dBm = dBµV − 108.75.'
      ],
      und: ' and ',
      bis: ' to ',
      messwert: function (feld, wert, einheit, klasse, bereich) {
        return feld + ' ' + wert + ' ' + einheit + ' (' + klasse + ', ' + bereich + ')';
      },
      messwerteTrenner: ' · '
    },

    /* ---------- Dämpfungsrechner ---------- */
    daempfung: {
      laengeFehlt: 'Enter a length, 1 to 300 metres.',
      laengeFehltSchritte: [
        'Enter the cable length in metres — an estimate is enough.',
        'Choose the frequency range: satellite or cable.'
      ],
      laengeUnmoeglich: function (laenge, min, max) {
        return 'A cable length of ' + laenge + ' m is not possible. Valid: ' +
          min + ' to ' + max + ' m.';
      },
      laengeUnmoeglichSchritte: [
        'Estimate the length again — this is the run from the outlet to the device.',
        'For very long runs, look at the installation section by section.'
      ],
      erwartet: function (min, max) {
        return 'Expected cable attenuation: ' + min + ' to ' + max + ' dB.';
      },
      erwartetSchritte: [
        'Distributors and outlets attenuate on top — 4 to 8 dB per distributor output, 2 to 6 dB per outlet.',
        'Reference values. The actual figure is in the cable\'s data sheet.'
      ]
    },

/* ---------- Menüwege ---------- */
    menue: {
      kopieren: 'Copy',
      kopierenLang: 'Copy menu path',
      kopiert: 'Copied',
      markiert: 'Selected — press Ctrl+C to copy',
      ungeprueft: 'English wording not yet verified against the manual'
    },

    /* ---------- Matrix ---------- */
    matrix: {
      messbereich: 'range',
      quelle: function (pegel, pegelEinheit, pegelVon, pegelBis,
        rausch, rauschEinheit, rauschVon, rauschBis) {
        return pegel + ' in ' + pegelEinheit + ', range ' + pegelVon + ' … ' + pegelBis +
          ' · ' + rausch + ' in ' + rauschEinheit + ', range ' + rauschVon + ' … ' + rauschBis;
      },
      keinOberrand: 'No upper edge range defined, so P4 is omitted',
      legendeZeigen: 'Show legend',
      zustaende: {
        gut: 'good',
        grenz: 'marginal',
        fehler: 'fault',
        unklar: 'unclear'
      },
      ueberschrift: {
        sat: 'Satellite · DVB-S/S2',
        kabel: 'Cable · DVB-C, 256QAM'
      },
      seitentitel: 'Diagnostic matrix',
      seitenzeile: 'Row = level class · Column = noise margin class · Cell = finding',
      fusszeile: 'Generated from assets/grenzwerte.js · '
    },

    /* ---------- Erstfragen ---------- */
    fragen: {
      aenderung: {
        pre: 'Shortly before the problem: ',
        legende: 'What happened shortly before the problem?',
        optionen: {
          neuesGeraet: 'New device',
          update: 'Update',
          umzug: 'Move',
          renovierung: 'Renovation',
          handwerker: 'Tradespeople in the building',
          neuerRouter: 'New router',
          neuerTarif: 'New tariff',
          sturm: 'Storm or thunderstorm',
          werksreset: 'Factory reset',
          nichtsBekannt: 'Nothing known'
        },
        voll: {
          nichtsBekannt: 'Problem appeared suddenly, no change shortly before'
        },
        hinweise: {
          sturm: 'After a storm the dish is often misaligned, and water gets into the LNB or the F connector. A thunderstorm can send a surge into the tuner. Have the alignment and connectors checked first.'
        },
        text: {
          label: 'What exactly, and how long ago?',
          platzhalter: 'e.g. new receiver two weeks ago'
        }
      },
      empfangsart: {
        pre: 'Reception: ',
        legende: 'Reception type',
        optionen: { sat: 'Satellite', kabel: 'Cable' },
        voll: {},
        hinweise: {},
        text: { label: 'Provider', platzhalter: 'e.g. Vodafone' }
      },
      vorher: {
        pre: 'History: ',
        legende: 'Did it work before?',
        optionen: {
          liefJahrelang: 'worked for years',
          liefStoerungsfrei: 'worked without trouble so far',
          nieInOrdnung: 'was never right'
        },
        voll: {},
        hinweise: {
          liefJahrelang: 'Not a configuration issue. Configuration does not change by itself'
        },
        text: { label: 'Disturbed since when?', platzhalter: 'e.g. for about three weeks' }
      },
      andereGeraet: {
        pre: 'Another device on the same outlet: ',
        legende: 'Another device on the same outlet?',
        optionen: {
          laeuft: 'works',
          laeuftNicht: 'does not work either',
          nichtGeprueft: 'not checked'
        },
        voll: {},
        hinweise: {},
        verweise: { laeuft: 'Another device works fine · Satellite' },
        text: { label: 'Which device?', platzhalter: 'e.g. receiver in the bedroom' }
      },
      haus: {
        pre: 'Building: ',
        legende: 'Building',
        optionen: { einfamilien: 'Single-family house', mehrfamilien: 'Multi-family building' },
        voll: {},
        hinweise: {},
        text: { label: 'How many households?', platzhalter: 'e.g. 12 households' }
      }
    },

    /* ---------- Notiz ---------- */
    notiz: {
      kopiert: 'Copied to the clipboard.',
      kopierenFehlt: 'Copying not possible. Select the text above and copy it with Ctrl+C or Cmd+C.',
      rechnerVorsatz: 'Calculator: ',
      richtung: '→ Direction: '
    },

    /* ---------- Was noch Entwurf ist ----------
       Jeder Bereich hier ist uebersetzt, aber nicht geprueft. Wer
       einen durchgesehen hat, streicht seine Zeile. */
    entwuerfe: [
      'arten',
      'pegelklassen',
      'rauschklassen',
      'diagnosen',
      'rechner',
      'daempfung',
      'matrix',
      'fragen',
      'notiz'
    ]
  };
}));
