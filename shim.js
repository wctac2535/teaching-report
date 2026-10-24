/* ตัวแทน google.script.run สำหรับหน้าเว็บที่ฝากไว้นอก Apps Script (GitHub Pages)
   โค้ดหน้าเว็บเขียนแบบ google.script.run.withSuccessHandler(ok).withFailureHandler(no).ชื่อฟังก์ชัน(...) ได้ตามเดิม
   ตัวนี้ส่งคำสั่งไปที่ลิงก์ /exec ของ Apps Script (ตั้งใน config.js) แล้วเรียก ok / no ให้ */
(function () {
  if (window.google && google.script && google.script.run) return;
  var API = window.API_URL || '';
  var NET = 'เชื่อมต่อระบบไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่';

  function call(fn, args) {
    if (!/^https?:\/\/.+/.test(API)) {
      return Promise.reject(new Error('ยังไม่ได้ตั้งลิงก์ระบบหลังบ้านใน config.js'));
    }
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },  // ใช้ text/plain เพื่อไม่ให้เบราว์เซอร์ส่งคำขอตรวจสอบ (preflight) ซึ่ง Apps Script ไม่รองรับ
      body: JSON.stringify({ fn: fn, args: args }),
      redirect: 'follow'
    }).then(function (r) {
      return r.json();
    }, function () { throw new Error(NET); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error((j && j.error) || 'เกิดข้อผิดพลาดที่ระบบหลังบ้าน');
        return j.result;
      }, function (e) { throw (e && e.message ? e : new Error(NET)); });
  }

  function make(ok, no) {
    return new Proxy({}, {
      get: function (_, k) {
        if (k === 'withSuccessHandler') return function (f) { return make(f, no); };
        if (k === 'withFailureHandler') return function (f) { return make(ok, f); };
        return function () {
          var args = Array.prototype.slice.call(arguments);
          call(String(k), args).then(function (r) { if (ok) ok(r); },
            function (e) { if (no) no(e); else console.error(e); });
        };
      }
    });
  }
  window.google = { script: { run: make(null, null) } };

  /* ถ้ามีเวอร์ชันใหม่ขึ้นเว็บแล้ว แต่เครื่องนี้ยังถือหน้าเก่าค้างอยู่ ให้ขึ้นแถบให้กดโหลดใหม่ */
  window.addEventListener('load', function () {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
      if (!v || !window.APP_VERSION || v.version === window.APP_VERSION) return;
      var b = document.createElement('div');
      b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99;background:#fdf0d5;color:#7a4a00;padding:10px 16px;text-align:center;font:14px system-ui,sans-serif;border-bottom:1px solid #e0b25a';
      b.innerHTML = 'มีเวอร์ชันใหม่ (' + v.version + ') <button type="button" style="margin-left:10px;padding:4px 12px;border:0;border-radius:6px;background:#8a5a14;color:#fff;font:inherit;cursor:pointer">โหลดใหม่</button>';
      b.querySelector('button').onclick = function () { location.reload(); };
      document.body.appendChild(b);
    }).catch(function () {});
  });
})();
