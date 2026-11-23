// DOLLAR STORE — public browser config.
// Location on GitHub: repo ROOT, next to index.html  ->  must open at  /Dollar-Store/config.js
// Only the PUBLIC publishable/anon key belongs here. NEVER paste a secret / service_role key.
window.DS_CONFIG = Object.assign(window.DS_CONFIG || {}, {
  supabaseUrl: "https://afzyerpeoirbcxwymsqg.supabase.co",
  supabaseAnonKey: "sb_publishable_2HPQNM4lN_XHKizbIORz_A_qhLRfLdA"   // <-- replace with the COMPLETE sb_publishable_... key
});
