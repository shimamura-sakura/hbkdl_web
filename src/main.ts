import { type Auth, makeHbk } from './hbk';
import htmlTemplate from './main.html' with { type: 'text' };

{
  const newDoc = new DOMParser().parseFromString(htmlTemplate, 'text/html');
  document.documentElement.replaceWith(newDoc.documentElement);
}

const idb = await new Promise<IDBDatabase>(function (res, rej) {
  const req = indexedDB.open('hbkdl', 1);
  req.onerror = () => rej(req.error);
  req.onsuccess = () => res(req.result);
  req.onupgradeneeded = () => {
    const db = req.result;
    db.createObjectStore('cpt', { keyPath: 'chapter_id' });
  };
});

const hbk = await makeHbk();
const authDefs = ['', '2.9.362', 'ciweimao_', ''] as const;
const authKeys = ['account', 'app_version', 'device_token', 'login_token'] as const;
const authInps = authKeys.map(k => document.getElementById(k)) as HTMLInputElement[];
const ted = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

for (let i = 0; i < 4; i++) authInps[i].value = localStorage.getItem(authKeys[i]) ?? authDefs[i];

function getAuth() {
  return Object.fromEntries(authKeys.map((k, i) => [k, authInps[i].value])) as Auth;
}

const btnSaveLogin = document.getElementById('btnSaveLogin') as HTMLSpanElement;
const btnTestLogin = document.getElementById('btnTestLogin') as HTMLSpanElement;

btnSaveLogin.onclick = function () {
  Object.entries(getAuth()).forEach(([k, v]) => localStorage.setItem(k, v));
};

btnTestLogin.onclick = async function fun() {
  btnTestLogin.onclick = null;
  btnTestLogin.classList.add('disbtn');
  try {
    const auth = getAuth();
    const resp = await hbk.req(auth, '/reader/get_my_info', {});
    Object.entries(auth).forEach(([k, v]) => localStorage.setItem(k, v));
    alert('成功:\n' + JSON.stringify(resp, null, '\t'));
  } catch (e) {
    alert('错误:\n' + e);
    throw e;
  } finally {
    btnTestLogin.onclick = fun;
    btnTestLogin.classList.remove('disbtn');
  }
};

const root = document.getElementById('root') as HTMLUListElement;

function createLiDivUl(liCls: string, divText: string) {
  const li = document.createElement('li');
  const div = document.createElement('div');
  const ul = document.createElement('ul');
  li.append(div, ul);
  li.className = liCls;
  div.innerText = divText;
  div.onclick = e => e.target === div && li.classList.toggle('col');
  return [li, div, ul] as const;
}

function createBtnSpan(txt: string) {
  const span = document.createElement('span');
  span.className = 'btn';
  span.innerText = txt;
  return span;
}

const btnGetShelf = document.getElementById('btnGetShelf') as HTMLSpanElement;
const btnGetBkToc = document.getElementById('btnGetBkToc') as HTMLSpanElement;
const btnDownload = document.getElementById('btnDownload') as HTMLSpanElement;

let lastBookSeq = -1, bookLiArray: HTMLLIElement[] = [];

function bookOnClick(ev: PointerEvent, forceShift = false) {
  const li = (ev.target as HTMLElement).parentElement!.parentElement! as HTMLLIElement;
  const lastSeq = lastBookSeq;
  const thisSeq = lastBookSeq = parseInt(li.dataset.seq!);
  if ((ev.shiftKey || forceShift) && lastSeq >= 0 && lastSeq !== thisSeq) {
    const lo = Math.min(lastSeq, thisSeq);
    const hi = Math.max(lastSeq, thisSeq);
    for (let i = lo; i <= hi; i++) {
      if (i === lastSeq) continue;
      bookLiArray[i].classList.toggle('sel');
    }
  } else li.classList.toggle('sel');
}

function bookOnMenu(ev: PointerEvent) {
  ev.preventDefault();
  bookOnClick(ev, true);
}

