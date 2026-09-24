/* ============================================================
   Menuewege und Menuepunkte — deutsche Menuesprache
   ------------------------------------------------------------
   Diese Bezeichnungen sind Daten, keine Prosa. Sie stehen so in
   der offiziellen Bedienungsanleitung und werden nicht frei
   uebersetzt: Wer am Geraet nach einer erfundenen Bezeichnung
   sucht, findet nichts.

   wege    ganze Pfade, mit Pfeilen zwischen den Gliedern
   punkte  einzelne Menuepunkte, die im Fliesstext genannt werden

   Auch ein einzelner Punkt gehoert hierher und nicht als freier
   Text in die Quelldatei — sonst steht "Benutzer" in der
   englischen Fassung, waehrend der Weg daneben "User" sagt.

   geprueft: true  = Bezeichnung in der Anleitung belegt
   geprueft: false = abgeleitet oder unbelegt. Die Stelle wird
                     trotzdem in der Sprache der Fassung gezeigt
                     und traegt data-todo, damit die Pruefung am
                     Geraet nachgeholt werden kann.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.MENUE = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var P = ' → ';

  /* Die Zwischenstufe heisst in der Anleitung durchgehend so. Frueher
     stand an einer Stelle "Sendersuchlauf und Einstellungen" — diesen
     Punkt gibt es im Menue nicht. */
  var SENDER = 'Alle Einstellungen' + P + 'Allgemein' + P + 'Sender' + P +
    'Sendereinstellung (Programmsuche und -einstellungen)';

  return {
    sprache: 'de',
    bezeichnung: 'Deutsch',

    wege: {
      signalwerte: {
        geprueft: true,
        text: 'Alle Einstellungen' + P + 'Support' + P + 'Schnellhilfe' + P +
              'Selbstdiagnose und Pflege' + P + 'RF/HDMI'
      },
      manuelleEinstellung: {
        geprueft: true,
        text: SENDER + P + 'Manuelle Einstellung'
      },
      satelliteneinstellungen: {
        geprueft: true,
        text: SENDER + P + 'Satelliteneinstellungen'
      },
      unicable: {
        geprueft: true,
        text: SENDER + P + 'Autom. Einstellung' + P + 'Satelliteneinstellungen' +
              P + 'Unicable' + P + 'Ein' + P + 'Unicable-Einstellungen'
      }
    },

    punkte: {
      alleEinstellungen: { geprueft: true, text: 'Alle Einstellungen' },
      manuelleEinstellung: { geprueft: true, text: 'Manuelle Einstellung' },
      benutzer: { geprueft: true, text: 'Benutzer' }
    }
  };
}));
