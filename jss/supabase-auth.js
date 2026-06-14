(function(){
  let client = null;
  function publicConfig(){
    const xhr = new XMLHttpRequest();
    xhr.open('GET','/api/public-config',false);
    xhr.send(null);
    if (xhr.status >= 400) throw new Error('Không tải được cấu hình Supabase.');
    return JSON.parse(xhr.responseText || '{}');
  }
  window.CVMSAuth = {
    client(){
      if (client) return client;
      if (!window.supabase?.createClient) throw new Error('Chưa tải Supabase Auth SDK.');
      const cfg = publicConfig();
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
      return client;
    },
    async currentSession(){ return (await this.client().auth.getSession()).data.session || null; },
    async signUp(email,password){ return await this.client().auth.signUp({ email, password }); },
    async signIn(email,password){ return await this.client().auth.signInWithPassword({ email, password }); },
    async signOut(){ return await this.client().auth.signOut(); }
  };
})();