function liSelAll(lis: HTMLElement[]) {
  const b = !!lis.find(l => !l.classList.contains('sel'));
  lis.forEach(n => n.classList.toggle('sel', b));
}

function liSelInv(lis: HTMLElement[]) {
  lis.forEach(n => n.classList.toggle('sel'));
}

function makeSelClickMenu(btn: HTMLElement, li: HTMLElement, ul: HTMLElement, sel: string) {
  btn.onclick = () => {
    li.classList.remove('col');
    li.querySelectorAll('li.col').forEach(e => e.classList.remove('col'));
    liSelAll([...ul.querySelectorAll(sel)] as HTMLElement[]);
  };
  btn.oncontextmenu = e => {
    e.preventDefault();
    li.classList.remove('col');
    li.querySelectorAll('li.col').forEach(e => e.classList.remove('col'));
    liSelInv([...ul.querySelectorAll(sel)] as HTMLElement[]);
  };
  return btn;
}

function createCptButtons(li: HTMLElement, ul: HTMLElement) {
  return [
    makeSelClickMenu(createBtnSpan('[已购]'), li, ul, '.cpt.acc'),
    makeSelClickMenu(createBtnSpan('[免费]'), li, ul, '.cpt:not(.vip)'),
    makeSelClickMenu(createBtnSpan('[付费]'), li, ul, '.cpt.vip'),
    makeSelClickMenu(createBtnSpan('[全部章节]'), li, ul, '.cpt'),
    makeSelClickMenu(createBtnSpan('[已下]'), li, ul, '.cpt.dl'),
  ];
}

btnDownload.before(...createCptButtons(root, root));

