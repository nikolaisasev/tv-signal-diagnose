/* ============================================================
   Menuewege und Menuepunkte — englische Menuesprache
   ------------------------------------------------------------
   Gleiche Schluessel wie assets/menue/de.js.

   Seit 6.3 gilt: Ein Weg erscheint in der englischen Fassung
   immer auf Englisch. Eine englische Seite mit deutschen Pfaden
   ist fuer den Leser unbrauchbar. Ist eine Bezeichnung nicht
   belegt, steht sie trotzdem da — aber mit geprueft: false, und
   der Generator setzt data-todo, damit die Pruefung am Geraet
   nachgeholt werden kann.

   Belegt (eGuide webOS 25, englische Fassung):
     All Settings · General · Programmes · Programme Tuning
     (Programme Tuning & Settings) · Manual Tuning · Signal Test ·
     Transponder Edit · Programme Manager · CI Information ·
     Save CI Password · Satellite · LNB Frequency · Transponder ·
     22kHz Tone · LNB Power · DiSEqC · Unicable · Unicable
     Settings · Motor Type · Motor Settings · User · On · Off

   Abgeleitet, nicht woertlich als Menuepfad belegt:
     Auto Tuning · Satellite Settings · Quick Help ·
     Device Self-Care

   Eigennamen bleiben, wie sie sind: RF/HDMI, Unicable, DiSEqC,
   MDU1 bis MDU5 und alle Frequenzwerte.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.MENUE_EN = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var P = ' → ';

  var SENDER = 'All Settings' + P + 'General' + P + 'Programmes' + P +
    'Programme Tuning (Programme Tuning & Settings)';

  return {
    sprache: 'en',
    bezeichnung: 'English',

    wege: {
      /* "Quick Help" und "Device Self-Care" sind aus Ueberschriften
         erschlossen, nicht als Pfad belegt. */
      signalwerte: {
        geprueft: false,
        text: 'All Settings' + P + 'Support' + P + 'Quick Help' + P +
              'Device Self-Care' + P + 'RF/HDMI'
      },
      manuelleEinstellung: {
        geprueft: true,
        text: SENDER + P + 'Manual Tuning'
      },
      /* "Satellite Settings" ist abgeleitet. */
      satelliteneinstellungen: {
        geprueft: false,
        text: SENDER + P + 'Satellite Settings'
      },
      /* "Auto Tuning" und "Satellite Settings" sind abgeleitet. */
      unicable: {
        geprueft: false,
        text: SENDER + P + 'Auto Tuning' + P + 'Satellite Settings' +
              P + 'Unicable' + P + 'On' + P + 'Unicable Settings'
      }
    },

    punkte: {
      alleEinstellungen: { geprueft: true, text: 'All Settings' },
      manuelleEinstellung: { geprueft: true, text: 'Manual Tuning' },
      benutzer: { geprueft: true, text: 'User' }
    }
  };
}));
