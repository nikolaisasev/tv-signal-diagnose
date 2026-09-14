/* ============================================================
   TV — Diagnose-Handbuch
   Gemeinsames Skript aller Seiten.

   Drei Bausteine, jeder prüft zuerst, ob die von ihm benötigten
   Elemente auf der Seite vorhanden sind, und beendet sich sonst
   stillschweigend. Dieselbe Datei läuft deshalb auf der
   Fallübersicht ohne Navigation genauso fehlerfrei wie auf einer
   Fallseite ohne Rechner.

     1. Fortschrittsschiene, Sprungleiste, Zurück-nach-oben
     2. Überpegel-Rechner
     3. Erstaufnahme und Notiz
   ============================================================ */

/* ============================================================
   Fortschrittsschiene, Sprungleiste, Zurück-nach-oben
   ============================================================

   Die Navigation entsteht aus dem Markup der jeweiligen Seite:
   jedes <section class="sec" data-nav="..."> wird zu einem Punkt
   auf der Schiene und zu einem Eintrag in der Sprungleiste.
   Ein neuer Abschnitt in einer Fallseite erscheint dadurch ohne
   weiteres Zutun in der Navigation.

   Auf Seiten ohne Schiene — etwa der Fallübersicht — beendet sich
   der Baustein stillschweigend.
   ============================================================ */
(function(){
  'use strict';

  var rail     = document.querySelector('.rail');
  var railList = document.querySelector('.rail-list');
  var line     = document.querySelector('.rail-track');
  var fill     = document.querySelector('.rail-fill');
  var jump     = document.getElementById('jump');
  var topbar   = document.getElementById('topbar');
  var totop    = document.getElementById('totop');

  /* Zurück-nach-oben gibt es auch ohne Navigation */
  if(totop){
    totop.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var sections = [].slice.call(document.querySelectorAll('section.sec[data-nav]'));
  if(!sections.length){ return; }

  var items = [];
  var centers = [];
  var inView = [];
  var activeIndex = -1;
  var observer = null;

  /* ---------- Schiene aufbauen ---------- */
  if(railList){
    sections.forEach(function(sec){
      var li = document.createElement('li');
      li.className = 'rail-entry';

      var a = document.createElement('a');
      a.className = 'rail-item';
      a.href = '#' + sec.id;

      var dot = document.createElement('span');
      dot.className = 'rail-dot';
      dot.setAttribute('aria-hidden', 'true');

      var label = document.createElement('span');
      label.className = 'rail-label';
      label.textContent = sec.getAttribute('data-nav') || sec.id;

      a.appendChild(dot);
      a.appendChild(label);
      li.appendChild(a);
      railList.appendChild(li);
      items.push(a);
    });
  }

  /* ---------- Sprungleiste aufbauen ---------- */
  if(jump){
    while(jump.options.length > 1){ jump.remove(1); }
    sections.forEach(function(sec, i){
      var opt = document.createElement('option');
      opt.value = sec.id;
      opt.textContent = (i + 1) + ' · ' + (sec.getAttribute('data-nav') || sec.id);
      jump.appendChild(opt);
    });
    jump.selectedIndex = 0;
    jump.addEventListener('change', function(){
      var target = document.getElementById(jump.value);
      if(target){ target.scrollIntoView({ block: 'start' }); }
    });
  }

  /* ---------- Geometrie der Schiene ---------- */
  function measure(){
    if(!railList || !line || !items.length){ return; }
    centers = items.map(function(item){
      var dot = item.querySelector('.rail-dot');
      return dot ? dot.offsetTop + dot.offsetHeight / 2 : 0;
    });
    var first = centers[0];
    var last  = centers[centers.length - 1];
    line.style.top = first + 'px';
    line.style.height = Math.max(0, last - first) + 'px';
    paintFill();
  }

  function paintFill(){
    if(!fill || !centers.length){ return; }
    var i = activeIndex < 0 ? 0 : activeIndex;
    fill.style.height = Math.max(0, (centers[i] || 0) - centers[0]) + 'px';
  }

  /* ---------- Aktiven Abschnitt setzen ---------- */
  function setActive(index){
    if(index === activeIndex){ return; }
    activeIndex = index;

    items.forEach(function(item, i){
      item.classList.remove('is-done', 'is-active');
      if(i < index){ item.classList.add('is-done'); }
      else if(i === index){
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'true');
      }
      if(i !== index){ item.removeAttribute('aria-current'); }
    });

    paintFill();
    if(jump && sections[index]){ jump.value = sections[index].id; }
  }

  /* ---------- Beobachter: oberster Abschnitt im oberen Drittel ----------
     Der Bereich beginnt unterhalb der klebenden Kopfleiste, damit der
     vorangehende Abschnitt nicht mit seiner letzten Zeile gewinnt.      */
  function bandMargin(){
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var barH = topbar ? topbar.offsetHeight : 0;
    var top = barH + 8;
    var bottom = Math.max(top + 48, Math.round(vh / 3));
    if(bottom >= vh){ bottom = Math.max(1, vh - 1); }
    if(top >= bottom){ top = Math.max(0, bottom - 1); }
    return '-' + top + 'px 0px -' + Math.max(0, vh - bottom) + 'px 0px';
  }

  function observe(){
    if(observer){ observer.disconnect(); observer = null; }
    if(typeof window.IntersectionObserver !== 'function'){ return; }

    inView = sections.map(function(){ return false; });

    observer = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var i = sections.indexOf(e.target);
        if(i >= 0){ inView[i] = e.isIntersecting; }
      });
      var idx = inView.indexOf(true);
      if(idx >= 0){ setActive(idx); }
    }, { rootMargin: bandMargin(), threshold: 0 });

    sections.forEach(function(sec){ observer.observe(sec); });
  }

  var resizeTimer = null;
  window.addEventListener('resize', function(){
    if(resizeTimer){ window.clearTimeout(resizeTimer); }
    resizeTimer = window.setTimeout(function(){
      measure();
      observe();   /* rootMargin haengt an der Fensterhoehe */
    }, 150);
  });

  measure();
  setActive(0);
  observe();
})();



