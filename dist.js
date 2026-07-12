(async()=>{
async function $(t=""){let e={"user-agent":"Android"},o=new TextEncoder,a=new TextDecoder("utf-8",{fatal:!0,ignoreBOM:!0}),n=crypto.subtle,l="a90f3731745f1c30ee77cb13fc00005a",h="&signatures=a90f3731745f1c30ee77cb13fc00005aCkMxWNB666",m=await n.importKey("raw",o.encode("a90f3731745f1c30ee77cb13fc00005a"),{name:"HMAC",hash:"SHA-256"},!0,["sign"]),p=await n.importKey("raw",await n.digest("sha-256",o.encode("sD6doAOcW7hm7iaeK6UlcdtAIWlZGlBr")),"AES-CBC",!0,["decrypt"]),u=await n.importKey("raw",await n.digest("sha-256",o.encode("zG2nSeEfSHfvTCHy5LCcqtBbQehKNLXn")),"AES-CBC",!0,["decrypt"]),r={name:"AES-CBC",iv:new Uint8Array(16)};return{host:t,async decHbk(i){let s=Uint8Array.from(atob(i),(c)=>c.charCodeAt(0));try{return JSON.parse(a.decode(await n.decrypt(r,p,s)))}catch{return JSON.parse(a.decode(await n.decrypt(r,u,s)))}},async decKsy(i,s){let c=await n.digest("sha-256",o.encode(s)),b=Uint8Array.from(atob(i),(d)=>d.charCodeAt(0));return n.decrypt(r,await n.importKey("raw",c,"AES-CBC",!0,["decrypt"]),b)},async sign(i,s){s??=crypto.getRandomValues(new Uint8Array(8)).toHex();let c=encodeURI(`account=${i.account}&app_version=${i.app_version}&rand_str=${s}&signatures=a90f3731745f1c30ee77cb13fc00005aCkMxWNB666`);return{...i,rand_str:s,p:new Uint8Array(await n.sign("HMAC",m,o.encode(c))).toBase64()}},async req(i,s,c){let b=new URLSearchParams({...await this.sign(i),...c}),d=await fetch(this.host+s,{method:"POST",body:b,headers:e});if(!d.ok)throw Error(`HTTP Error: ${d.status} ${d.statusText}`);let g=await this.decHbk(await d.text());if(parseInt(g.code)!==1e5)throw Error(`CWM Error: ${JSON.stringify(g)}`);return g}}}var D=`<html>
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

  .cpt.dl {
    font-style: italic;
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
    <span id="btnSaveLogin" class="btn">[保存到浏览器]</span>
    <span id="btnTestLogin" class="btn">[测试并保存]</span>
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

</html>`;{let t=new DOMParser().parseFromString(D,"text/html");document.documentElement.replaceWith(t.documentElement)}var A=await new Promise(function(t,e){let o=indexedDB.open("hbkdl",1);o.onerror=()=>e(o.error),o.onsuccess=()=>t(o.result),o.onupgradeneeded=()=>{o.result.createObjectStore("cpt",{keyPath:"chapter_id"})}}),k=await $(),J=["","2.9.362","ciweimao_",""],B=["account","app_version","device_token","login_token"],j=B.map((t)=>document.getElementById(t)),W=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0});for(let t=0;t<4;t++)j[t].value=localStorage.getItem(B[t])??J[t];function T(){return Object.fromEntries(B.map((t,e)=>[t,j[e].value]))}var V=document.getElementById("btnSaveLogin"),_=document.getElementById("btnTestLogin");V.onclick=function(){Object.entries(T()).forEach(([t,e])=>localStorage.setItem(t,e))};_.onclick=async function t(){_.onclick=null,_.classList.add("disbtn");try{let e=T(),o=await k.req(e,"/reader/get_my_info",{});Object.entries(e).forEach(([a,n])=>localStorage.setItem(a,n)),alert(`成功:
`+JSON.stringify(o,null,"\t"))}catch(e){throw alert(`错误:
`+e),e}finally{_.onclick=t,_.classList.remove("disbtn")}};var y=document.getElementById("root");function x(t,e){let o=document.createElement("li"),a=document.createElement("div"),n=document.createElement("ul");return o.append(a,n),o.className=t,a.innerText=e,a.onclick=(l)=>l.target===a&&o.classList.toggle("col"),[o,a,n]}function f(t){let e=document.createElement("span");return e.className="btn",e.innerText=t,e}var E=document.getElementById("btnGetShelf"),w=document.getElementById("btnGetBkToc"),L=document.getElementById("btnDownload"),C=-1,H=[];function P(t,e=!1){let o=t.target.parentElement.parentElement,a=C,n=C=parseInt(o.dataset.seq);if((t.shiftKey||e)&&a>=0&&a!==n){let l=Math.min(a,n),h=Math.max(a,n);for(let m=l;m<=h;m++){if(m===a)continue;H[m].classList.toggle("sel")}}else o.classList.toggle("sel")}function X(t){t.preventDefault(),P(t,!0)}function K(t){let e=!!t.find((o)=>!o.classList.contains("sel"));t.forEach((o)=>o.classList.toggle("sel",e))}function U(t){t.forEach((e)=>e.classList.toggle("sel"))}function S(t,e,o,a){return t.onclick=()=>{e.classList.remove("col"),e.querySelectorAll("li.col").forEach((n)=>n.classList.remove("col")),K([...o.querySelectorAll(a)])},t.oncontextmenu=(n)=>{n.preventDefault(),e.classList.remove("col"),e.querySelectorAll("li.col").forEach((l)=>l.classList.remove("col")),U([...o.querySelectorAll(a)])},t}function I(t,e){return[S(f("[已购]"),t,e,".cpt.acc"),S(f("[免费]"),t,e,".cpt:not(.vip)"),S(f("[付费]"),t,e,".cpt.vip"),S(f("[全部章节]"),t,e,".cpt"),S(f("[已下]"),t,e,".cpt.dl")]}L.before(...I(y,y));async function F(t,e){let o=(await k.req(T(),"/chapter/get_updated_chapter_by_division_new",{book_id:t,division_id:"0"})).data.chapter_list;[...e.childNodes].forEach((p)=>p.remove());let a=-1,n=[];function l(p,u=!1){let r=p.target,i=a,s=a=parseInt(r.dataset.seq);if((p.shiftKey||u)&&i>=0&&i!=s){let c=Math.min(i,s),b=Math.max(i,s);for(let d=c;d<=b;d++){if(d===i)continue;n[d].classList.toggle("sel")}}else r.classList.toggle("sel")}function h(p){p.preventDefault(),l(p,!0)}let m=new Set(await new Promise((p,u)=>{let r=A.transaction("cpt","readonly").objectStore("cpt").getAllKeys();r.onerror=()=>u(r.error),r.onsuccess=()=>p(r.result)}));for(let p of o){let[u,r,i]=x("div",p.division_name);r.append(...I(u,i)),u.dataset.divName=p.division_name,e.appendChild(u);for(let s of p.chapter_list){let c=i.appendChild(document.createElement("li"));if(c.className="cpt",c.classList.toggle("vip",!!parseInt(s.is_paid)),c.classList.toggle("dl",m.has(s.chapter_id)),parseInt(s.auth_access))c.classList.add("sel","acc");c.innerText=s.chapter_title,c.dataset.cptId=s.chapter_id,c.dataset.cptName=s.chapter_title,c.dataset.seq=n.length.toString(),n.push(c),c.onclick=l,c.oncontextmenu=h}}}var Q={chapter_id:"",txt_content:"(未下载)",author_say:""};async function Z(t){let e=[...t.querySelectorAll("li.cpt")],a=A.transaction("cpt","readonly").objectStore("cpt"),n={};await Promise.all(e.map((u)=>new Promise((r,i)=>{let s=u.dataset.cptId,c=a.get(s);c.onerror=()=>i(c.error),c.onsuccess=()=>{if(c.result)n[s]=c.result;r()}})));let l=[],h=[`${t.dataset.bookId} ${t.dataset.bookName} ${t.dataset.authorName}`,""];for(let u of t.lastElementChild.childNodes){if(!(u instanceof HTMLLIElement))continue;let r=u.dataset.divName;l.push("# "+r),h.push("# "+r);for(let i of u.lastElementChild.childNodes){if(!(i instanceof HTMLLIElement))continue;let s=i.dataset.cptId,c=i.dataset.cptName,b=n[s]??Q;l.push("- "+c),h.push("- "+c),h.push((b.txt_content+`

`+b.author_say).trimEnd())}}h[1]=l.join(`
`);let m=document.createElement("a"),p=URL.createObjectURL(new Blob([h.join(`

`)],{type:"text/plain"}));setTimeout(()=>URL.revokeObjectURL(p),60000),m.download=`${t.dataset.bookId}_${t.dataset.bookName}_${t.dataset.authorName}.txt`,m.target="_blank",m.href=p,m.click()}E.onclick=async function t(){E.onclick=null,E.classList.add("disbtn");try{let o=T(),a=(await k.req(o,"/bookshelf/get_shelf_list",{})).data.shelf_list;[...y.childNodes].forEach((n)=>n.remove()),C=-1,H=[];for(let n of a){console.log(`书架: ${n.shelf_id} ${n.shelf_name}`);let l=[],[h,m,p]=x("shelf",n.shelf_name);y.appendChild(h);for(let r=0;;r++){let i=(await k.req(o,"/bookshelf/get_shelf_book_list_new",{count:100 .toString(),order:"last_read_time",page:r.toString(),shelf_id:n.shelf_id})).data.book_list;for(let{book_info:{book_id:s,book_name:c,author_name:b}}of i){console.log(`- 书: ${s} ${c}`);let[d,g,q]=x("book",`${c} ${b}`),M=f("");M.classList.add("check"),M.onclick=P,M.oncontextmenu=X,g.prepend(M),d.dataset.bookId=s,d.dataset.bookName=c,d.dataset.authorName=b,d.dataset.seq=H.length.toString(),d.classList.add("sel"),H.push(d),l.push(d),p.appendChild(d);let G=g.appendChild(f("[导出TXT]"));G.onclick=()=>Z(d);let v=g.appendChild(f("[刷新目录]"));v.classList.add("gettoc"),v.onclick=async function R(){v.onclick=null,v.classList.add("disbtn");try{console.log(`刷新目录: ${s} ${c}`),await F(s,q),d.classList.remove("col")}catch(N){throw alert(`错误:
`+N),N}finally{v.onclick=R,v.classList.remove("disbtn")}},g.append(...I(d,q))}if(i.length<100)break}let u=m.appendChild(f("[书:全/反]"));u.onclick=(r)=>{h.classList.remove("col"),K(l)},u.oncontextmenu=(r)=>{r.preventDefault(),h.classList.remove("col"),U(l)},m.append(...I(h,p))}}catch(e){throw alert(`错误:
`+e),e}finally{E.onclick=t,E.classList.remove("disbtn")}};w.onclick=async function t(){w.onclick=null,w.classList.add("disbtn");try{let e=new PointerEvent(""),o=[...y.querySelectorAll("li.book.sel span.btn.gettoc")];for(let a of o)await a.onclick(e)}finally{w.onclick=t,w.classList.remove("disbtn")}};var O=document.getElementById("progress");L.onclick=async function t(){L.onclick=null,L.classList.add("disbtn");try{let e=T(),o=[...y.querySelectorAll("li.book.sel li.cpt.sel")];if(!confirm(`是否下载 ${o.length} 章?`))return;let n=[];for(let l=0;l<o.length;)n.push(o.slice(l,l+=10));for(let l=0;l<n.length;l++){O.innerText=`${l} / ${n.length}`;let h=n[l],m=Object.fromEntries(h.map((s)=>[s.dataset.cptId,s])),p=h.map((s)=>s.dataset.cptId).join(","),u=(await k.req(e,"/chapter/get_chapter_download_cmd",{chapter_id:p})).data.command,r=(await k.req(e,"/chapter/download_cpt",{chapter_id:p,chapter_command:u})).data.chapter_infos,i=JSON.parse(W.decode(await k.decKsy(r,u),{stream:!1}));await new Promise((s,c)=>{let b=A.transaction("cpt","readwrite");b.oncomplete=s,b.onerror=()=>c(b.error);let d=b.objectStore("cpt");i.forEach((g)=>d.put(g))}),i.forEach((s)=>{let c=m[s.chapter_id];c.classList.remove("sel"),c.classList.add("dl")})}O.innerText="下载完成"}catch(e){throw alert(`错误:
`+e),e}finally{L.onclick=t,L.classList.remove("disbtn")}};
})()
