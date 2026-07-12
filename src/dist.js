(async()=>{
// src/hbk.ts
async function makeHbk(host = "") {
  const Hd = { "user-agent": "Android" };
  const Te = new TextEncoder, Td = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  const Sb = crypto.subtle, Mk = "a90f3731745f1c30ee77cb13fc00005a", Ms = `&signatures=${Mk}CkMxWNB666`;
  const Hk = await Sb.importKey("raw", Te.encode(Mk), { name: "HMAC", hash: "SHA-256" }, true, ["sign"]);
  const K0 = await Sb.importKey("raw", await Sb.digest("sha-256", Te.encode("sD6doAOcW7hm7iaeK6UlcdtAIWlZGlBr")), "AES-CBC", true, ["decrypt"]);
  const K1 = await Sb.importKey("raw", await Sb.digest("sha-256", Te.encode("zG2nSeEfSHfvTCHy5LCcqtBbQehKNLXn")), "AES-CBC", true, ["decrypt"]);
  const Al = { name: "AES-CBC", iv: new Uint8Array(16) };
  return {
    host,
    async decHbk(db) {
      const data = Uint8Array.from(atob(db), (c) => c.charCodeAt(0));
      try {
        return JSON.parse(Td.decode(await Sb.decrypt(Al, K0, data)));
      } catch {
        return JSON.parse(Td.decode(await Sb.decrypt(Al, K1, data)));
      }
    },
    async decKsy(db, k) {
      const h = await Sb.digest("sha-256", Te.encode(k));
      const d = Uint8Array.from(atob(db), (c) => c.charCodeAt(0));
      return Sb.decrypt(Al, await Sb.importKey("raw", h, "AES-CBC", true, ["decrypt"]), d);
    },
    async sign(a, rand_str) {
      rand_str ??= crypto.getRandomValues(new Uint8Array(8)).toHex();
      const s = encodeURI(`account=${a.account}&app_version=${a.app_version}&rand_str=${rand_str}${Ms}`);
      return { ...a, rand_str, p: new Uint8Array(await Sb.sign("HMAC", Hk, Te.encode(s))).toBase64() };
    },
    async req(a, api, args) {
      const body = new URLSearchParams({ ...await this.sign(a), ...args });
      const resp = await fetch(this.host + api, { method: "POST", body, headers: Hd });
      if (!resp.ok)
        throw Error(`HTTP Error: ${resp.status} ${resp.statusText}`);
      const json = await this.decHbk(await resp.text());
      if (parseInt(json.code) !== 1e5)
        throw Error(`CWM Error: ${JSON.stringify(json)}`);
      return json;
    }
  };
}

// src/main.html
var main_default = `<html>
<meta charse="utf-8">
<meta name="viewport" content="width=device-width">
<title>HbkDownloader</title>
<style>
  body {
    --fg: black;
    --bg: white;
    font-size: 16px;
    font-family: 'Sarasa Mono SC', 'Noto Sans CJK SC', monospace;
    user-select: none;
  }

  #root {
    user-select: text;
  }

  label {
    text-wrap: nowrap;
  }

  #root {
    margin-top: 1em;
    padding-top: 1em;
    position: relative;
    border-top: 1px solid var(--fg);
  }

  #root::before {
    content: "以下为章节列表";
    background-color: var(--bg);
    position: absolute;
    translate: -50% 0;
    padding: 0 1ch;
    top: -0.5lh;
    left: 50%;
  }

  #root ul {
    list-style: none;
    padding-left: 1em;
  }

  span.btn {
    margin: 0 0.5ch;
    display: inline-block;
  }

  span.btn:not(.disbtn):hover {
    color: black;
    background-color: pink;
  }

  span.btn.check::before {
    content: "[ ]";
  }

  li.sel>div>span.btn.check::before {
    content: "[x]";
  }

  li.shelf>div,
  li.book>div,
  li.div>div {
    color: var(--bg);
    cursor: default;
    position: sticky;
  }

  li.shelf>div::before,
  li.book>div::before,
  li.div>div::before {
    content: "[-]";
  }

  li.shelf.col>div::before,
  li.book.col>div::before,
  li.div.col>div::before {
    content: "[+]";
  }

  li.shelf>div {
    top: 1lh;
    z-index: 3;
    background-color: rgb(192, 64, 64);
  }

  li.shelf>div:hover {
    background-color: red;
  }

  li.book>div {
    top: 2lh;
    z-index: 2;
    color: var(--fg);
    background-color: var(--bg);
  }

  li.book.sel>div {
    color: var(--bg);
    background-color: rgb(64, 192, 64);
  }

  li.book>div:hover {
    color: var(--bg);
    background-color: green;
  }

  li.div>div {
    top: 3lh;
    z-index: 1;
    background-color: rgb(64, 64, 192);
  }

  li.div>div:hover {
    background-color: blue;
  }

  li.shelf.col>ul,
  li.book.col>ul,
  li.div.col>ul {
    display: none;
  }

  .cpt {
    position: relative;
  }

  .cpt::before {
    translate: -100% 0;
    position: absolute;
  }

  .cpt.vip {
    background-color: lightgrey;
  }

  .cpt.vip::before {
    content: "[V]";
  }

  .cpt.vip:not(.acc)::before {
    content: "[!]";
  }

  .cpt:hover {
    background-color: cyan;
  }

  .cpt.sel {
    background-color: lightblue;
  }

  .cpt.sel:hover {
    background-color: lightcoral;
  }

  .btn,
  .cpt {
    cursor: pointer;
    user-select: none;
  }

  .cpt.sel {
    user-select: all;
  }
</style>

<body>
  <h1>HbkDownloader</h1>
  <section>
    <h2>登陆信息</h2>
    <label>account<input id="account"></label>
    <label>app_version<input id="app_version"></label>
    <label>device_token<input id="device_token"></label>
    <label>login_token<input id="login_token"></label>
    <button id="btnSaveLogin">保存到浏览器</button>
    <button id="btnTestLogin">测试并保存到浏览器</button>
  </section>
  <section>
    <h2>使用方法</h2>
    <h3>选择项目</h3>
    <ul>
      <i>以下左键指鼠标左键和触摸短按，右键指鼠标右键和触摸长按</i>
      <li>左键: 选中/取消选中</li>
      <li>右键: 从上次选中/取消选中的项目，到本次点击的项目，此范围内反选</li>
      <li>各选择章节/书的按钮: 左键全选/全不选、右键反选</li>
    </ul>
    <h3>操作流程</h3>
    <ol>
      <li>点击[获取书架]获得书架和其中的书</li>
      <li>点击书名前的方括号，选择要获取目录/下载的书<br><i>获取书架后默认全选</i></li>
      <li>点击[获取目录]获取已选书的目录，或点击书名后的[刷新目录]获取单本书的目录</li>
      <li>选择要下载的章节<ul>
          <li>默认选中全部有权阅读的章节(免费/已购买)，背景为淡蓝色</li>
          <li>章节前[V]为V付费章节(已购买)；[!]为未购买，背景为灰色</li>
        </ul>
      </li>
      <li>点击[下载已选]开始下载</li>
      <li>下载完成后点击书后[TXT]按钮保存</li>
    </ol>
  </section>
  <section>
    <h2>下载列表</h2>
    <div style="position: sticky; top: 0lh; z-index: 4; background-color: var(--bg);">
      <span id="btnGetShelf" class="btn">[获取书架]</span><!--
      --><span id="btnGetBkToc" class="btn">[获取目录]</span><!--
      --><span id="btnDownload" class="btn">[下载已选]</span><!--
      --><span id="progress">进度: 0/0</span>
    </div>
    <ul id="root"></ul>
  </section>
</body>

</html>`;

// src/main.ts
{
  const newDoc = new DOMParser().parseFromString(main_default, "text/html");
  document.documentElement.replaceWith(newDoc.documentElement);
}
var idb = await new Promise(function(res, rej) {
  const req = indexedDB.open("hbkdl", 1);
  req.onerror = () => rej(req.error);
  req.onsuccess = () => res(req.result);
  req.onupgradeneeded = () => {
    const db = req.result;
    db.createObjectStore("cpt", { keyPath: "chapter_id" });
  };
});
var hbk = await makeHbk();
var authDefs = ["", "2.9.362", "ciweimao_", ""];
var authKeys = ["account", "app_version", "device_token", "login_token"];
var authInps = authKeys.map((k) => document.getElementById(k));
var ted = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
for (let i = 0;i < 4; i++)
  authInps[i].value = localStorage.getItem(authKeys[i]) ?? authDefs[i];
function getAuth() {
  return Object.fromEntries(authKeys.map((k, i) => [k, authInps[i].value]));
}
var btnSaveLogin = document.getElementById("btnSaveLogin");
var btnTestLogin = document.getElementById("btnTestLogin");
btnSaveLogin.onclick = function() {
  Object.entries(getAuth()).forEach(([k, v]) => localStorage.setItem(k, v));
};
btnTestLogin.onclick = async function fun() {
  btnTestLogin.onclick = null;
  btnTestLogin.classList.add("disbtn");
  try {
    const auth = getAuth();
    const resp = await hbk.req(auth, "/reader/get_my_info", {});
    Object.entries(auth).forEach(([k, v]) => localStorage.setItem(k, v));
    alert(`成功:
` + JSON.stringify(resp, null, "\t"));
  } catch (e) {
    alert(`错误:
` + e);
    throw e;
  } finally {
    btnTestLogin.onclick = fun;
    btnTestLogin.classList.remove("disbtn");
  }
};
var root = document.getElementById("root");
function createLiDivUl(liCls, divText) {
  const li = document.createElement("li");
  const div = document.createElement("div");
  const ul = document.createElement("ul");
  li.append(div, ul);
  li.className = liCls;
  div.innerText = divText;
  div.onclick = (e) => e.target === div && li.classList.toggle("col");
  return [li, div, ul];
}
function createBtnSpan(txt) {
  const span = document.createElement("span");
  span.className = "btn";
  span.innerText = txt;
  return span;
}
var btnGetShelf = document.getElementById("btnGetShelf");
var btnGetBkToc = document.getElementById("btnGetBkToc");
var btnDownload = document.getElementById("btnDownload");
var lastBookSeq = -1;
var bookLiArray = [];
function bookOnClick(ev, forceShift = false) {
  const li = ev.target.parentElement.parentElement;
  const lastSeq = lastBookSeq;
  const thisSeq = lastBookSeq = parseInt(li.dataset.seq);
  if ((ev.shiftKey || forceShift) && lastSeq >= 0 && lastSeq !== thisSeq) {
    const lo = Math.min(lastSeq, thisSeq);
    const hi = Math.max(lastSeq, thisSeq);
    for (let i = lo;i <= hi; i++) {
      if (i === lastSeq)
        continue;
      bookLiArray[i].classList.toggle("sel");
    }
  } else
    li.classList.toggle("sel");
}
function bookOnMenu(ev) {
  ev.preventDefault();
  bookOnClick(ev, true);
}
function liSelAll(lis) {
  const b = !!lis.find((l) => !l.classList.contains("sel"));
  lis.forEach((n) => n.classList.toggle("sel", b));
}
function liSelInv(lis) {
  lis.forEach((n) => n.classList.toggle("sel"));
}
function makeSelClickMenu(btn, li, ul, sel) {
  btn.onclick = () => {
    li.classList.remove("col");
    li.querySelectorAll("li.col").forEach((e) => e.classList.remove("col"));
    liSelAll([...ul.querySelectorAll(sel)]);
  };
  btn.oncontextmenu = (e) => {
    e.preventDefault();
    li.classList.remove("col");
    li.querySelectorAll("li.col").forEach((e2) => e2.classList.remove("col"));
    liSelInv([...ul.querySelectorAll(sel)]);
  };
  return btn;
}
function createCptButtons(li, ul) {
  return [
    makeSelClickMenu(createBtnSpan("[已购]"), li, ul, ".cpt.acc"),
    makeSelClickMenu(createBtnSpan("[免费]"), li, ul, ".cpt:not(.vip)"),
    makeSelClickMenu(createBtnSpan("[付费]"), li, ul, ".cpt.vip"),
    makeSelClickMenu(createBtnSpan("[全部章节]"), li, ul, ".cpt")
  ];
}
btnDownload.before(...createCptButtons(root, root));
async function bookGetToc(book_id, ul) {
  const toc = (await hbk.req(getAuth(), "/chapter/get_updated_chapter_by_division_new", { book_id, division_id: "0" })).data.chapter_list;
  [...ul.childNodes].forEach((n) => n.remove());
  let lastCptSeq = -1, cLiArray = [];
  function cptOnClick(ev, forceShift = false) {
    const tgt = ev.target;
    const lastSeq = lastCptSeq;
    const thisSeq = lastCptSeq = parseInt(tgt.dataset.seq);
    if ((ev.shiftKey || forceShift) && lastSeq >= 0 && lastSeq != thisSeq) {
      const lo = Math.min(lastSeq, thisSeq);
      const hi = Math.max(lastSeq, thisSeq);
      for (let i = lo;i <= hi; i++) {
        if (i === lastSeq)
          continue;
        cLiArray[i].classList.toggle("sel");
      }
    } else
      tgt.classList.toggle("sel");
  }
  function cptOnMenu(ev) {
    ev.preventDefault();
    cptOnClick(ev, true);
  }
  for (const d of toc) {
    const [dli, ddiv, dul] = createLiDivUl("div", d.division_name);
    ddiv.append(...createCptButtons(dli, dul));
    dli.dataset.divName = d.division_name;
    ul.appendChild(dli);
    for (const c of d.chapter_list) {
      const cli = dul.appendChild(document.createElement("li"));
      cli.className = "cpt";
      if (!!parseInt(c.is_paid))
        cli.classList.add("vip");
      if (!!parseInt(c.auth_access))
        cli.classList.add("sel", "acc");
      cli.innerText = c.chapter_title;
      cli.dataset.cptId = c.chapter_id;
      cli.dataset.cptName = c.chapter_title;
      cli.dataset.seq = cLiArray.length.toString();
      cLiArray.push(cli);
      cli.onclick = cptOnClick;
      cli.oncontextmenu = cptOnMenu;
    }
  }
}
var emptyCpt = {
  chapter_id: "",
  txt_content: "(未下载)",
  author_say: ""
};
async function saveTxt(bli) {
  const cptLis = [...bli.querySelectorAll("li.cpt")];
  const trans = idb.transaction("cpt", "readonly");
  const objStore = trans.objectStore("cpt");
  const entries = {};
  await Promise.all(cptLis.map((li) => new Promise((res, rej) => {
    const cid = li.dataset.cptId;
    const req = objStore.get(cid);
    req.onerror = () => rej(req.error);
    req.onsuccess = () => {
      if (req.result)
        entries[cid] = req.result;
      res();
    };
  })));
  const tocLine = [];
  const segs = [`${bli.dataset.bookId} ${bli.dataset.bookName} ${bli.dataset.authorName}`, ""];
  for (const dli of bli.lastElementChild.childNodes) {
    if (!(dli instanceof HTMLLIElement))
      continue;
    const divName = dli.dataset.divName;
    tocLine.push("# " + divName);
    segs.push("# " + divName);
    for (const cli of dli.lastElementChild.childNodes) {
      if (!(cli instanceof HTMLLIElement))
        continue;
      const cptId = cli.dataset.cptId;
      const cptName = cli.dataset.cptName;
      const obj = entries[cptId] ?? emptyCpt;
      tocLine.push("- " + cptName);
      segs.push("- " + cptName);
      segs.push((obj.txt_content + `

` + obj.author_say).trimEnd());
    }
  }
  segs[1] = tocLine.join(`
`);
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([segs.join(`

`)], { type: "text/plain" }));
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
  link.download = `${bli.dataset.bookId}_${bli.dataset.bookName}_${bli.dataset.authorName}.txt`;
  link.target = "_blank";
  link.href = url;
  link.click();
}
btnGetShelf.onclick = async function fun2() {
  btnGetShelf.onclick = null;
  btnGetShelf.classList.add("disbtn");
  try {
    const count = 100;
    const auth = getAuth();
    const shelfList = (await hbk.req(auth, "/bookshelf/get_shelf_list", {})).data.shelf_list;
    [...root.childNodes].forEach((n) => n.remove());
    lastBookSeq = -1;
    bookLiArray = [];
    for (const s of shelfList) {
      console.log(`书架: ${s.shelf_id} ${s.shelf_name}`);
      const shelfBookLis = [];
      const [sli, sdiv, sul] = createLiDivUl("shelf", s.shelf_name);
      root.appendChild(sli);
      for (let p = 0;; p++) {
        const bookList = (await hbk.req(auth, "/bookshelf/get_shelf_book_list_new", {
          count: count.toString(),
          order: "last_read_time",
          page: p.toString(),
          shelf_id: s.shelf_id
        })).data.book_list;
        for (const { book_info: { book_id, book_name, author_name } } of bookList) {
          console.log(`- 书: ${book_id} ${book_name}`);
          const [bli, bdiv, bul] = createLiDivUl("book", `${book_name} ${author_name}`);
          const btnSelBook = createBtnSpan("");
          btnSelBook.classList.add("check");
          btnSelBook.onclick = bookOnClick;
          btnSelBook.oncontextmenu = bookOnMenu;
          bdiv.prepend(btnSelBook);
          bli.dataset.bookId = book_id;
          bli.dataset.bookName = book_name;
          bli.dataset.authorName = author_name;
          bli.dataset.seq = bookLiArray.length.toString();
          bli.classList.add("sel");
          bookLiArray.push(bli);
          shelfBookLis.push(bli);
          sul.appendChild(bli);
          const btnSaveTxt = bdiv.appendChild(createBtnSpan("[导出TXT]"));
          btnSaveTxt.onclick = () => saveTxt(bli);
          const btnGetToc = bdiv.appendChild(createBtnSpan("[刷新目录]"));
          btnGetToc.classList.add("gettoc");
          btnGetToc.onclick = async function fun3() {
            btnGetToc.onclick = null;
            btnGetToc.classList.add("disbtn");
            try {
              console.log(`刷新目录: ${book_id} ${book_name}`);
              await bookGetToc(book_id, bul);
              bli.classList.remove("col");
            } catch (e) {
              alert(`错误:
` + e);
              throw e;
            } finally {
              btnGetToc.onclick = fun3;
              btnGetToc.classList.remove("disbtn");
            }
          };
          bdiv.append(...createCptButtons(bli, bul));
        }
        if (bookList.length < count)
          break;
      }
      const btnSelAll = sdiv.appendChild(createBtnSpan("[书:全/反]"));
      btnSelAll.onclick = (e) => {
        sli.classList.remove("col");
        liSelAll(shelfBookLis);
      };
      btnSelAll.oncontextmenu = (e) => {
        e.preventDefault();
        sli.classList.remove("col");
        liSelInv(shelfBookLis);
      };
      sdiv.append(...createCptButtons(sli, sul));
    }
  } catch (e) {
    alert(`错误:
` + e);
    throw e;
  } finally {
    btnGetShelf.onclick = fun2;
    btnGetShelf.classList.remove("disbtn");
  }
};
btnGetBkToc.onclick = async function fun3() {
  btnGetBkToc.onclick = null;
  btnGetBkToc.classList.add("disbtn");
  try {
    const ev = new PointerEvent("");
    const btns = [...root.querySelectorAll("li.book.sel span.btn.gettoc")];
    for (const btn of btns) {
      await btn.onclick(ev);
    }
  } finally {
    btnGetBkToc.onclick = fun3;
    btnGetBkToc.classList.remove("disbtn");
  }
};
var eProgress = document.getElementById("progress");
btnDownload.onclick = async function fun4() {
  btnDownload.onclick = null;
  btnDownload.classList.add("disbtn");
  try {
    const auth = getAuth();
    const allLi = [...root.querySelectorAll("li.book.sel li.cpt.sel")];
    const ok = confirm(`是否下载 ${allLi.length} 章?`);
    if (!ok)
      return;
    const blocks = [];
    for (let i = 0;i < allLi.length; )
      blocks.push(allLi.slice(i, i += 10));
    for (let i = 0;i < blocks.length; i++) {
      eProgress.innerText = `${i} / ${blocks.length}`;
      const block = blocks[i];
      const liMap = Object.fromEntries(block.map((l) => [l.dataset.cptId, l]));
      const chapter_id = block.map((l) => l.dataset.cptId).join(",");
      const chapter_command = (await hbk.req(auth, "/chapter/get_chapter_download_cmd", { chapter_id })).data.command;
      const chapter_info_s = (await hbk.req(auth, "/chapter/download_cpt", { chapter_id, chapter_command })).data.chapter_infos;
      const chapter_infos = JSON.parse(ted.decode(await hbk.decKsy(chapter_info_s, chapter_command), { stream: false }));
      await new Promise((res, rej) => {
        const trans = idb.transaction("cpt", "readwrite");
        trans.oncomplete = res;
        trans.onerror = () => rej(trans.error);
        const objStore = trans.objectStore("cpt");
        chapter_infos.forEach((ci) => objStore.put(ci));
      });
      chapter_infos.forEach((ci) => liMap[ci.chapter_id].classList.remove("sel"));
    }
    eProgress.innerText = "下载完成";
  } catch (e) {
    alert(`错误:
` + e);
    throw e;
  } finally {
    btnDownload.onclick = fun4;
    btnDownload.classList.remove("disbtn");
  }
};
})()
