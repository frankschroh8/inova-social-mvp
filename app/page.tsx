"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Post {
  id: number;
  content: string;
  created_at: string;
  user_email?: string;
  likes?: number;
  image_url?: string;
}

export default function Home() {
  const [legenda, setLegenda] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingIA, setLoadingIA] = useState(false);

  // 📥 CARREGAR POSTS
  async function carregarPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
  }

  // 📤 UPLOAD IMAGEM
  async function uploadImagem(file: File) {
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("posts")
      .upload(fileName, file);

    if (error) {
      alert("Erro upload imagem");
      return null;
    }

    const { data } = supabase.storage
      .from("posts")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  // 📝 PUBLICAR POST
  async function publicar() {
    if (!legenda.trim() && !imagem) return;

    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;

    let imageUrl = null;

    if (imagem) {
      imageUrl = await uploadImagem(imagem);
    }

    const { error } = await supabase.from("posts").insert([
      {
        content: legenda,
        user_email: email,
        image_url: imageUrl,
        likes: 0,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setLegenda("");
    setImagem(null);
    carregarPosts();
  }

  // ❤️ CURTIR POST
  async function curtirPost(id: number, likes: number) {
    await supabase
      .from("posts")
      .update({ likes: likes + 1 })
      .eq("id", id);

    carregarPosts();
  }

  // 🤖 IA GERAR POST
  async function gerarIA() {
    if (!legenda.trim()) {
      alert("Digite um tema primeiro");
      return;
    }

    setLoadingIA(true);

    const { data: userData } = await supabase.auth.getUser();

    const res = await fetch("/api/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: legenda,
        email: userData.user?.email,
      }),
    });

    const data = await res.json();

    setLoadingIA(false);

    if (data.texto) {
      setLegenda(data.texto);
    } else {
      alert(data.error || "Erro IA");
    }
  }

  // 💳 ASSINAR PRO
  async function assinarPro() {
    const res = await fetch("/api/checkout", {
      method: "POST",
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    }
  }

  useEffect(() => {
    carregarPosts();
  }, []);

  return (
    <div style={{ padding: 30, background: "#111", color: "#fff", minHeight: "100vh" }}>
      <h1>🚀 Inova Social AI</h1>

      {/* NOVO POST */}
      <div style={{ background: "#222", padding: 20, marginTop: 20, borderRadius: 10 }}>
        <h2>Nova postagem</h2>

        <input
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          placeholder="Digite uma legenda ou tema"
          style={{ width: "100%", padding: 10, marginTop: 10 }}
        />

        {/* IMAGEM */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setImagem(e.target.files[0]);
            }
          }}
          style={{ marginTop: 10 }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={publicar}>📤 Publicar</button>

          <button
            onClick={gerarIA}
            disabled={loadingIA}
            style={{
              background: "#4f46e5",
              color: "#fff",
              padding: "10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loadingIA ? "Gerando..." : "✨ IA gerar"}
          </button>
        </div>
      </div>

      {/* BOTÃO PRO */}
      <button
        onClick={assinarPro}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "gold",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        💳 Virar PRO
      </button>

      {/* FEED */}
      <div style={{ marginTop: 30 }}>
        <h2>📢 Feed</h2>

        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              background: "#222",
              padding: 15,
              marginTop: 10,
              borderRadius: 10,
            }}
          >
            <p>{post.content}</p>

            {post.image_url && (
              <img
                src={post.image_url}
                style={{
                  width: "100%",
                  marginTop: 10,
                  borderRadius: 10,
                }}
              />
            )}

            <small>
              {new Date(post.created_at).toLocaleString("pt-BR")}
            </small>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => curtirPost(post.id, post.likes || 0)}
              >
                ❤️ Curtir ({post.likes || 0})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}