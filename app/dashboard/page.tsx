"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setUser(data.user);

    if (data.user.email) {
      carregarPosts(data.user.email);
    }
  }

  async function carregarPosts(email: string) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (data) {
      setPosts(data);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div
      style={{
        padding: 40,
        background: "#111",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>🚀 Dashboard Inova Social AI</h1>

      <h3>Bem-vindo:</h3>
      <p>{user?.email}</p>

      <button onClick={sair} style={{ padding: 10, marginTop: 10 }}>
        Sair
      </button>

      <hr style={{ margin: "30px 0" }} />

      <h2>📌 Meus Posts</h2>

      {posts.length === 0 && <p>Nenhum post ainda.</p>}

      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            background: "#222",
            padding: 15,
            marginTop: 10,
            borderRadius: 8,
          }}
        >
          <p>{post.content}</p>
          <small>
            {new Date(post.created_at).toLocaleString("pt-BR")}
          </small>
        </div>
      ))}
    </div>
  );
}