async function bookGetToc(book_id: string, ul: HTMLUListElement) {
  const toc = (await hbk.req(getAuth(), '/chapter/get_updated_chapter_by_division_new',
    { book_id, division_id: '0', })).data.chapter_list as {
      chapter_list: {
        chapter_id: string; chapter_title: string; is_paid: string; auth_access: string;
      }[]; division_name: string;
    }[];

  [...ul.childNodes].forEach(n => n.remove());
  let lastCptSeq = -1, cLiArray: HTMLLIElement[] = [];
  function cptOnClick(ev: PointerEvent, forceShift = false) {
    const tgt = ev.target as HTMLElement;
    const lastSeq = lastCptSeq;
    const thisSeq = lastCptSeq = parseInt(tgt.dataset.seq!);
    if ((ev.shiftKey || forceShift) && lastSeq >= 0 && lastSeq != thisSeq) {
      const lo = Math.min(lastSeq, thisSeq);
      const hi = Math.max(lastSeq, thisSeq);
      for (let i = lo; i <= hi; i++) {
        if (i === lastSeq) continue;
        cLiArray[i].classList.toggle('sel');
      }
    } else
      tgt.classList.toggle('sel');
  }
  function cptOnMenu(ev: PointerEvent) {
    ev.preventDefault();
    cptOnClick(ev, true);
  }
  const allCptId = new Set(await new Promise<string[]>((res, rej) => {
    const req = idb.transaction('cpt', 'readonly').objectStore('cpt').getAllKeys();
    req.onerror = () => rej(req.error);
    req.onsuccess = () => res(req.result as string[]);
  }));
  for (const d of toc) {
    const [dli, ddiv, dul] = createLiDivUl('div', d.division_name);
    ddiv.append(...createCptButtons(dli, dul));
    dli.dataset.divName = d.division_name;
    ul.appendChild(dli);
    for (const c of d.chapter_list) {
      const cli = dul.appendChild(document.createElement('li'));
      cli.className = 'cpt';
      cli.classList.toggle('vip', !!parseInt(c.is_paid));
      cli.classList.toggle('dl', allCptId.has(c.chapter_id));
      if (!!parseInt(c.auth_access)) cli.classList.add('sel', 'acc');
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

type DBCpt = {
  chapter_id: string, txt_content: string, author_say: string;
};

const emptyCpt: DBCpt = {
  chapter_id: '',
  txt_content: '(未下载)',
  author_say: '',
};

async function saveTxt(bli: HTMLLIElement) {
  const cptLis = [...bli.querySelectorAll('li.cpt')] as HTMLLIElement[];
  const trans = idb.transaction('cpt', 'readonly');
  const objStore = trans.objectStore('cpt');
  const entries: Record<string, DBCpt> = {};
  await Promise.all(cptLis.map(li => new Promise<void>((res, rej) => {
    const cid = li.dataset.cptId!;
    const req = objStore.get(cid);
    req.onerror = () => rej(req.error);
    req.onsuccess = () => {
      if (req.result) entries[cid] = req.result;
      res();
    };
  })));
  // li.book > ul > li
  const tocLine = [];
  const segs = [`${bli.dataset.bookId} ${bli.dataset.bookName} ${bli.dataset.authorName}`, ''];
  for (const dli of bli.lastElementChild!.childNodes) {
    if (!(dli instanceof HTMLLIElement)) continue;
    const divName = dli.dataset.divName!;
    tocLine.push('# ' + divName);
    segs.push('# ' + divName);
    for (const cli of dli.lastElementChild!.childNodes) {
      if (!(cli instanceof HTMLLIElement)) continue;
      const cptId = cli.dataset.cptId!;
      const cptName = cli.dataset.cptName!;
      const obj = entries[cptId] ?? emptyCpt;
      tocLine.push('- ' + cptName);
      segs.push('- ' + cptName);
      segs.push((obj.txt_content + '\n\n' + obj.author_say).trimEnd());
    }
  }
  segs[1] = tocLine.join('\n');
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([segs.join('\n\n')], { type: 'text/plain' }));
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000); // 1 minute
  link.download = `${bli.dataset.bookId}_${bli.dataset.bookName}_${bli.dataset.authorName}.txt`;
  link.target = '_blank';
  link.href = url;
  link.click();
}

btnGetShelf.onclick = async function fun() {
  btnGetShelf.onclick = null;
  btnGetShelf.classList.add('disbtn');
  try {
    const count = 100;
    const auth = getAuth();
    const shelfList = (await hbk.req(auth, '/bookshelf/get_shelf_list', {}))
      .data.shelf_list as { shelf_id: string; shelf_name: string; }[];
    [...root.childNodes].forEach(n => n.remove());
    lastBookSeq = -1;
    bookLiArray = [];
    for (const s of shelfList) {
      console.log(`书架: ${s.shelf_id} ${s.shelf_name}`);
      const shelfBookLis: HTMLLIElement[] = [];
      const [sli, sdiv, sul] = createLiDivUl('shelf', s.shelf_name);
      root.appendChild(sli);
      for (let p = 0; ; p++) {
        const bookList = (await hbk.req(auth, '/bookshelf/get_shelf_book_list_new', {
          count: count.toString(), order: 'last_read_time', page: p.toString(),
          shelf_id: s.shelf_id
        })).data.book_list as {
          book_info: { book_id: string; book_name: string; author_name: string; };
        }[];
        for (const { book_info: { book_id, book_name, author_name } } of bookList) {
          console.log(`- 书: ${book_id} ${book_name}`);
          const [bli, bdiv, bul] = createLiDivUl('book', `${book_name} ${author_name}`);
          const btnSelBook = createBtnSpan('');
          btnSelBook.classList.add('check');
          btnSelBook.onclick = bookOnClick;
          btnSelBook.oncontextmenu = bookOnMenu;
          bdiv.prepend(btnSelBook);
          bli.dataset.bookId = book_id;
          bli.dataset.bookName = book_name;
          bli.dataset.authorName = author_name;
          bli.dataset.seq = bookLiArray.length.toString();
          bli.classList.add('sel');
          bookLiArray.push(bli);
          shelfBookLis.push(bli);
          sul.appendChild(bli);
          const btnSaveTxt = bdiv.appendChild(createBtnSpan('[导出TXT]'));
          btnSaveTxt.onclick = () => saveTxt(bli);
          const btnGetToc = bdiv.appendChild(createBtnSpan('[刷新目录]'));
          btnGetToc.classList.add('gettoc');
          btnGetToc.onclick = async function fun() {
            btnGetToc.onclick = null;
            btnGetToc.classList.add('disbtn');
            try {
              console.log(`刷新目录: ${book_id} ${book_name}`);
              await bookGetToc(book_id, bul);
              bli.classList.remove('col');
            } catch (e) {
              alert('错误:\n' + e);
              throw e;
            } finally {
              btnGetToc.onclick = fun;
              btnGetToc.classList.remove('disbtn');
            }
          };
          bdiv.append(...createCptButtons(bli, bul));
        }
        if (bookList.length < count) break;
      }
      const btnSelAll = sdiv.appendChild(createBtnSpan('[书:全/反]'));
      btnSelAll.onclick = e => {
        sli.classList.remove('col');
        liSelAll(shelfBookLis);
      };
      btnSelAll.oncontextmenu = e => {
        e.preventDefault();
        sli.classList.remove('col');
        liSelInv(shelfBookLis);
      };
      sdiv.append(...createCptButtons(sli, sul));
    }
  } catch (e) {
    alert('错误:\n' + e);
    throw e;
  } finally {
    btnGetShelf.onclick = fun;
    btnGetShelf.classList.remove('disbtn');
  }
};

btnGetBkToc.onclick = async function fun() {
  btnGetBkToc.onclick = null;
  btnGetBkToc.classList.add('disbtn');
  try {
    const ev = new PointerEvent('');
    const btns = [...root.querySelectorAll('li.book.sel span.btn.gettoc')] as HTMLSpanElement[];
    for (const btn of btns) {
      await btn.onclick!(ev);
    }
  } finally {
    btnGetBkToc.onclick = fun;
    btnGetBkToc.classList.remove('disbtn');
  }
};

const eProgress = document.getElementById('progress') as HTMLSpanElement;

btnDownload.onclick = async function fun() {
  btnDownload.onclick = null;
  btnDownload.classList.add('disbtn');
  try {
    const auth = getAuth();
    const allLi = [...root.querySelectorAll('li.book.sel li.cpt.sel')] as HTMLLIElement[];
    const ok = confirm(`是否下载 ${allLi.length} 章?`);
    if (!ok) return;
    const blocks: HTMLLIElement[][] = [];
    for (let i = 0; i < allLi.length;)
      blocks.push(allLi.slice(i, i += 10));
    for (let i = 0; i < blocks.length; i++) {
      eProgress.innerText = `${i} / ${blocks.length}`;
      const block = blocks[i];
      const liMap = Object.fromEntries(block.map(l => [l.dataset.cptId!, l]));
      const chapter_id = block.map(l => l.dataset.cptId!).join(',');
      const chapter_command = (await hbk.req(auth, '/chapter/get_chapter_download_cmd', { chapter_id })).data.command as string;
      const chapter_info_s = (await hbk.req(auth, '/chapter/download_cpt', { chapter_id, chapter_command })).data.chapter_infos as string;
      const chapter_infos = JSON.parse(ted.decode(await hbk.decKsy(chapter_info_s, chapter_command), { stream: false })) as DBCpt[];
      await new Promise((res, rej) => {
        const trans = idb.transaction('cpt', 'readwrite');
        trans.oncomplete = res;
        trans.onerror = () => rej(trans.error);
        const objStore = trans.objectStore('cpt');
        chapter_infos.forEach(ci => objStore.put(ci));
      });
      chapter_infos.forEach(ci => {
        const li = liMap[ci.chapter_id];
        li.classList.remove('sel');
        li.classList.add('dl');
      });
    }
    eProgress.innerText = '下载完成';
  } catch (e) {
    alert('错误:\n' + e);
    throw e;
  } finally {
    btnDownload.onclick = fun;
    btnDownload.classList.remove('disbtn');
  }
};