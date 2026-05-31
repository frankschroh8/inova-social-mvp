async function entrar() {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    alert(error.message);
    return;
  }

  // 🔥 redireciona após login
  window.location.href = "/dashboard";
}