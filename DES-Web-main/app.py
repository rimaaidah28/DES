# app.py - Server Utama Flask

from flask import Flask, render_template, request, jsonify
import re
from des import process_des, hex_to_bin, bin_to_hex

app = Flask(__name__)

def validate_input(data_str, format_type):
    """Memvalidasi tipe data input agar tepat bernilai 64-bit."""
    if format_type == 'hex':
        # Bersihkan spasi jika ada
        data_str = data_str.replace(" ", "")
        if not re.match(r'^[0-9a-fA-F]{16}$', data_str):
            return False, "Input Hexadecimal harus tepat sepanjang 16 karakter (0-9, A-F)."
        return True, data_str.upper()
    elif format_type == 'bin':
        data_str = data_str.replace(" ", "")
        if not re.match(r'^[01]{64}$', data_str):
            return False, "Input Binary harus tepat sepanjang 64 karakter (0 atau 1)."
        return True, data_str
    return False, "Format tidak valid."

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/process', methods=['POST'])
def handle_cryptography():
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Data JSON tidak valid atau kosong.'}), 400
    input_data = payload.get('input_data', '').strip()
    key_data = payload.get('key_data', '').strip()
    data_format = payload.get('format', 'hex') # 'hex' atau 'bin'
    mode = payload.get('mode', 'encrypt') # 'encrypt' atau 'decrypt'
    
    # Validasi Input Data
    is_valid_in, res_in = validate_input(input_data, data_format)
    if not is_valid_in:
        return jsonify({'status': 'error', 'message': f'Data Input Salah: {res_in}'}), 400
        
    # Validasi Kunci Masukan
    is_valid_key, res_key = validate_input(key_data, data_format)
    if not is_valid_key:
        return jsonify({'status': 'error', 'message': f'Kunci Utama Salah: {res_key}'}), 400
        
    # Standardisasi parameter internal ke format HEX
    in_hex = res_in if data_format == 'hex' else bin_to_hex(res_in)
    key_hex = res_key if data_format == 'hex' else bin_to_hex(res_key)
    
    try:
        # Jalankan Operasi Simulasi Inti
        final_result_hex, detailed_logs = process_des(in_hex, key_hex, mode)
        final_result_bin = hex_to_bin(final_result_hex)
        
        # Tambahan Fitur Otomatisasi Round Trip Verification Test
        if mode == 'encrypt':
            reverse_mode = 'decrypt'
            verification_hex, _ = process_des(final_result_hex, key_hex, reverse_mode)
            is_verified = (verification_hex == in_hex)
        else:
            reverse_mode = 'encrypt'
            verification_hex, _ = process_des(final_result_hex, key_hex, reverse_mode)
            is_verified = (verification_hex == in_hex)
            
        return jsonify({
            'status': 'success',
            'mode': mode,
            'output_hex': final_result_hex,
            'output_bin': final_result_bin,
            'logs': detailed_logs,
            'round_trip_verified': is_verified
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)