/* ตัวช่วยร่วมทุกหน้า: เมนู ช่องเลือกชื่อ (จำชื่อไว้ในเครื่อง) เลขเวอร์ชัน */
window.APP_VERSION = 'v27';
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var TR = window.TR = { $: $ };
  TR.esc = function (x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  TR.run = function (fn) {
    var a = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (ok, no) { google.script.run.withSuccessHandler(ok).withFailureHandler(no)[fn].apply(null, a); });
  };
  TR.getT = function () { try { return JSON.parse(localStorage.getItem('tr_teacher') || 'null'); } catch (e) { return null; } };
  TR.setT = function (t) { try { if (t) localStorage.setItem('tr_teacher', JSON.stringify(t)); else localStorage.removeItem('tr_teacher'); } catch (e) {} };

  TR.TEACH = [['index.html', '‹ หน้าแรก', 'back'], ['report.html', 'กรอกรายงาน'], ['history.html', 'รายงานของฉัน'], ['profile.html', 'ข้อมูลส่วนตัว'], ['guide.html', 'คู่มือ']];
  /* วาดแถบเมนูลง #nav  items = [[href, ข้อความ, 'back'?]]  active = href ของรายการที่เปิดอยู่ */
  TR.nav = function (items, active) {
    var el = $('nav'); if (!el) return;
    el.innerHTML = '<nav class="top">' + items.map(function (i) {
      return '<a href="' + i[0] + '" class="' + (i[2] || '') + (i[0] === active ? ' on' : '') + '">' + i[1] + '</a>';
    }).join('') + '</nav>';
  };

  /* ช่องเลือกชื่อครู: จำชื่อที่เลือกไว้ แล้วเรียก onChange(id, label) ทันทีถ้ามีชื่อที่จำไว้ */
  TR.picker = function (el, onChange) {
    el.className = 'pick';
    el.innerHTML = '<label for="pk">ชื่อของท่าน</label><select id="pk"><option value="">กำลังโหลดรายชื่อ…</option></select><div class="hint" id="pkh"></div>';
    var sel = $('pk');
    function build(info) {
      sel.innerHTML = '<option value="">— เลือกผู้สอน —</option>' + info.teachers.map(function (t) { return '<option value="' + TR.esc(t.id) + '">' + TR.esc(t.label) + '</option>'; }).join('');
      var saved = TR.getT();
      if (saved && info.teachers.some(function (t) { return String(t.id) === String(saved.id); })) {
        sel.value = saved.id; $('pkh').textContent = 'ระบบจำชื่อนี้ไว้ในเครื่องนี้ เปลี่ยนได้ที่ช่องด้านบน';
        onChange(saved.id, saved.label, info);
      } else { TR.setT(null); $('pkh').textContent = 'เลือกชื่อครั้งเดียว ระบบจะจำไว้ในเครื่องนี้'; }
      sel.onchange = function () {
        var o = sel.options[sel.selectedIndex];
        if (!sel.value) { TR.setT(null); onChange('', '', info); return; }
        TR.setT({ id: sel.value, label: o.text }); $('pkh').textContent = 'ระบบจำชื่อนี้ไว้ในเครื่องนี้';
        onChange(sel.value, o.text, info);
      };
    }
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('tr_list') || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.at < 300000) { build(cached.info); return Promise.resolve(cached.info); }
    return TR.run('getTeacherList').then(function (info) {
      try { sessionStorage.setItem('tr_list', JSON.stringify({ at: Date.now(), info: info })); } catch (e) {}
      build(info); return info;
    }).catch(function (e) { sel.innerHTML = '<option value="">โหลดรายชื่อไม่ได้</option>'; $('pkh').textContent = '❌ ' + e.message; });
  };

  TR.dl = function (name, b64) {
    var bin = atob(b64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([u], { type: 'application/pdf' })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('tr');
    var v = document.createElement('div'); v.id = 'ver'; v.textContent = 'เวอร์ชัน ' + window.APP_VERSION;
    document.body.appendChild(v);
  });
})();
