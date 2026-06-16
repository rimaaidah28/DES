# des.py - Implementasi Algoritma Standar DES dari Nol

from tables import IP, IP_INV, PC1, PC2, SHIFT_SCHEDULE, EXPANSION_E, PERMUTATION_P, SBOX

def hex_to_bin(hex_str):
    """Mengonversi string Hexadecimal ke string Binary 64-bit."""
    return bin(int(hex_str, 16))[2:].zfill(64)

def bin_to_hex(bin_str):
    """Mengonversi string Binary ke string Hexadecimal dengan huruf kapital."""
    hex_data = hex(int(bin_str, 2))[2:].upper()
    # Sesuaikan panjang output hex berdasarkan panjang bin block (64 bit -> 16 hex chars)
    return hex_data.zfill(len(bin_str) // 4)

def permute(block, table):
    """Melakukan permutasi urutan bit berdasarkan tabel indeks pembantu."""
    return "".join(block[i - 1] for i in table)

def left_shift(block, num_shifts):
    """Melakukan operasi Circular Left Shift (pergeseran sirkular kiri) pada string bit."""
    return block[num_shifts:] + block[:num_shifts]

def xor(bits1, bits2):
    """Melakukan operasi gerbang logika XOR antara dua buah string biner."""
    return "".join(str(int(b1) ^ int(b2)) for b1, b2 in zip(bits1, bits2))

def generate_keys(key_hex):
    """Pembangkitan Subkey (Key Schedule) DES sebanyak 16 Round."""
    steps = {}
    # Konversi Kunci Utama ke Biner
    key_bin = hex_to_bin(key_hex)
    steps['input_key_bin'] = key_bin
    
    # Permutasi Kompresi PC-1 (64-bit -> 56-bit)
    pc1_out = permute(key_bin, PC1)
    steps['pc1_out'] = pc1_out
    
    # Pembagian Kunci Menjadi Dua Bagian (C0 dan D0)
    c = pc1_out[:28]
    d = pc1_out[28:]
    steps['c0'] = c
    steps['d0'] = d
    
    subkeys = []
    rounds_step = []
    
    for r in range(16):
        shifts = SHIFT_SCHEDULE[r]
        c = left_shift(c, shifts)
        d = left_shift(d, shifts)
        
        # Permutasi Pilihan PC-2 (56-bit -> 48-bit)
        combined = c + d
        subkey = permute(combined, PC2)
        subkeys.append(subkey)
        
        rounds_step.append({
            'round': r + 1,
            'shifts': shifts,
            'c': c,
            'd': d,
            'subkey': subkey
        })
        
    steps['rounds'] = rounds_step
    steps['subkeys'] = subkeys
    return subkeys, steps

def sbox_substitution(bits_48):
    """Substitusi blok 48-bit menggunakan 8 buah S-Box standar DES (Output: 32-bit)."""
    output_bits = ""
    sbox_visuals = []
    
    for i in range(8):
        # Setiap S-Box memproses block 6-bit secara berurutan
        block = bits_48[i*6 : (i+1)*6]
        
        # Penentuan baris (bit ke-1 dan bit ke-6)
        row_bits = block[0] + block[5]
        row = int(row_bits, 2)
        
        # Penentuan kolom (bit ke-2 sampai bit ke-5)
        col_bits = block[1:5]
        col = int(col_bits, 2)
        
        # Nilai Desimal dari matriks S-Box
        val_dec = SBOX[i][row][col]
        val_bin = bin(val_dec)[2:].zfill(4)
        
        output_bits += val_bin
        
        sbox_visuals.append({
            'sbox_num': i + 1,
            'input': block,
            'row_bin': row_bits,
            'row_dec': row,
            'col_bin': col_bits,
            'col_dec': col,
            'val_dec': val_dec,
            'output': val_bin
        })
        
    return output_bits, sbox_visuals

def feistel_round(r_block, subkey):
    """Fungsi Utama Feistel (F Function) di setiap Putaran DES."""
    # 1. Ekspansi E dari 32-bit ke 48-bit
    expanded = permute(r_block, EXPANSION_E)
    
    # 2. XOR Antara Hasil Ekspansi dengan Subkey Putaran Terkait
    xor_res = xor(expanded, subkey)
    
    # 3. Substitusi Melalui Komponen S-Box
    sbox_out, sbox_visuals = sbox_substitution(xor_res)
    
    # 4. Permutasi P (32-bit)
    p_out = permute(sbox_out, PERMUTATION_P)
    
    round_internal = {
        'expanded': expanded,
        'xor_res': xor_res,
        'sbox_out': sbox_out,
        'p_out': p_out,
        'sbox_visuals': sbox_visuals
    }
    return p_out, round_internal

def process_des(input_hex, key_hex, mode='encrypt'):
    """Fungsi Utama Eksekusi Enkripsi / Dekripsi DES dengan log kalkulasi lengkap."""
    logs = {}
    
    # 1. Generate Subkeys
    subkeys, key_steps = generate_keys(key_hex)
    logs['key_schedule'] = key_steps
    
    # Jika mode dekripsi, balik urutan subkey dari K16 menuju K1
    if mode == 'decrypt':
        subkeys = subkeys[::-1]
        
    # Konversi Input Data ke Format Biner
    input_bin = hex_to_bin(input_hex)
    logs['input_bin'] = input_bin
    
    # 2. Permutasi Awal / Initial Permutation (IP)
    ip_out = permute(input_bin, IP)
    logs['ip_out'] = ip_out
    
    l_block = ip_out[:32]
    r_block = ip_out[32:]
    
    rounds_log = []
    
    # 3. Eksekusi Jaringan Feistel Sebanyak 16 Putaran
    for r in range(16):
        prev_l = l_block
        prev_r = r_block
        
        # Panggil fungsi Feistel F
        f_out, f_internal = feistel_round(prev_r, subkeys[r])
        
        # Aturan DES: L_i = R_{i-1}, R_i = L_{i-1} XOR F(R_{i-1}, K_i)
        l_block = prev_r
        r_block = xor(prev_l, f_out)
        
        # Swap visual representation untuk keperluan logging logis di akhir putaran
        # Kecuali putaran ke-16 tidak dilakukan swap hasil akhir sebelum masuk IP Balikan
        swap_res = r_block + l_block if r == 15 else l_block + r_block
        
        rounds_log.append({
            'round_num': r + 1,
            'l_in': prev_l,
            'r_in': prev_r,
            'expanded': f_internal['expanded'],
            'xor_res': f_internal['xor_res'],
            'sbox_out': f_internal['sbox_out'],
            'p_out': f_internal['p_out'],
            'xor_l': r_block,
            'swap_res': swap_res,
            'sbox_visuals': f_internal['sbox_visuals'],
            'l_out': l_block,
            'r_out': r_block
        })
        
    logs['rounds'] = rounds_log
    
    # Pre-output gabungan R16 + L16 (Tanpa Swap di akhir Round 16)
    pre_output = r_block + l_block
    logs['pre_output'] = pre_output
    
    # 4. Permutasi Balikan / Inverse Initial Permutation (IP-1)
    final_bin = permute(pre_output, IP_INV)
    logs['final_bin'] = final_bin
    logs['final_hex'] = bin_to_hex(final_bin)
    
    return logs['final_hex'], logs