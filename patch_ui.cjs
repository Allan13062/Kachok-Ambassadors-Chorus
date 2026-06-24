const fs = require('fs');
const path = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{showResetUI \? \([\s\S]*?Bypass Login\s*<\/button>\s*<\/div>\s*<\/form>\s*\)\}/;

const replaceWith = `{showResetUI ? (
                  <form onSubmit={handleResetSubmit} className="mt-2 max-w-sm w-full flex flex-col gap-3.5 relative z-10">
                    <div className="relative">
                      <input 
                        type="email"
                        required
                        value={adminEmail || ""}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Admin Email Address"
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-400 rounded-xl p-4 outline-none text-sm placeholder-slate-600 transition-all font-sans text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-all cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 shadow-xl shadow-emerald-500/10 mt-1 active:scale-[0.98]"
                    >
                      {authLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : "Send Reset Link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetUI(false);
                        setResetErrorMsg("");
                        setResetMessage("");
                      }}
                      className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 hover:text-white mt-1 transition-colors cursor-pointer font-mono"
                    >
                      Back to Sign In
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="mt-2 max-w-sm w-full flex flex-col gap-3.5 relative z-10">
                    <div className="relative">
                      <input 
                        type="email"
                        required
                        value={adminEmail || ""}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Admin Email Address"
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-400 rounded-xl p-4 outline-none text-sm placeholder-slate-600 transition-all font-sans text-white"
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type={isPasscodeVisible ? "text" : "password"}
                        required
                        value={adminPassword || ""}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Admin Password"
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-400 rounded-xl p-4 outline-none text-sm placeholder-slate-600 transition-all font-sans text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasscodeVisible(!isPasscodeVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                      >
                        {isPasscodeVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-extrabold text-sm uppercase tracking-wider py-4 px-6 rounded-xl transition-all cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 shadow-xl shadow-amber-500/10 mt-1 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 shrink-0" />
                          Secure Login
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleGoogleAuthSubmit}
                      disabled={authLoading}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-sans font-semibold text-sm py-3 px-6 rounded-xl transition-all cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 border border-slate-700 mt-1 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                        <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25528 2.69 1.28027 6.60998L5.27028 9.70498C6.21528 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                        <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                        <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                        <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                      </svg>
                      Sign In with Google
                    </button>

                    <div className="flex justify-between items-center mt-2">
                      <button
                        type="button"
                        onClick={() => setShowResetUI(true)}
                        className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 hover:text-amber-400 transition-colors cursor-pointer font-mono"
                      >
                        Reset Password
                      </button>
                    </div>
                  </form>
                )}`;

if (regex.test(content)) {
  content = content.replace(regex, replaceWith);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
