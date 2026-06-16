// script.js — Logika Antarmuka Simulasi DES

document.addEventListener('DOMContentLoaded', () => {
    const formatHex = document.getElementById('formatHex');
    const formatBin = document.getElementById('formatBin');
    const inputLabel = document.getElementById('inputLabel');
    const inputHelp = document.getElementById('inputHelp');
    const keyHelp = document.getElementById('keyHelp');
    const inputData = document.getElementById('inputData');
    const keyData = document.getElementById('keyData');
    const inputCounter = document.getElementById('inputCounter');
    const keyCounter = document.getElementById('keyCounter');
    const desForm = document.getElementById('desForm');
    const modeEnc = document.getElementById('modeEnc');
    const loading = document.getElementById('loading');
    const resultContainer = document.getElementById('resultContainer');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnExample = document.getElementById('btnExample');

    const HEX_PATTERN = /^[0-9a-fA-F]{16}$/;
    const BIN_PATTERN = /^[01]{64}$/;

    function isHex() { return formatHex.checked; }

    function getMaxLen() { return isHex() ? 16 : 64; }

    function handleFormatChange() {
        const encrypt = modeEnc.checked;
        if (isHex()) {
            inputLabel.textContent = encrypt ? 'Plaintext (Hex)' : 'Ciphertext (Hex)';
            inputHelp.textContent = '16 karakter hex (0-9, A-F)';
            keyHelp.textContent = '16 karakter hex (0-9, A-F)';
            inputCounter.textContent = `${inputData.value.replace(/\s/g, '').length} / 16`;
            keyCounter.textContent = `${keyData.value.replace(/\s/g, '').length} / 16`;
        } else {
            inputLabel.textContent = encrypt ? 'Plaintext (Binary)' : 'Ciphertext (Binary)';
            inputHelp.textContent = '64 karakter bit (0 atau 1)';
            keyHelp.textContent = '64 karakter bit (0 atau 1)';
            inputCounter.textContent = `${inputData.value.replace(/\s/g, '').length} / 64`;
            keyCounter.textContent = `${keyData.value.replace(/\s/g, '').length} / 64`;
        }
        updateCounter(inputData, inputCounter);
        updateCounter(keyData, keyCounter);
    }

    function updateCounter(field, counterEl) {
        const val = field.value.replace(/\s/g, '');
        const max = getMaxLen();
        counterEl.textContent = `${val.length} / ${max}`;
        counterEl.classList.toggle('valid', val.length === max);
        counterEl.classList.toggle('invalid', val.length > 0 && val.length !== max);
    }

    function validateField(value, fieldEl, errorEl) {
        const cleaned = value.replace(/\s/g, '');
        const max = getMaxLen();
        const pattern = isHex() ? HEX_PATTERN : BIN_PATTERN;
        const formatName = isHex() ? 'hexadecimal' : 'binary';

        if (!cleaned) {
            fieldEl.classList.add('is-invalid');
            errorEl.textContent = 'Field ini wajib diisi.';
            return false;
        }
        if (!pattern.test(cleaned)) {
            fieldEl.classList.add('is-invalid');
            errorEl.textContent = isHex()
                ? 'Harus tepat 16 karakter hex (0-9, A-F).'
                : 'Harus tepat 64 karakter bit (0 atau 1).';
            return false;
        }
        fieldEl.classList.remove('is-invalid');
        errorEl.textContent = '';
        return true;
    }

    function showToast(message, type = 'error') {
        const container = document.getElementById('toastContainer');
        const id = `toast-${Date.now()}`;
        const html = `
            <div id="${id}" class="toast toast-custom toast-${type}" role="alert">
                <div class="toast-body d-flex align-items-center gap-2">
                    <span>${type === 'error' ? '⚠️' : '✅'}</span>
                    <span>${message}</span>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
        const el = document.getElementById(id);
        const toast = new bootstrap.Toast(el, { delay: 4000 });
        toast.show();
        el.addEventListener('hidden.bs.toast', () => el.remove());
    }

    formatHex.addEventListener('change', handleFormatChange);
    formatBin.addEventListener('change', handleFormatChange);
    document.getElementById('modeEnc').addEventListener('change', handleFormatChange);
    document.getElementById('modeDec').addEventListener('change', handleFormatChange);

    inputData.addEventListener('input', () => updateCounter(inputData, inputCounter));
    keyData.addEventListener('input', () => updateCounter(keyData, keyCounter));

    desForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputError = document.getElementById('inputError');
        const keyError = document.getElementById('keyError');
        const validInput = validateField(inputData.value, inputData, inputError);
        const validKey = validateField(keyData.value, keyData, keyError);
        if (!validInput || !validKey) return;

        const formatValue = document.querySelector('input[name="formatRadio"]:checked')?.value || 'hex';
        const modeValue = document.querySelector('input[name="modeRadio"]:checked')?.value || 'encrypt';

        btnSubmit.querySelector('.btn-text').classList.add('d-none');
        btnSubmit.querySelector('.btn-spinner').classList.remove('d-none');
        btnSubmit.disabled = true;
        loading.classList.remove('d-none');
        resultContainer.classList.add('d-none');

        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input_data: inputData.value,
                    key_data: keyData.value,
                    format: formatValue,
                    mode: modeValue
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || 'Terjadi kesalahan pada server.');
                return;
            }

            renderDashboard(data);
            showToast('Perhitungan DES berhasil!', 'success');
            document.getElementById('section-output').scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            showToast(`Gagal terhubung ke server: ${error.message}`);
        } finally {
            loading.classList.add('d-none');
            btnSubmit.querySelector('.btn-text').classList.remove('d-none');
            btnSubmit.querySelector('.btn-spinner').classList.add('d-none');
            btnSubmit.disabled = false;
        }
    });

    function formatBits(bits, groupSize = 8) {
        const groups = [];
        for (let i = 0; i < bits.length; i += groupSize) {
            groups.push(bits.slice(i, i + groupSize));
        }
        return groups.join(' ');
    }

    function fillExampleInput() {
        if (isHex()) {
            inputData.value = 'A1B2C3D4E5F60718';
            keyData.value = '0F1E2D3C4B5A6978';
        } else {
            inputData.value = '1010000110110010110000111101010011100101111101100000011100011000';
            keyData.value = '0000111100011110001011010011110001001011010110100110100101111000';
        }

        inputData.classList.remove('is-invalid');
        keyData.classList.remove('is-invalid');
        document.getElementById('inputError').textContent = '';
        document.getElementById('keyError').textContent = '';
        updateCounter(inputData, inputCounter);
        updateCounter(keyData, keyCounter);
        resultContainer.classList.add('d-none');
        document.querySelectorAll('#resultContainer .content-section').forEach(section => {
            section.classList.remove('revealed');
        });
        showToast('Contoh otomatis berhasil diisi.', 'success');
    }

    function renderDashboard(data) {
        resultContainer.classList.remove('d-none');
        document.querySelectorAll('#resultContainer .content-section').forEach((section, idx) => {
            setTimeout(() => section.classList.add('revealed'), idx * 60);
        });

        document.getElementById('outHex').textContent = data.output_hex;
        document.getElementById('outBin').textContent = formatBits(data.output_bin, 8);

        const logs = data.logs;
        const ks = logs.key_schedule;

        document.getElementById('pc1_container').innerHTML = `
            <strong>Kunci Input (64-bit):</strong> ${formatBits(ks.input_key_bin)}<br>
            <strong>Hasil PC-1 (56-bit):</strong> ${formatBits(ks.pc1_out)}<br>
            <strong>C₀:</strong> ${formatBits(ks.c0)} &nbsp;|&nbsp; <strong>D₀:</strong> ${formatBits(ks.d0)}
        `;

        let keyHtml = `
            <tr class="table-section-row">
                <td colspan="4"><strong>Input Kunci & PC-1</strong></td>
            </tr>
            <tr>
                <td>Awal</td>
                <td colspan="2" class="text-wrap">${formatBits(ks.c0)} + ${formatBits(ks.d0)}</td>
                <td>56-bit setelah PC-1</td>
            </tr>`;

        ks.rounds.forEach(r => {
            keyHtml += `
                <tr>
                    <td>Round ${r.round} <span class="badge bg-secondary">${r.shifts} shift</span></td>
                    <td class="text-success">${formatBits(r.c)}</td>
                    <td class="text-success">${formatBits(r.d)}</td>
                    <td class="text-info fw-bold">${formatBits(r.subkey, 6)}</td>
                </tr>`;
        });
        document.getElementById('keyTableBody').innerHTML = keyHtml;

        document.getElementById('pre_ip_log').innerHTML = `
            <strong>[Permutasi Awal IP]</strong><br>
            Input: ${formatBits(logs.input_bin)}<br>
            Hasil IP: ${formatBits(logs.ip_out)}<br>
            <strong>L₀:</strong> <span style="color:var(--warning)">${formatBits(logs.rounds[0].l_in)}</span>
            &nbsp;|&nbsp; <strong>R₀:</strong> <span style="color:var(--accent)">${formatBits(logs.rounds[0].r_in)}</span>
        `;

        let accordionHtml = '';
        logs.rounds.forEach((r) => {
            accordionHtml += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="headingR${r.round_num}">
                        <button class="accordion-button collapsed" type="button"
                            data-bs-toggle="collapse" data-bs-target="#collapseR${r.round_num}">
                            Round ${r.round_num} — L=${r.l_out.slice(0, 8)}… R=${r.r_out.slice(0, 8)}…
                        </button>
                    </h2>
                    <div id="collapseR${r.round_num}" class="accordion-collapse collapse" data-bs-parent="#accordionRounds">
                        <div class="accordion-body">
                            <div class="round-detail-grid">
                                <div>
                                    <p><strong>L<sub>i-1</sub>:</strong> ${formatBits(r.l_in)}</p>
                                    <p><strong>R<sub>i-1</sub>:</strong> ${formatBits(r.r_in)}</p>
                                    <p><strong>Ekspansi E (48-bit):</strong> ${formatBits(r.expanded, 6)}</p>
                                    <p style="color:var(--danger)"><strong>XOR Subkey:</strong> ${formatBits(r.xor_res, 6)}</p>
                                </div>
                                <div>
                                    <p><strong>Output S-Box (32-bit):</strong> ${formatBits(r.sbox_out)}</p>
                                    <p><strong>Permutasi P:</strong> ${formatBits(r.p_out)}</p>
                                    <p style="color:var(--success)"><strong>R<sub>i</sub> (L<sub>i-1</sub> ⊕ f):</strong> ${formatBits(r.xor_l)}</p>
                                    <p style="color:var(--accent)"><strong>Swap (L<sub>i</sub>||R<sub>i</sub>):</strong> ${formatBits(r.swap_res)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
        document.getElementById('accordionRounds').innerHTML = accordionHtml;

        document.getElementById('post_ip_log').innerHTML = `
            <strong>[Permutasi Balik IP⁻¹]</strong><br>
            Blok pra-output (R₁₆ || L₁₆): ${formatBits(logs.pre_output)}<br>
            <strong>Output akhir:</strong> <span style="color:var(--success)">${formatBits(logs.final_bin)}</span>
            &nbsp;→&nbsp; <span style="color:var(--warning)">${logs.final_hex}</span>
        `;

        const lastRoundVisuals = logs.rounds[logs.rounds.length - 1].sbox_visuals;
        let sboxHtml = '';
        lastRoundVisuals.forEach(s => {
            sboxHtml += `
                <div class="col">
                    <div class="card sbox-card h-100">
                        <div class="card-header">S-Box ${s.sbox_num}</div>
                        <div class="card-body">
                            <div><strong>Input 6-bit:</strong> <span style="color:var(--warning)">${s.input}</span></div>
                            <div><strong>Baris (bit 1,6):</strong> ${s.row_bin} → ${s.row_dec}</div>
                            <div><strong>Kolom (bit 2-5):</strong> ${s.col_bin} → ${s.col_dec}</div>
                            <div><strong>Nilai:</strong> ${s.val_dec}</div>
                            <div class="sbox-output"><strong>Output 4-bit:</strong> ${s.output}</div>
                        </div>
                    </div>
                </div>`;
        });
        document.getElementById('sboxGrid').innerHTML = sboxHtml;

        const verificationStatusDiv = document.getElementById('verificationStatus');
        if (data.round_trip_verified) {
            verificationStatusDiv.innerHTML = `
                <div class="verification-success">✅ Verifikasi Berhasil</div>
                <p class="mt-3 text-secondary" style="font-size:0.85rem">
                    Operasi balik menghasilkan data identik dengan input asli. Algoritma DES berjalan dengan benar.
                </p>`;
        } else {
            verificationStatusDiv.innerHTML = `
                <div class="verification-fail">❌ Verifikasi Gagal</div>
                <p class="mt-3 text-secondary" style="font-size:0.85rem">
                    Hasil operasi balik tidak cocok dengan input asli. Periksa kembali data atau kunci.
                </p>`;
        }
    }

    document.getElementById('btnClear').addEventListener('click', () => {
        inputData.value = '';
        keyData.value = '';
        inputData.classList.remove('is-invalid');
        keyData.classList.remove('is-invalid');
        document.getElementById('inputError').textContent = '';
        document.getElementById('keyError').textContent = '';
        updateCounter(inputData, inputCounter);
        updateCounter(keyData, keyCounter);
        resultContainer.classList.add('d-none');
        document.querySelectorAll('#resultContainer .content-section').forEach(section => {
            section.classList.remove('revealed');
        });
    });

    document.getElementById('btnReset').addEventListener('click', () => {
        formatHex.checked = true;
        modeEnc.checked = true;
        handleFormatChange();
        inputData.value = 'A1B2C3D4E5F60718';
        keyData.value = '0F1E2D3C4B5A6978';
        inputData.classList.remove('is-invalid');
        keyData.classList.remove('is-invalid');
        updateCounter(inputData, inputCounter);
        updateCounter(keyData, keyCounter);
        resultContainer.classList.add('d-none');
        document.querySelectorAll('#resultContainer .content-section').forEach(section => {
            section.classList.remove('revealed');
        });
    });

    btnExample?.addEventListener('click', fillExampleInput);

    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.copy);
            navigator.clipboard.writeText(target.textContent.replace(/\s/g, ''))
                .then(() => showToast('Berhasil disalin ke clipboard!', 'success'))
                .catch(() => showToast('Gagal menyalin.'));
        });
    });

    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarBackdrop.classList.toggle('show');
    });

    sidebarBackdrop?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('show');
    });

    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarBackdrop.classList.remove('show');
        });
    });

    const sections = document.querySelectorAll('[id^="section-"]');
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.dataset.section === entry.target.id);
                });
            }
        });
    }, { rootMargin: '-20% 0px -60% 0px' });

    sections.forEach(sec => observer.observe(sec));
    sections[0]?.classList.add('revealed');

    handleFormatChange();
});
