const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
app.disable("x-powered-by");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  next();
});

function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

const db = new Database(path.join(__dirname, "blog.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS posts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 0 CHECK(approved IN (0,1))
);

CREATE INDEX IF NOT EXISTS idx_comments_post_approved ON comments(post_id, approved, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(approved, created_at);
`);

if (db.prepare("SELECT COUNT(*) AS c FROM posts").get().c === 0) {
  const ins = db.prepare("INSERT INTO posts(title, body, created_at) VALUES(?,?,?)");
  const now = new Date().toISOString();
  ins.run("Pierwszy post", "To jest przykładowy post do testowania.", now);
  ins.run("Drugi post", "Dodaj komentarz. Nie zobaczysz go publicznie, dopóki nie zostanie zatwierdzony.", now);
}

app.get("/api/posts", (req, res) => {
  const posts = db
    .prepare("SELECT id, title, body, created_at FROM posts ORDER BY id DESC")
    .all();
  res.json(posts);
});

app.post("/api/posts", (req, res) => {
  const { title, body } = req.body || {};
  const t = typeof title === "string" ? title.trim() : "";
  const b = typeof body === "string" ? body.trim() : "";

  if (!t || !b) return jsonError(res, 400, "Invalid title/body");

  const created_at = new Date().toISOString();
  const info = db.prepare("INSERT INTO posts(title, body, created_at) VALUES(?,?,?)").run(t, b, created_at);
  const created = db.prepare("SELECT id, title, body, created_at FROM posts WHERE id=?").get(info.lastInsertRowid);

  res.location(`/api/posts/${created.id}`).status(201).json(created);
});

app.get("/api/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId) || postId <= 0) return jsonError(res, 400, "Invalid post id");

  const post = db.prepare("SELECT id FROM posts WHERE id=?").get(postId);
  if (!post) return jsonError(res, 404, "Post not found");

  const comments = db
    .prepare(`
      SELECT id, post_id, author, body, created_at, approved
      FROM comments
      WHERE post_id=? AND approved=1
      ORDER BY id ASC
    `)
    .all(postId);

  res.json(comments);
});

app.post("/api/posts/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId) || postId <= 0) return jsonError(res, 400, "Invalid post id");

  const post = db.prepare("SELECT id FROM posts WHERE id=?").get(postId);
  if (!post) return jsonError(res, 404, "Post not found");

  const { author, body } = req.body || {};
  const a = typeof author === "string" ? author.trim() : "";
  const b = typeof body === "string" ? body.trim() : "";

  if (!a || !b) return jsonError(res, 400, "Invalid author/body");

  const created_at = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO comments(post_id, author, body, created_at, approved) VALUES(?,?,?,?,0)")
    .run(postId, a, b, created_at);

  const created = db
    .prepare("SELECT id, post_id, author, body, created_at, approved FROM comments WHERE id=?")
    .get(info.lastInsertRowid);

  res.location(`/api/comments/${created.id}`).status(201).json(created);
});

app.post("/api/comments/:id/approve", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return jsonError(res, 400, "Invalid comment id");

  const c = db.prepare("SELECT id, approved FROM comments WHERE id=?").get(id);
  if (!c) return jsonError(res, 404, "Comment not found");

  if (c.approved === 1) return res.json({ ok: true, id, approved: 1 });

  db.prepare("UPDATE comments SET approved=1 WHERE id=?").run(id);
  const updated = db.prepare("SELECT id, post_id, author, body, created_at, approved FROM comments WHERE id=?").get(id);

  res.json(updated);
});

app.get("/api/mod/pending", (req, res) => {
  const pending = db
    .prepare(`
      SELECT c.id, c.post_id, p.title AS post_title, c.author, c.body, c.created_at, c.approved
      FROM comments c
      JOIN posts p ON p.id = c.post_id
      WHERE c.approved=0
      ORDER BY c.created_at ASC
    `)
    .all();
  res.json(pending);
});

app.use("/api", (req, res) => jsonError(res, 404, "Not found"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = Number(process.env.PORT) || 5050;
app.listen(port, () => console.log(`Blog API on http://localhost:${port}`));