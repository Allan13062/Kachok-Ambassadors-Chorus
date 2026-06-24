const fs = require('fs');
const path = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const adminSectionStr = `
              {/* SECTION: ADMIN MANAGEMENT */}
              {auth.currentUser?.email === "allangeorge566@gmail.com" && (
                <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl mb-8">
                  <div className="flex items-center gap-2 text-amber-400 mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-805 text-sm font-bold uppercase tracking-wider">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    <span>Admin Management (Super Admin Only)</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-4">
                    Add another administrator by entering their email address. They will be able to log in using Google Sign-In with that email.
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="email"
                      id="newAdminEmail"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded p-2.5 text-white outline-none focus:border-amber-400 font-sans"
                      placeholder="e.g. co-admin@example.com"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const emailInput = document.getElementById('newAdminEmail') as HTMLInputElement;
                        const email = emailInput?.value.trim();
                        if (!email) return;
                        try {
                          const { doc, setDoc } = await import('firebase/firestore');
                          const { db } = await import('../lib/firebase');
                          await setDoc(doc(db, 'admins', email), {
                            email: email,
                            role: 'admin',
                            createdAt: new Date().toISOString()
                          }, { merge: true });
                          alert('Admin added successfully!');
                          emailInput.value = '';
                        } catch (e: any) {
                          alert('Failed to add admin: ' + e.message);
                        }
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-xs uppercase"
                    >
                      Add Admin
                    </button>
                  </div>
                </div>
              )}
`;

content = content.replace('{/* SECTION C: CHANGE ADMIN PASSCODE */}', adminSectionStr + '\n              {/* SECTION C: CHANGE ADMIN PASSCODE */}');

if (!content.includes('UserPlus')) {
  content = content.replace('import { ', 'import { UserPlus, ');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Success');
