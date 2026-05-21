import re

with open('.Jules/palette.md', 'r') as f:
    text = f.read()

# For .Jules/palette.md, just remove the conflict markers and keep the main text
text = re.sub(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> origin/main\n', r'\1\n\2\n', text, flags=re.DOTALL)
with open('.Jules/palette.md', 'w') as f:
    f.write(text)

with open('frontend/src/app/dashboard/page.tsx', 'r') as f:
    text = f.read()

text = re.sub(r'<<<<<<< HEAD\n\s*<div className="bg-surface-container-low rounded-2xl p-10 text-center space-y-5 border-2 border-dashed border-outline-variant/30">\n=======\n\s*<div className="bg-surface-container-low rounded-2xl p-10 text-center space-y-4 border-2 border-dashed border-outline-variant">\n>>>>>>> origin/main', r'            <div className="bg-surface-container-low rounded-2xl p-10 text-center space-y-5 border-2 border-dashed border-outline-variant/30">', text)

text = re.sub(r'<<<<<<< HEAD\n\s*<div className="pt-2">\n\s*<button.*?</button>\n\s*</div>\n=======\n.*?>>>>>>> origin/main', r'''              <div className="pt-2">
                <button
                  onClick={() => router.push("/novo-evento")}
                  className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-6 py-2.5 rounded-full font-label font-bold tracking-widest text-xs uppercase shadow hover:shadow-md transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                    aria-hidden="true"
                  >
                    add
                  </span>
                  {t("dashboard.create_event")}
                </button>
              </div>''', text, flags=re.DOTALL)

with open('frontend/src/app/dashboard/page.tsx', 'w') as f:
    f.write(text)
