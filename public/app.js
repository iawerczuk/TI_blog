const API = window.API_BASE || "http://localhost:5050";

const qs = (s, el=document) => el.querySelector(s);
const json = r => r.ok ? r.json() : r.text().then(t => Promise.reject({status:r.status, text:t}));

const postsEl = qs("#posts");
const commentsEl = qs("#comments");
const pendingEl = qs("#pending");
const selectedPostEl = qs("#selected-post");

const postForm = qs("#post-form");
const postMsg = qs("#post-msg");

const commentForm = qs("#comment-form");
const commentMsg = qs("#comment-msg");

let selectedPostId = null;

async function loadPosts(){
  const posts = await fetch(`${API}/api/posts`).then(json);
  postsEl.innerHTML = "";

  for(const p of posts){
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div><b>${escapeHtml(p.title)}</b></div>
      <div class="small">${new Date(p.created_at).toLocaleString()}</div>
      <p>${escapeHtml(p.body)}</p>
      <div class="row">
        <button type="button" class="pick">Komentarze</button>
      </div>
    `;

    div.querySelector(".pick").addEventListener("click", async () => {
      selectedPostId = p.id;
      selectedPostEl.textContent = `Wybrany post: ${p.title} (id=${p.id})`;
      await loadComments();
    });

    postsEl.appendChild(div);
  }
}

async function loadComments(){
  if(!selectedPostId){
    commentsEl.innerHTML = "<div class='hint'>Wybierz post, aby zobaczyć komentarze.</div>";
    return;
  }
  const comments = await fetch(`${API}/api/posts/${selectedPostId}/comments`).then(json);
  commentsEl.innerHTML = "";

  if(comments.length === 0){
    commentsEl.innerHTML = "<div class='hint'>Brak zatwierdzonych komentarzy.</div>";
    return;
  }

  for(const c of comments){
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div><b>${escapeHtml(c.author)}</b> <span class="small">${new Date(c.created_at).toLocaleString()}</span></div>
      <div>${escapeHtml(c.body)}</div>
    `;
    commentsEl.appendChild(div);
  }
}

async function loadPending(){
  const pending = await fetch(`${API}/api/mod/pending`).then(json);
  pendingEl.innerHTML = "";

  if(pending.length === 0){
    pendingEl.innerHTML = "<div class='hint'>Brak komentarzy do zatwierdzenia.</div>";
    return;
  }

  for(const c of pending){
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="small">Post: <b>${escapeHtml(c.post_title)}</b> (post nr ${c.post_id})</div>
      <div><b>${escapeHtml(c.author)}</b> <span class="small">${new Date(c.created_at).toLocaleString()}</span></div>
      <div>${escapeHtml(c.body)}</div>
      <div class="row" style="margin-top:8px;">
        <button type="button" class="approve">Zatwierdź</button>
      </div>
    `;

    div.querySelector(".approve").addEventListener("click", async () => {
      await fetch(`${API}/api/comments/${c.id}/approve`, { method:"POST" }).then(json);
      await Promise.all([loadPending(), loadComments()]);
    });

    pendingEl.appendChild(div);
  }
}

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(postForm);
  const body = Object.fromEntries(fd.entries());

  try{
    await fetch(`${API}/api/posts`, {
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ title: body.title, body: body.body })
    }).then(json);

    postMsg.textContent = "Dodano post";
    postForm.reset();
    await loadPosts();
  }catch(err){
    postMsg.textContent = `Błąd (${err.status}) ${err.text || ""}`;
  }
});

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if(!selectedPostId){
    commentMsg.textContent = "Najpierw wybierz post.";
    return;
  }

  const fd = new FormData(commentForm);
  const body = Object.fromEntries(fd.entries());

  try{
    const created = await fetch(`${API}/api/posts/${selectedPostId}/comments`, {
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ author: body.author, body: body.body })
    }).then(json);

    commentMsg.textContent = `Dodano komentarz. Czeka na zatwierdzenie.`;
    commentForm.reset();
    await loadPending();
    await loadComments(); 
  }catch(err){
    commentMsg.textContent = `Błąd (${err.status}) ${err.text || ""}`;
  }
});

function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

(async function init(){
  try{
    await loadPosts();
    await loadPending();
    await loadComments();
  }catch(e){
    console.error(e);
  }
})();