/* ============================================================
   Überpegel-Rechner
   ------------------------------------------------------------
   Nur noch Bedienung: Felder ein- und ausblenden, Werte einlesen,
   Ergebnis anzeigen. Schwellen, Klassifizierung und Diagnosetexte
   stehen in assets/grenzwerte.js und werden dort auch getestet.

   Fehlt der Rechner auf der Seite oder ist grenzwerte.js nicht
   geladen, beendet sich der Baustein stillschweigend.
   ============================================================ */
(function(){
  var $=function(id){return document.getElementById(id);};
  var pick=function(n){var e=document.querySelector('input[name="'+n+'"]:checked');return e?e.value:null;};
  var out=$('out');
  var D=window.DIAGNOSE;
  if(!out||!$('go')||!D){return;}

  /* Welche Felder zu welcher Empfangsart gehören — die einzige
     Zuordnung, die hier bleibt. Zahlen stehen keine mehr in dieser Datei. */
  var FELDER={ sat:['i-pg','i-snr'], kabel:['i-kpg','i-mer'] };

  function sync(){
    var art=pick('art');
    $('f-satdb').classList.toggle('hidden', art!=='sat');
    $('f-kabel').classList.toggle('hidden', art!=='kabel');
    out.classList.add('hidden');
    /* Ergebnis ist nicht mehr sichtbar, also auch nicht mehr in der Notiz */
    publish(null);
  }
  document.querySelectorAll('input[name="art"]').forEach(function(el){
    el.addEventListener('change', sync);
  });
  sync();

  function publish(detail){
    try{ document.dispatchEvent(new CustomEvent('tv:calc',{detail:detail})); }
    catch(e){ /* ohne CustomEvent-Unterstuetzung entfaellt nur die Notiz */ }
  }

  function liste(schritte){
    return '<div class="aktion"><p class="aktion-t">Jetzt prüfen</p><ul>'+
      schritte.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></div>';
  }

  /* Messwerte in die Zwischenablage. Erst der moderne Weg, sonst der
     alte über ein kurzlebiges Textfeld — die Seite laeuft auch lokal
     aus dem Dateisystem, wo navigator.clipboard fehlen kann. */
  var ZEICHEN_KOPIEREN='<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">'+
    '<rect x="5.5" y="1.5" width="9" height="11" rx="1.5"/>'+
    '<path d="M10.5 14.5h-8a1 1 0 0 1-1-1v-9"/></svg>';
  var ZEICHEN_FERTIG='<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">'+
    '<path d="M2.5 8.5l4 4 7-9"/></svg>';

  function kopiere(text, knopf){
    function fertig(ok){
      knopf.innerHTML = ok ? ZEICHEN_FERTIG : ZEICHEN_KOPIEREN;
      knopf.setAttribute('aria-label', ok ? 'Messwerte kopiert' : 'Kopieren nicht möglich');
      knopf.setAttribute('data-fertig', ok ? 'ja' : 'nein');
      window.setTimeout(function(){
        knopf.innerHTML=ZEICHEN_KOPIEREN;
        knopf.setAttribute('aria-label','Messwerte kopieren');
        knopf.removeAttribute('data-fertig');
      }, 2000);
    }
    function ersatz(){
      try{
        var feld=document.createElement('textarea');
        feld.value=text;
        feld.setAttribute('readonly','');
        feld.className='sr-only';
        document.body.appendChild(feld);
        feld.select();
        var ok=document.execCommand('copy');
        document.body.removeChild(feld);
        fertig(!!ok);
      } catch(e){ fertig(false); }
    }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(function(){ fertig(true); }, ersatz);
        return;
      }
    } catch(e){ /* faellt unten auf execCommand zurueck */ }
    ersatz();
  }

  /* Befund, Begründung, Klassifizierung beider Messwerte, Schritte. */
  function zeigeDiagnose(d){
    out.className='ergebnis';
    out.innerHTML=
      '<div class="urteil urteil--'+d.zustand+'">'+
      '<p class="urteil-befund">'+d.befund+'</p>'+
      '<p class="urteil-warum">'+d.warum+'</p></div>'+
      '<p class="urteil-werte"><span>'+d.messwerte+'</span>'+
      '<button type="button" class="werte-kopieren" aria-label="Messwerte kopieren" '+
      'title="Messwerte kopieren">'+ZEICHEN_KOPIEREN+'</button></p>'+
      liste(d.schritte);
    out.classList.remove('hidden');
    var knopf=out.querySelector('.werte-kopieren');
    knopf.addEventListener('click', function(){ kopiere(d.messwerte, knopf); });
    publish(d.zustand==='unklar' ? null : {dx:d.befund, vals:d.messwerte});
  }

  /* Fehlende oder unmögliche Eingaben sind kein Befund und keine Notiz. */
  function zeigeHinweis(befund, schritte){
    out.className='ergebnis';
    out.innerHTML='<div class="urteil urteil--unklar">'+
      '<p class="urteil-befund">'+befund+'</p></div>'+liste(schritte);
    out.classList.remove('hidden');
    publish(null);
  }

  function num(id){var v=$(id).value.trim();return v===''?null:parseFloat(v);}

  $('go').addEventListener('click',function(){
    var art=pick('art'), felder=FELDER[art];
    var pegel=num(felder[0]), rausch=num(felder[1]);

    var fehler=D.pruefeWertebereich(art, pegel, rausch);
    if(fehler){ zeigeHinweis(fehler.meldung, fehler.schritte); return; }

    if(pegel===null||rausch===null){
      zeigeHinweis('Werte fehlen.',[
        'Pegel und Rauschabstand eintragen.',
        'Beide stehen unter Support → Schnellhilfe → Selbstdiagnose und Pflege → RF/HDMI.'
      ]);
      return;
    }

    zeigeDiagnose(D.diagnose(art, pegel, rausch));
  });

  var resetBtn=$('reset');
  if(resetBtn){
    resetBtn.addEventListener('click',function(){
      ['i-pg','i-snr','i-kpg','i-mer'].forEach(function(id){
        var el=$(id);
        if(el){el.value='';}
      });
      out.classList.add('hidden');
      publish(null);
    });
  }
})();


