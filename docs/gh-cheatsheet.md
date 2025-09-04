# GitHub CLI (gh) Cheatsheet

`gh` adalah command-line tool resmi untuk berinteraksi dengan GitHub langsung dari terminal.
Dengan `gh`, kamu bisa membuat repo, issue, PR, gist, hingga autentikasi GitHub tanpa membuka browser.

## Autentikasi

| Perintah | Deskripsi |
|----------|-----------|
| `gh auth login` | Login ke GitHub (via HTTPS/SSH/web/token) |
| `gh auth logout` | Logout dari akun GitHub |
| `gh auth status` | Lihat status login & user aktif |
| `gh auth refresh` | Refresh token OAuth |

## Repositori

| Perintah | Deskripsi |
|----------|-----------|
| `gh repo clone owner/repo` | Clone repo GitHub |
| `gh repo create` | Buat repo baru (lokal & remote) |
| `gh repo fork owner/repo` | Fork repo |
| `gh repo view` | Lihat detail repo (README, issues, dsb.) |
| `gh repo delete` | Hapus repo (butuh konfirmasi) |

## Issues

| Perintah | Deskripsi |
|----------|-----------|
| `gh issue list` | Daftar issue terbuka |
| `gh issue create` | Buat issue baru |
| `gh issue view 123` | Lihat issue dengan ID/nomor 123 |
| `gh issue close 123` | Tutup issue |
| `gh issue reopen 123` | Buka kembali issue |

## Pull Request (PR)

| Perintah | Deskripsi |
|----------|-----------|
| `gh pr list` | Daftar PR aktif |
| `gh pr create` | Buat PR baru |
| `gh pr view 45` | Lihat PR #45 |
| `gh pr checkout 45` | Checkout branch dari PR |
| `gh pr merge 45` | Merge PR ke branch utama |
| `gh pr close 45` | Tutup PR tanpa merge |

## Gist

| Perintah | Deskripsi |
|----------|-----------|
| `gh gist create file.txt` | Buat gist baru dari file |
| `gh gist list` | Daftar gist milik user |
| `gh gist view GIST_ID` | Lihat gist berdasarkan ID |
| `gh gist delete GIST_ID` | Hapus gist |

## Lain-lain & Tips

| Perintah | Deskripsi |
|----------|-----------|
| `gh help` | Lihat semua command tersedia |
| `gh alias set co 'pr checkout'` | Buat alias (`gh co 45` → `gh pr checkout 45`) |
| `gh completion -s bash` | Aktifkan auto-completion (bash) |
| `gh completion -s zsh` | Aktifkan auto-completion (zsh) |
| `gh api /user` | Panggil GitHub API langsung dari CLI |

## Contoh Workflow Harian

```bash
# 1. Clone repo
gh repo clone owner/repo

# 2. Buat branch baru
git checkout -b fitur-baru

# 3. Commit & push perubahan
git add .
git commit -m "Menambahkan fitur baru"
git push origin fitur-baru

# 4. Buat Pull Request langsung dari terminal
gh pr create --fill

# 5. Review & merge PR
gh pr checkout 45
gh pr merge 45 --squash
```

## Interaktif di GhSwitch

Di menu utama GhSwitch, pilih:
- "Install/Check GitHub CLI" untuk memastikan `gh` terpasang
- "GitHub Auth (gh)" untuk login/status/logout & upload SSH key
- "GitHub CLI Toolkit" untuk menjalankan perintah `gh` secara interaktif dengan auto-sugesti:
  - Sugesti `owner/repo` otomatis dari remote `origin`
  - Pilih Issue/PR lewat daftar (autocomplete)
  - Buka repo, issue, PR di browser
  - Buat Issue/PR dengan prompt yang nyaman
