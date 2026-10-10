"""Halaman statis sumber & provenans Body Exposure untuk situs: public/bodyexposure/provenance.html.

  python3 bodyexposure/pipeline/publish_provenance_page.py        (butuh paket `markdown`)

Dibuat dari bodyexposure/PROVENANCE.md + CREDITS.txt + daftar berkas di public/bodyexposure. HTML mandiri (tanpa skrip, tanpa sumber luar,
tema terang/gelap mengikuti perangkat) agar tidak membebani atau mengganggu aplikasi. Tidak ada klaim baru: isi hanya salinan catatan yang sudah ada.
"""
import glob, html, os, re
import markdown

PUB = "public/bodyexposure"
md = open("bodyexposure/PROVENANCE.md", encoding="utf-8").read()
credits = open(f"{PUB}/CREDITS.txt", encoding="utf-8").read()
body = markdown.markdown(md, extensions=["tables", "fenced_code", "sane_lists"])


def size(p):
    n = os.path.getsize(p)
    return f"{n / 1e6:.1f} MB" if n >= 1e6 else f"{n / 1e3:.0f} KB"


rows = []
for p in sorted(glob.glob(f"{PUB}/vhf_denver_ct_adult_female.*.glb")):
    n = os.path.basename(p)
    kind = "rig and range-of-motion clip" if "rig_rom" in n else re.search(r"LOD\d", n).group() + " (" + n.split(".")[1] + ")"
    rows.append(f'<tr><td><a href="{n}">{html.escape(n)}</a></td><td>{html.escape(kind)}</td><td>{size(p)}</td></tr>')
downloads = ('<table><thead><tr><th>File</th><th>Content</th><th>Size</th></tr></thead><tbody>' + "".join(rows) + "</tbody></table>"
             '<p>LOD1 is the most detailed published level of the skeleton variant; the viewer itself loads LOD2 to LOD4. All files are glTF binary (GLB), '
             'meshopt-compressed; each node name is a structure ID and its extras carry the source and method.</p>')
page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Body Exposure sources and provenance</title>
<meta name="description" content="Where every Body Exposure anatomical model comes from, its licence, method and limits.">
<style>
:root{{--bg:#fff;--fg:#14181f;--mut:#566170;--line:#d9dee6;--accent:#0a7d5a;--code:#f3f5f8}}
@media (prefers-color-scheme:dark){{:root{{--bg:#0b0d11;--fg:#e8ecf2;--mut:#9aa6b6;--line:#2a3140;--accent:#4fd1a1;--code:#151a22}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}}
main{{max-width:880px;margin:0 auto;padding:24px 16px 64px;overflow-wrap:anywhere}}
h1{{font-size:1.7rem;margin:.2em 0 .4em}}h2{{margin-top:2em;border-top:1px solid var(--line);padding-top:1em;font-size:1.25rem}}h3{{font-size:1.05rem}}
a{{color:var(--accent)}}code,pre{{background:var(--code);border-radius:6px;font-size:.88em}}code{{padding:.1em .35em;overflow-wrap:anywhere}}pre{{padding:12px;white-space:pre-wrap;overflow-wrap:anywhere}}
table{{border-collapse:collapse;display:block;overflow-x:auto;max-width:100%}}th,td{{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}}
.note{{border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:8px;padding:12px 16px;margin:16px 0;color:var(--mut)}}
</style></head><body><main>
<p><a href="../#/body-exposure/canonical">&larr; Back to Body Exposure</a></p>
<h1>Body Exposure: sources and provenance</h1>
<div class="note"><strong>Educational models.</strong> Nothing here is patient-specific anatomy or a clinical tool, and no structure has been clinically reviewed
(<code>clinically_reviewed</code> is false everywhere). Bodies built from one donor are labelled as that individual, not as an atlas.
Structures marked <em>model segmented</em> were produced by a machine segmentation model and have no measured accuracy unless stated.</div>
<h2>Downloads: Visible Human skeleton (Denver + CT)</h2>
{downloads}
<h2>Credits and licences</h2>
<pre>{html.escape(credits)}</pre>
<h2>Detailed provenance notes</h2>
{body}
</main></body></html>
"""
open(f"{PUB}/provenance.html", "w", encoding="utf-8").write(page)
print("WROTE", f"{PUB}/provenance.html", len(page), "bytes;", len(rows), "download rows")
