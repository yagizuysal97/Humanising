// Ortak form motoru. Her rol sayfası (ik.html, surdurulebilirlik.html,
// muhendislik.html) kendi FORM_CONFIG objesini tanımlar, bu dosya
// kriterleri ekrana basar, puanlamayı ve gönderimi yönetir.

function initJuriForm(config){
  const container = document.getElementById('criteria-container');
  const maxes = {};

  config.criteria.forEach(c=>{
    maxes[c.id] = c.max;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="section-title"><span class="name">${escapeHtml(c.name)}</span><span class="max">/${c.max}</span></div>
      <p class="hint">${escapeHtml(c.question)}</p>
      <details class="levels">
        <summary>Performans seviyeleri</summary>
        <div class="level"><b>Düşük:</b> ${escapeHtml(c.low)}</div>
        <div class="level"><b>Orta:</b> ${escapeHtml(c.mid)}</div>
        <div class="level"><b>Yüksek:</b> ${escapeHtml(c.high)}</div>
      </details>
      <div class="score-control">
        <div class="stepper-btn" data-action="dec" data-target="${c.id}">–</div>
        <div class="score-track">
          <input type="range" id="${c.id}" min="0" max="${c.max}" value="0" step="1">
        </div>
        <div class="stepper-btn" data-action="inc" data-target="${c.id}">+</div>
        <div class="score-value" id="${c.id}_val">0</div>
      </div>
    `;
    container.appendChild(card);
  });

  const ids = Object.keys(maxes);

  function updateTotal(){
    let total = 0;
    ids.forEach(id=>{
      const v = parseInt(document.getElementById(id).value,10);
      document.getElementById(id+'_val').textContent = v;
      total += v;
    });
    document.getElementById('totalNum').innerHTML = total + '<span>/' + config.maxTotal + '</span>';
    document.getElementById('gaugeFill').style.width = (total / config.maxTotal * 100) + '%';
    return total;
  }

  ids.forEach(id=>{
    document.getElementById(id).addEventListener('input', updateTotal);
  });

  container.addEventListener('click', (e)=>{
    const btn = e.target.closest('.stepper-btn');
    if(!btn) return;
    const target = btn.dataset.target;
    const input = document.getElementById(target);
    const max = maxes[target];
    let v = parseInt(input.value,10);
    v += (btn.dataset.action === 'inc') ? 1 : -1;
    v = Math.max(0, Math.min(max, v));
    input.value = v;
    updateTotal();
  });

  function showToast(msg, isError){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.toggle('error', !!isError);
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 3200);
  }

  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const powerLine = document.getElementById('powerLine');

  submitBtn.addEventListener('click', async ()=>{
    const judge = document.getElementById('judge').value.trim();
    const team = document.getElementById('team').value.trim();

    if(!judge){ showToast('Lütfen jüri adınızı girin.', true); return; }
    if(!team){ showToast('Lütfen takım adını girin (örn. Takım-1).', true); return; }

    const scores = {};
    ids.forEach(id=>{ scores[id] = +document.getElementById(id).value; });
    const total = updateTotal();

    const payload = {
      role: config.role,
      timestamp: new Date().toISOString(),
      judge, team,
      scores,
      total,
      note: document.getElementById('note').value.trim()
    };

    if(typeof SCRIPT_URL === 'undefined' || SCRIPT_URL.includes('PASTE_YOUR')){
      showToast('Önce SCRIPT_URL ayarlanmalı (bkz. README, config.js).', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('sending');
    submitText.textContent = 'Gönderiliyor...';
    powerLine.classList.add('charging');

    try{
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify(payload)
      });
      showToast('⚡ Puan kaydedildi — ' + team);
      ids.forEach(id=>{ document.getElementById(id).value = 0; });
      document.getElementById('team').value = '';
      document.getElementById('note').value = '';
      updateTotal();
    }catch(err){
      showToast('Gönderilemedi, bağlantınızı kontrol edin.', true);
    }finally{
      submitBtn.disabled = false;
      submitBtn.classList.remove('sending');
      submitText.textContent = 'Puanı Gönder';
      setTimeout(()=>powerLine.classList.remove('charging'), 500);
    }
  });

  updateTotal();
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
