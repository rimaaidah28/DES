# Simulator Perhitungan Web Algoritma DES (Data Encryption Standard)

Aplikasi web interaktif ini dirancang khusus untuk mensimulasikan langkah-demi-langkah perhitungan algoritma Data Encryption Standard (DES) secara manual tanpa library kriptografi pihak ketiga (seperti PyCryptodome atau OpenSSL). 

Aplikasi ini sangat cocok digunakan sebagai media pembelajaran bagi mahasiswa mata kuliah Kriptografi dan Keamanan Informasi.

## Fitur Utama
1. **Implementasi DES Murni (Pure Python):** Semua fungsi matematis (IP, PC-1, PC-2, S-Box, Invers IP) dibuat dari nol.
2. **Key Schedule Explorer:** Menampilkan detail pergeseran bit C dan D dari putaran 1 sampai 16 serta hasil subkey secara transparan.
3. **Step-by-Step Feistel Round:** Menyediakan komponen akordeon Bootstrap untuk membedah operasi internal setiap putaran.
4. **Visualisasi S-Box Dinamis:** Membongkar penentuan indeks baris, kolom, dan transformasi biner pada setiap kotak substitusi S-Box.
5. **Round Trip Integrity Verification:** Pengujian otomatis untuk memastikan ciphertext dapat didekripsi kembali menjadi plaintext semula dengan valid.

## Cara Menjalankan Aplikasi di Lokal (Localhost)

### 1. Pastikan Python Terinstal
Gunakan Python versi 3.8 atau yang lebih baru. Periksa versi Python Anda di terminal:
```bash
python --version