/* ============================================================
   Erstaufnahme und Notiz
   ============================================================

   ZU PRÜFEN — die Antwortoptionen unten sind der einzige Teil dieser
   Datei, der nicht aus dem Handbuch stammt. Sie sind aus dem vorhandenen
   Text abgeleitet, aber neu formuliert. Wer sich mit diesen Faellen
   auskennt, sollte sie durchgehen und korrigieren.

   Die Hinweistexte (hint) sind dagegen wörtlich aus dem Handbuch
   übernommen — Phase 2, Abschnitt 4 bzw. die Merksätze.

   Aufbau einer Frage:
     pre    Vorsatz für die Notiz
     groups Gruppen von Auswahlflächen; multi erlaubt Mehrfachwahl
     opt    v    = Beschriftung
            n    = Text für die Notiz (sonst v)
            full = ersetzt die ganze Antwort durch einen fertigen Satz
            solo = schließt die übrigen Optionen der Gruppe aus
            hint = {t: Hinweis, sec: Ziel-Abschnitt}
     text   Freitextfeld — jede Frage hat eines
   ============================================================ */
(function(){
  'use strict';

  var QUESTIONS = {

    /* ---------- beide Spuren ---------- */
    aenderung: {
      pre: 'Kurz vor dem Problem: ',
      groups: [{ multi: true, legend: 'Was war kurz vor dem Problem?', opt: [
        {v:'Neues Gerät'}, {v:'Update'}, {v:'Umzug'}, {v:'Renovierung'},
        {v:'Handwerker im Haus'}, {v:'Neuer Router'}, {v:'Neuer Tarif'},
        {v:'Sturm'}, {v:'Werksreset'},
        {v:'Nichts bekannt', solo:true, full:'Problem trat plötzlich auf, keine Änderung kurz davor'}
      ]}],
      text: { label: 'Was genau, und wie lange her?', placeholder: 'z. B. neuer Receiver seit zwei Wochen' }
    },

    /* ---------- Spur: Empfang ---------- */
    empfangsart: {
      pre: 'Empfang: ',
      groups: [{ legend: 'Empfangsart', opt: [
        {v:'Satellit'}, {v:'Kabel'}
      ]}],
      text: { label: 'Anbieter', placeholder: 'z. B. Vodafone' }
    },
    vorher: {
      pre: 'Vorgeschichte: ',
      groups: [{ legend: 'Lief es vorher?', opt: [
        {v:'lief jahrelang', hint:{t:'Keine Konfiguration. Die ändert sich nicht von selbst'}},
        {v:'lief bisher störungsfrei'},
        {v:'war noch nie in Ordnung'}
      ]}],
      text: { label: 'Seit wann gestört?', placeholder: 'z. B. seit etwa drei Wochen' }
    },
    andereGeraet: {
      pre: 'Anderes Gerät an derselben Dose: ',
      groups: [{ legend: 'Anderes Gerät an derselben Dose?', opt: [
        /* Nur bei "läuft" der Sprung in den eigenen Abschnitt — die anderen
           beiden Antworten führen dort nicht weiter. */
        {v:'läuft', hint:{label:'Anderes Gerät läuft problemlos', sec:'anderesgeraet'}},
        {v:'läuft ebenfalls nicht'},
        {v:'nicht geprüft'}
      ]}],
      text: { label: 'Welches Gerät?', placeholder: 'z. B. Receiver im Schlafzimmer' }
    },
    haus: {
      pre: 'Gebäude: ',
      groups: [{ legend: 'Gebäude', opt: [
        {v:'Einfamilienhaus'}, {v:'Mehrfamilienhaus'}
      ]}],
      text: { label: 'Wie viele Parteien?', placeholder: 'z. B. 12 Parteien' }
    }
  };

  /* ------------------------------------------------------------
     Zustand — bewusst nur für die laufende Sitzung.
     Kein localStorage: sonst startet der nächste Durchgang mit den
     Angaben des vorherigen, und die stehen dann in der falschen Notiz.
     ------------------------------------------------------------ */
  var ANSWERS = {};
  var CALC = null;
  var instances = {};   /* qid -> [{host, btn, panel, answerEl}] */

  function el(tag, cls, txt){
    var n = document.createElement(tag);
    if(cls){ n.className = cls; }
    if(txt != null){ n.textContent = txt; }
    return n;
  }
  function state(qid){
    if(!ANSWERS[qid]){ ANSWERS[qid] = { sel: [], text: '', texts: {} }; }
    if(!ANSWERS[qid].texts){ ANSWERS[qid].texts = {}; }
    return ANSWERS[qid];
  }
  /* Notizen zu abgewählten Optionen verwerfen */
  function pruneTexts(s){
    var keep = {};
    s.sel.forEach(function(v){
      if(s.texts[v] != null && s.texts[v] !== ''){ keep[v] = s.texts[v]; }
    });
    s.texts = keep;
  }
  function options(cfg){
    var all = [];
    (cfg.groups || []).forEach(function(g){ g.opt.forEach(function(o){ all.push(o); }); });
    return all;
  }
  function findOpt(cfg, v){
    var hit = null;
    options(cfg).forEach(function(o){ if(o.v === v){ hit = o; } });
    return hit;
  }
  /* Gewählte Optionen in der Reihenfolge der Konfiguration, nicht der Klicks */
  function selectedInOrder(cfg, a){
    return options(cfg)
      .map(function(o){ return o.v; })
      .filter(function(v){ return a.sel.indexOf(v) >= 0; });
  }

  /* Wert einer Frage als Notiz-Text */
  function valueOf(qid){
    var cfg = QUESTIONS[qid], a = ANSWERS[qid];
    if(!cfg || !a){ return ''; }
    var txt = (a.text || '').trim();
    var pre = cfg.pre || '';

    /* Eine Option mit fertigem Satz ersetzt die ganze Antwort */
    var full = null;
    a.sel.forEach(function(v){
      var o = findOpt(cfg, v);
      if(o && o.full){ full = o.full; }
    });
    if(full){ return txt ? full + ' (' + txt + ')' : full; }

    /* Eigenes Feld je gewählter Option: "HDMI 2 (PS5), Optischer Ausgang (Soundbar)" */
    if(cfg.perOption){
      var parts = selectedInOrder(cfg, a).map(function(v){
        var t = ((a.texts && a.texts[v]) || '').trim();
        return t ? v + ' (' + t + ')' : v;
      });
      return parts.length ? pre + parts.join(', ') : '';
    }

    var labels = a.sel.map(function(v){
      var o = findOpt(cfg, v);
      return (o && o.n) || v;
    });
    if(labels.length && txt){ return pre + labels.join(', ') + ' (' + txt + ')'; }
    if(labels.length){ return pre + labels.join(', '); }
    if(txt){ return pre + txt; }
    return '';
  }

  function hintsOf(qid){
    var cfg = QUESTIONS[qid], a = ANSWERS[qid];
    if(!cfg || !a){ return []; }
    var list = [];
    a.sel.forEach(function(v){
      var o = findOpt(cfg, v);
      if(o && o.hint && list.indexOf(o.hint) === -1){ list.push(o.hint); }
    });
    return list;
  }

  /* Antwort auf die Empfangsart stellt den Rechner passend ein. */
  function applyEmpfangsart(){
    var sel = (ANSWERS.empfangsart && ANSWERS.empfangsart.sel) || [];
    var mode = sel.indexOf('Satellit') >= 0 ? 'sat'
             : sel.indexOf('Kabel') >= 0 ? 'kabel' : null;
    if(!mode){ return; }
    var radio = document.querySelector('input[name="art"][value="' + mode + '"]');
    if(!radio || radio.checked){ return; }
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function secLabel(id){
    var sec = document.getElementById(id);
    if(!sec){ return ''; }
    var num = sec.querySelector('.sec-num');
    return num ? num.textContent : '';
  }

  /* Eine Gruppe von Auswahlflächen. Wird von der Frageliste und vom
     Entscheidungsblock gemeinsam benutzt, damit beide Ansichten
     zwangsläufig gleich aussehen und sich gleich verhalten. */
  function chipGroup(qid, g){
    var group = el('div', 'q-group');
    if(g.legend){ group.appendChild(el('p', 'q-legend', g.legend)); }
    var chips = el('div', 'q-chips');
    g.opt.forEach(function(o){
      var chip = el('button', 'chip', o.v);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', 'false');
      chip.setAttribute('data-opt', o.v);
      chip.addEventListener('click', function(){
        var s = state(qid);
        var on = s.sel.indexOf(o.v) >= 0;
        var inGroup = g.opt.map(function(x){ return x.v; });
        if(g.multi && !o.solo){
          /* Ausschliessende Optionen wie "Nichts bekannt" weichen */
          var solos = g.opt.filter(function(x){ return x.solo; }).map(function(x){ return x.v; });
          s.sel = s.sel.filter(function(v){ return solos.indexOf(v) < 0; });
          s.sel = on ? s.sel.filter(function(v){ return v !== o.v; }) : s.sel.concat([o.v]);
        } else {
          s.sel = s.sel.filter(function(v){ return inGroup.indexOf(v) < 0; });
          if(!on){ s.sel = s.sel.concat([o.v]); }
        }
        pruneTexts(s);
        refresh(qid);
        if(qid === 'empfangsart'){ applyEmpfangsart(); }
      });
      chips.appendChild(chip);
    });
    group.appendChild(chips);
    return group;
  }

  /* Ein Panel oder ein Entscheidungsblock gehört in die Frage, wenn sie ein
     Listenpunkt ist, sonst unmittelbar dahinter. Beide Aufrufer müssen
     dieselbe Regel benutzen, sonst rutscht der Block aus der Liste. */
  function platziere(host, node){
    if(host.tagName === 'LI'){ host.appendChild(node); }
    else { host.parentNode.insertBefore(node, host.nextSibling); }
  }

  /* ---------- Aufbau einer Frage ---------- */
  function build(host){
    var qid = host.getAttribute('data-q');
    var cfg = QUESTIONS[qid];
    if(!cfg){ return; }

    var panelId = 'qp-' + qid + '-' + ((instances[qid] || []).length + 1);

    var btn = el('button', 'q-toggle');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', panelId);
    var label = el('span', 'q-text');
    label.innerHTML = host.innerHTML;
    var caret = el('span', 'q-caret');
    caret.setAttribute('aria-hidden', 'true');
    var answerEl = el('span', 'q-answer hidden');
    btn.appendChild(label);
    btn.appendChild(caret);
    btn.appendChild(answerEl);
    host.innerHTML = '';
    host.appendChild(btn);

    var panel = el('div', 'q-panel');
    panel.id = panelId;
    panel.hidden = true;

    /* Gibt es auf der Seite einen Entscheidungsblock zu dieser Frage, führt
       er die Auswahl. Dann hier keine zweiten Auswahlflächen und kein
       zweiter Hinweis — sonst stünde dasselbe doppelt auf der Seite. */
    var ausgelagert = hasEntscheidung(qid);
    if(!ausgelagert){
      (cfg.groups || []).forEach(function(g){
        panel.appendChild(chipGroup(qid, g));
      });
    }

    if(cfg.text){
      var field = el('div', 'q-text-field');
      var inputId = 'qt-' + panelId;
      var lab = el('label', null, cfg.text.label);
      lab.setAttribute('for', inputId);
      var input = el('input');
      input.type = 'text';
      input.id = inputId;
      input.placeholder = cfg.text.placeholder || '';
      input.addEventListener('input', function(){
        state(qid).text = input.value;
        refresh(qid);
      });
      field.appendChild(lab);
      field.appendChild(input);
      panel.appendChild(field);
    }

    /* Nimmt je gewählter Option ein eigenes Feld auf */
    var portBox = null;
    if(cfg.perOption){
      portBox = el('div', 'q-ports');
      panel.appendChild(portBox);
    }

    var hintBox = el('div', 'q-hint hidden');
    if(!ausgelagert){ panel.appendChild(hintBox); }

    platziere(host, panel);

    btn.addEventListener('click', function(){
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });

    if(!instances[qid]){ instances[qid] = []; }
    instances[qid].push({ host: host, btn: btn, panel: panel, answer: answerEl, hint: hintBox, ports: portBox, panelId: panelId });
  }

  /* Felder je gewählter Option anlegen oder entfernen.
     Baut nur neu, wenn sich die Auswahl geändert hat — sonst
     verlöre das Feld beim Tippen den Fokus. */
  function syncPortFields(qid, inst){
    var cfg = QUESTIONS[qid];
    if(!cfg || !cfg.perOption || !inst.ports){ return; }
    var a = state(qid);
    var wanted = selectedInOrder(cfg, a).filter(function(v){
      var o = findOpt(cfg, v);
      return !(o && o.full);   /* "nichts angeschlossen" braucht kein Feld */
    });
    var current = [].slice.call(inst.ports.children).map(function(row){
      return row.getAttribute('data-port');
    });
    if(current.join(' ') === wanted.join(' ')){ return; }

    inst.ports.innerHTML = '';
    wanted.forEach(function(v, i){
      var o = findOpt(cfg, v) || {};
      var row = el('div', 'q-port');
      row.setAttribute('data-port', v);
      var id = 'qp-' + inst.panelId + '-p' + i;
      var lab = el('label', null, v);
      lab.setAttribute('for', id);
      var input = el('input');
      input.type = 'text';
      input.id = id;
      input.placeholder = o.ph || cfg.perOption.placeholder || '';
      input.value = (a.texts && a.texts[v]) || '';
      input.addEventListener('input', function(){
        state(qid).texts[v] = input.value;
        refresh(qid);
      });
      row.appendChild(lab);
      row.appendChild(input);
      inst.ports.appendChild(row);
    });
  }

  /* ---------- Anzeige einer Frage auffrischen ---------- */
  function refresh(qid){
    var value = valueOf(qid);
    var hints = hintsOf(qid);
    (instances[qid] || []).forEach(function(inst){
      inst.answer.textContent = value;
      inst.answer.classList.toggle('hidden', !value);

      inst.panel.querySelectorAll('.chip').forEach(function(chip){
        var on = ANSWERS[qid] && ANSWERS[qid].sel.indexOf(chip.getAttribute('data-opt')) >= 0;
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var input = inst.panel.querySelector('.q-text-field input[type="text"]');
      if(input && ANSWERS[qid] && input.value !== ANSWERS[qid].text){
        input.value = ANSWERS[qid].text;
      }

      syncPortFields(qid, inst);

      inst.hint.innerHTML = '';
      if(hints.length){
        hints.forEach(function(h){
          /* Ein Hinweis darf reine Navigation sein: ohne Text und mit
             eigener Beschriftung statt der Abschnittsnummer. */
          var p = el('p', null, h.t ? h.t + ' ' : '');
          p.style.margin = '0';
          var label = h.label || secLabel(h.sec);
          if(label){
            var a = el('a', null, '→ ' + label);
            a.href = '#' + h.sec;
            p.appendChild(a);
          }
          inst.hint.appendChild(p);
        });
        inst.hint.classList.remove('hidden');
      } else {
        inst.hint.classList.add('hidden');
      }
    });
    syncEntscheidung(qid);
    updateMemos();
  }

  /* ---------- Entscheidungsblock ----------
     Ein <div data-entscheidung="QID"> ist eine zweite Ansicht auf denselben
     Zustand wie die Frage mit data-q="QID" — immer sichtbar im Lesefluss
     statt hinter einem Klick.

     Die Auswahlflächen baut chipGroup aus derselben Konfiguration wie die
     Frageliste. Dadurch sehen beide Ansichten gleich aus, und die
     Beschriftungen stehen nur an einer Stelle. Im Markup steht nur, welcher
     Hinweis zu welcher Antwort gehört: <* data-fuer="Beschriftung">.
     Fehlt der Block auf der Seite, passiert nichts. */
  function entscheidungen(qid){
    return [].slice.call(document.querySelectorAll('[data-entscheidung="' + qid + '"]'));
  }
  function hasEntscheidung(qid){
    return !!document.querySelector('[data-entscheidung="' + qid + '"]');
  }

  function syncEntscheidung(qid){
    var sel = (ANSWERS[qid] && ANSWERS[qid].sel) || [];
    entscheidungen(qid).forEach(function(box){
      box.querySelectorAll('.chip').forEach(function(chip){
        chip.setAttribute('aria-pressed', sel.indexOf(chip.getAttribute('data-opt')) >= 0 ? 'true' : 'false');
      });
      box.querySelectorAll('[data-fuer]').forEach(function(h){
        h.classList.toggle('hidden', sel.indexOf(h.getAttribute('data-fuer')) < 0);
      });
    });
  }

  function buildEntscheidungen(){
    document.querySelectorAll('[data-entscheidung]').forEach(function(box){
      var qid = box.getAttribute('data-entscheidung');
      var cfg = QUESTIONS[qid];
      if(!cfg){ return; }
      var panel = el('div', 'q-panel');
      (cfg.groups || []).forEach(function(g){
        panel.appendChild(chipGroup(qid, g));
      });
      box.insertBefore(panel, box.firstChild);

      /* Der Block gehört in das Panel seiner Frage: sichtbar erst, wenn die
         Frage angeklickt wurde. Gibt es keine passende Frage, bleibt er
         stehen, wo er im Markup steht. */
      var inst = (instances[qid] || [])[0];
      if(inst && inst.panel){ inst.panel.appendChild(box); }
    });
  }

  /* ---------- Notiz ---------- */
  function noteFor(){
    var seen = [], parts = [], hints = [];
    document.querySelectorAll('[data-q]').forEach(function(host){
      var qid = host.getAttribute('data-q');
      if(seen.indexOf(qid) >= 0){ return; }
      seen.push(qid);
      var v = valueOf(qid);
      if(v){ parts.push(v); }
      hintsOf(qid).forEach(function(h){
        /* Ohne eigenen Text ist der Hinweis nur ein Sprunglink — der
           gehoert nicht in die Notiz. */
        if(!h.t){ return; }
        var label = secLabel(h.sec);
        var line = h.t + (label ? ' (' + label + ')' : '');
        if(hints.indexOf(line) < 0){ hints.push(line); }
      });
    });

    var calc = null;
    if(CALC && document.getElementById('out')){
      calc = 'Rechner: ' + (CALC.vals ? CALC.vals + ' → ' : '') + CALC.dx;
    }
    if(!parts.length && !calc){ return ''; }

    var lines = [];
    var fall = document.querySelector('[data-fall]');
    var titel = fall ? fall.getAttribute('data-fall') : '';
    lines.push((titel ? [titel] : []).concat(parts).join(' | '));
    if(calc){ lines.push(''); lines.push(calc); }
    if(hints.length){ lines.push(''); lines.push('→ Richtung: ' + hints.join(' · ')); }
    return lines.join('\n');
  }

  function fit(out){
    var lines = out.value.split('\n').length;
    out.rows = Math.min(14, Math.max(4, lines + 1));
  }

  function updateMemos(){
    document.querySelectorAll('[data-memo]').forEach(function(memo){
      var out = memo.querySelector('.memo-out');
      if(!out){ return; }
      var rebuild = memo.querySelector('[data-memo-rebuild]');
      var generated = noteFor();
      var edited = memo.getAttribute('data-edited') === 'true';

      /* Von Hand bearbeitete Notizen werden nicht überschrieben */
      if(!edited){ out.value = generated; }
      if(rebuild){ rebuild.classList.toggle('hidden', !edited || !generated); }

      fit(out);
      memo.classList.toggle('has-content', !!out.value.trim());
    });

    var jump = document.getElementById('memoJump');
    if(jump){
      jump.classList.toggle('hidden', !document.querySelector('.memo.has-content'));
    }
  }

  function copyMemo(memo){
    var out = memo.querySelector('.memo-out');
    var status = memo.querySelector('.memo-status');
    function done(ok){
      status.textContent = ok
        ? 'In die Zwischenablage kopiert.'
        : 'Kopieren nicht möglich. Text oben markieren und mit Strg+C bzw. Cmd+C kopieren.';
      status.classList.toggle('is-warn', !ok);
    }
    function fallback(){
      try{
        out.focus();
        out.setSelectionRange(0, out.value.length);
        done(!!document.execCommand('copy'));
      } catch(e){ done(false); }
    }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(out.value).then(function(){ done(true); }, fallback);
        return;
      }
    } catch(e){ /* faellt unten auf execCommand zurueck */ }
    fallback();
  }

  /* Alle Ansichten auffrischen. Die Entscheidungsblöcke stehen bewusst
     getrennt: eine Frage ohne eigene Felder hat keine Instanz, ihr Block
     bliebe sonst nach dem Reset gewählt. */
  function refreshAll(){
    Object.keys(instances).forEach(refresh);
    document.querySelectorAll('[data-entscheidung]').forEach(function(box){
      syncEntscheidung(box.getAttribute('data-entscheidung'));
    });
  }


  /* ---------- Verdrahtung ---------- */
  if(!document.querySelector('[data-q]') && !document.querySelector('[data-memo]')){ return; }
  document.querySelectorAll('[data-q]').forEach(build);
  buildEntscheidungen();
  refreshAll();

  document.querySelectorAll('[data-memo-copy]').forEach(function(btn){
    btn.addEventListener('click', function(){ copyMemo(btn.closest('.memo')); });
  });

  /* Von Hand bearbeitete Notiz merken, damit neue Antworten sie nicht löschen */
  document.querySelectorAll('[data-memo]').forEach(function(memo){
    var out = memo.querySelector('.memo-out');
    out.addEventListener('input', function(){
      memo.setAttribute('data-edited', 'true');
      fit(out);
      memo.classList.toggle('has-content', !!out.value.trim());
      var rebuild = memo.querySelector('[data-memo-rebuild]');
      if(rebuild){ rebuild.classList.remove('hidden'); }
    });
    var rebuild = memo.querySelector('[data-memo-rebuild]');
    if(rebuild){
      rebuild.addEventListener('click', function(){
        memo.setAttribute('data-edited', 'false');
        memo.querySelector('.memo-status').textContent = '';
        updateMemos();
        out.focus();
      });
    }
  });

  document.addEventListener('tv:calc', function(e){
    CALC = e.detail || null;
    updateMemos();
  });

  var jump = document.getElementById('memoJump');
  if(jump){
    jump.addEventListener('click', function(){
      var memo = document.querySelector('[data-memo]');
      if(memo){ memo.scrollIntoView({ block: 'start' }); }
    });
  }

  updateMemos();
})();


/* ============================================================
   Dämpfungsrechner
   ------------------------------------------------------------
   Zwei Eingaben, eine Auskunft. Ausgegeben wird eine Spanne, nicht
   ein Einzelwert: Der Dämpfungsbelag hängt vom Kabeltyp ab, und der
   wird bewusst nicht abgefragt — er ist in aller Regel nicht bekannt.

   Kein Soll-Ist-Vergleich mehr: Pegel an zwei Punkten der Anlage
   liegen praktisch nie vor.

   Eigenes Modul mit eigenen IDs, keine gemeinsame Logik mit dem
   Hauptrechner. Fehlen die Elemente, beendet es sich stillschweigend.
   ============================================================ */
(function(){
  var $=function(id){return document.getElementById(id);};
  var pick=function(n){var e=document.querySelector('input[name="'+n+'"]:checked');return e?e.value:null;};
  var out=$('kd-out');
  if(!out || !$('kd-go')){ return; }

  /* Belag in dB je 100 m, als Spanne — dieselben Richtwerte wie in der
     Tabelle im Abschnitt darüber. Wer sie dort ändert, muss hier nachziehen. */
  var BELAG={ sat:[20,30], kabel:[14,19] };
  var LAENGE_MIN=1, LAENGE_MAX=300;

  function zeige(zustand, urteil, schritte){
    out.className='ergebnis kdcalc-out';
    out.innerHTML=
      '<div class="urteil urteil--'+zustand+'">'+
      '<p class="urteil-befund">'+urteil+'</p></div>'+
      '<div class="aktion"><p class="aktion-t">Jetzt prüfen</p><ul>'+
      schritte.map(function(x){return '<li>'+x+'</li>';}).join('')+
      '</ul></div>';
  }

  $('kd-go').addEventListener('click',function(){
    var v=$('kd-laenge').value.trim();
    var laenge=v===''?null:parseFloat(v);

    if(laenge===null || isNaN(laenge)){
      zeige('unklar','Länge eintragen, 1 bis 300 Meter.',[
        'Kabellänge in Metern eintragen — eine Schätzung genügt.',
        'Frequenzbereich wählen: Satellit oder Kabel.'
      ]);
      out.classList.remove('hidden');
      return;
    }

    /* Wie im Hauptrechner: die Meldung benennt Feld, Wert und Bereich */
    if(laenge<LAENGE_MIN || laenge>LAENGE_MAX){
      zeige('unklar','Kabellänge '+laenge+' m ist nicht möglich. Gültig: '+
        LAENGE_MIN+' bis '+LAENGE_MAX+' m.',[
        'Länge erneut schätzen — gemeint ist der Weg von der Dose zum Gerät.',
        'Bei sehr langen Wegen die Anlage abschnittsweise betrachten.'
      ]);
      out.classList.remove('hidden');
      return;
    }

    var b=BELAG[pick('kd-frequenz')] || BELAG.sat;
    var dMin=Math.round(b[0]*laenge/100);
    var dMax=Math.round(b[1]*laenge/100);

    zeige('info','Erwartete Kabeldämpfung: '+dMin+' bis '+dMax+' dB.',[
      'Verteiler und Dosen dämpfen zusätzlich — je Verteilerausgang 4 bis 8 dB, je Dose 2 bis 6 dB.',
      'Richtwerte. Der tatsächliche Belag steht im Datenblatt des Kabels.'
    ]);
    out.classList.remove('hidden');
  });

  $('kd-reset').addEventListener('click',function(){
    $('kd-laenge').value='';
    out.classList.add('hidden');
  });
})();
