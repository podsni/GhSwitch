# GitHub Account Switcher (Bun)

CLI interaktif untuk mengelola banyak akun GitHub per-repo. Mendukung mode SSH (dengan alias host + key berbeda) dan HTTPS Token. Sudah termasuk fitur impor key (otomatis pakai nama berdasarkan username), tes koneksi, serta CRUD akun.

## Fitur Utama

- Switch akun per repository: ubah remote `origin` ke SSH alias atau HTTPS (token).
- SSH: atur blok `Host` di `~/.ssh/config` dengan `IdentityFile` khusus per akun.
- Token: simpan kredensial di `~/.git-credentials` (credential helper store).
- CRUD Akun: Add, List, Edit, Remove.
- Generate SSH key dan Import SSH private key (auto chmod, auto `.pub`, auto alias/penamaan berdasarkan username).
- Test koneksi: uji SSH alias dan/atau token.

## Prasyarat

- Bun v1.0+
- Git
- OpenSSH (`ssh`, `ssh-keygen`)
- opsional: `curl` (untuk tes token)

## Instalasi

```bash
bun install
```

## Menjalankan

```bash
bun run index.ts
```

Anda akan melihat menu interaktif di terminal.

## Konsep Singkat

- Setiap “akun” menyimpan: label, `user.name`/`user.email` (opsional), konfigurasi SSH (key path + host alias), dan/atau konfigurasi Token (username + PAT).
- Konfigurasi disimpan di `~/.config/github-switch/config.json`.
- Untuk SSH, tool akan menulis blok `Host` pada `~/.ssh/config` seperti contoh:

```
Host github-<label>
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_<label>
  IdentitiesOnly yes
```

## Alur Utama

1) Tambah Akun (Add account)
- Pilih metode: SSH, Token, atau keduanya.
- Isi `user.name`/`user.email` jika ingin di-set per repo saat switch.
- SSH: masukkan path key (bisa generate baru jika belum ada).
- Token: isi username + Personal Access Token (PAT).

2) Import SSH Private Key (opsional, lebih mudah)
- Pilih menu “Import SSH private key”.
- Masukkan GitHub username → tool otomatis menyarankan nama file `~/.ssh/id_ed255ina_<username>` dan alias `github-<username>`.
- Masukkan path private key sumber (mis. `~/.ssh/id_ed25519`).
- Tool akan:
  - Menyalin key ke `~/.ssh/<nama-file>` dan set permission `600`.
  - Membuat public key `<nama-file>.pub` jika belum ada (permission `644`).
  - Opsional menulis blok `Host` di `~/.ssh/config`.
  - Opsional langsung tes koneksi SSH.

3) Switch Akun untuk Repo Saat Ini
- Jalankan tool di dalam folder repo git.
- Pilih “Switch account for current repo”, pilih akun, lalu pilih metode (SSH/Token).
- Tool akan:
  - SSH: set `origin` → `git@<alias>:owner/repo.git`, atur `user.name`/`user.email` lokal repo.
  - Token: set `origin` → `https://github.com/owner/repo.git`, atur `credential.helper store` dan tulis `~/.git-credentials`.
- Jika repo belum punya remote, tool akan minta input `owner/repo`.

4) Tes Koneksi
- Pilih “Test connection”, pilih akun, lalu pilih metode:
  - SSH: jalankan `ssh -T git@<alias>` dan laporkan hasil.
  - Token: cek `https://api.github.com/user` dengan Basic Auth; sukses bila HTTP 200.

5) Edit/Hapus/List Akun
- Edit: ubah label, `user.name`/`user.email`, aktif/nonaktif metode, ganti key path/alias atau token.
- Remove: hapus akun dari konfigurasi (tidak menghapus blok `Host` otomatis agar aman; bisa dihapus manual bila perlu).
- List: tampilkan ringkasan akun yang tersimpan.

## Mode SSH (Detail)

- Generate Key: menu “Generate SSH key for an account”. Key dibuat dengan tipe Ed25519, tanpa passphrase (bisa Anda tambah sendiri nanti).
- Import Key: menu “Import SSH private key”.
  - Penamaan otomatis berdasarkan GitHub username untuk konsistensi.
  - Izin file di-set: private `600`, public `644`.
  - Alihkan host alias di `~/.ssh/config` untuk memaksa key tertentu saat akses GitHub.

## Mode Token (HTTPS)

- Remote di-set ke `https://github.com/owner/repo.git`.
- `credential.helper store` akan menulis token ke `~/.git-credentials` dalam plaintext.
- Catatan keamanan: pertimbangkan pakai SSH bila memungkinkan guna menghindari penyimpanan token plaintext.

## Tips & Praktik Terbaik

- Gunakan alias yang konsisten, mis. `github-work`, `github-personal`.
- Jika punya beberapa key, pastikan setiap repo diarahkan ke alias yang tepat.
- Untuk token, beri scope minimal yang diperlukan.

## Troubleshooting

- SSH test gagal:
  - Periksa `~/.ssh/config` apakah blok `Host` sudah benar.
  - Pastikan permission: private `600`, public `644`.
  - Pastikan public key sudah ditambahkan ke GitHub (Settings → SSH and GPG keys).

- Token test gagal (HTTP != 200):
  - Cek username/token benar dan token belum expired.
  - Periksa scope token sesuai kebutuhan (read/write repo, dsb.).

- Repo tidak punya remote:
  - Tool akan meminta `owner/repo`. Pastikan format benar, contoh: `myorg/myrepo`.

## Uninstall / Pembersihan

- Hapus konfigurasi: `rm -f ~/.config/github-switch/config.json`.
- Mode Token: hapus baris terkait dari `~/.git-credentials` bila perlu.
- Mode SSH: hapus blok `Host` relevan dari `~/.ssh/config` bila ingin.

## Struktur Proyek (Singkat)

- `index.ts` — entry, memanggil CLI utama.
- `src/cli.ts` — menu interaktif.
- `src/flows.ts` — implementasi alur: CRUD, switch, import, test.
- `src/ssh.ts` — util SSH: keygen, import, chmod, tulis `~/.ssh/config`.
- `src/git.ts` — util Git: remote, identity, credential store, tes token.
- `src/config.ts` — load/save config JSON.
- `src/types.ts` — definisi tipe.
- `src/utils/shell.ts` — helper eksekusi perintah shell.

—

Proyek ini berjalan di [Bun](https://bun.com).
# GhSwitch
