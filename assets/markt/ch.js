/* ============================================================
   Markt Schweiz
   ------------------------------------------------------------
   Tatsachen, die vom Land abhaengen — nicht von der Sprache und
   nicht von der Physik. Schwellen stehen in grenzwerte.js,
   Menuewege in assets/menue/, Fliesstext in quelle/.

   Dieselbe Datei wird im Browser per script src geladen und im
   Generator per require gelesen. Kein fetch: unter file:// ist es
   gesperrt.

   Werte, die in allen Maerkten gleich sind, stehen trotzdem in
   jeder Datei. Wer spaeter abweicht, findet die Stelle bereits
   vor und muss sie nicht erst anlegen.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.MARKT = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    kennung: 'ch',
    bezeichnung: 'Schweiz',

    /* Jeder Schluessel traegt seine Art:

       name     Eigenname, Marke, Produkt, Satellitenposition. Ein
                Wert, in allen Sprachen derselbe.
       begriff  Berufsbezeichnung, Rolle, beschreibender Ausdruck.
                Ein Wert je Seitensprache.

       Ohne diese Unterscheidung stuende in der englischen Fassung
       "allocated by the Antennenbauer". */
    werte: {
      satellit: { art: 'name', wert: 'Astra 19,2° Ost' },
      kabelanbieter: { art: 'name', wert: 'Sunrise, Quickline' },
      satVerschluesselung: { art: 'begriff', de: '—', en: '—' },
      dvbt2Dienst: { art: 'begriff', de: 'abgeschaltet seit 2019', en: 'switched off since 2019' },
      zustaendigSat: { art: 'begriff', de: 'Antennenbauer', en: 'antenna installer' },
      zustaendigKabel: { art: 'begriff', de: 'Sunrise oder Quickline', en: 'Sunrise or Quickline' }
    },

    /* Bloecke werden zwischen Markierungen eingesetzt, weil sie
       aus mehreren Zeilen bestehen. */
    bloecke: {
      transponder: [
        '11494 MHz · H · SR 22000 · DVB-S2 — Das Erste HD, frei',
        '11362 MHz · H · SR 22000 · DVB-S2 — ZDF HD, frei',
        '12188 MHz · H · SR 27500 · DVB-S — RTL-Familie SD, frei'
      ]
    },

    /* Schluessel, die absichtlich noch nicht im Text stehen. Ohne
       diese Liste meldete der Test sie als totes Material; mit ihr
       meldet er jeden anderen ungenutzten Schluessel weiterhin. */
    reserviert: ['kabelanbieter', 'satVerschluesselung', 'dvbt2Dienst', 'zustaendigKabel']
  };
}));
