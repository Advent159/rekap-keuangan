document.addEventListener('DOMContentLoaded', function() {
    // State
    let rowCounter = 0;
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // DOM Elements
    const tableBody = document.getElementById('tableBody');
    const addRowBtn = document.getElementById('addRowBtn');
    const generateBtn = document.getElementById('generatePDFBtn');
    const totalAmount = document.getElementById('totalAmount');
    const errorMessages = document.getElementById('errorMessages');
    const successMessage = document.getElementById('successMessage');
    const yearInput = document.getElementById('yearInput');

    // Initialize with 1 empty row
    function initializeTable() {
        addRow('', '', '');
        setTimeout(updateTotal, 100);
    }

    // Add row function
    function addRow(name = '', month = '', amount = '') {
        rowCounter++;
        const tr = document.createElement('tr');
        tr.dataset.rowId = rowCounter;

        // No
        const tdNo = document.createElement('td');
        tdNo.textContent = rowCounter;
        tr.appendChild(tdNo);

        // Nama Anak
        const tdName = document.createElement('td');
        const inputName = document.createElement('input');
        inputName.type = 'text';
        inputName.className = 'input-name';
        inputName.placeholder = 'Nama Anak';
        inputName.value = name;
        inputName.required = true;
        inputName.autocomplete = 'off';
        tdName.appendChild(inputName);
        tr.appendChild(tdName);

        // Bulan
        const tdMonth = document.createElement('td');
        const selectMonth = document.createElement('select');
        selectMonth.className = 'input-month';
        
        const optionDefault = document.createElement('option');
        optionDefault.value = '';
        optionDefault.textContent = 'Pilih Bulan';
        optionDefault.selected = true;
        optionDefault.disabled = true;
        selectMonth.appendChild(optionDefault);
        
        months.forEach(monthName => {
            const option = document.createElement('option');
            option.value = monthName;
            option.textContent = monthName;
            if (monthName === month) {
                option.selected = true;
            }
            selectMonth.appendChild(option);
        });
        
        tdMonth.appendChild(selectMonth);
        tr.appendChild(tdMonth);

        // Jumlah
        const tdAmount = document.createElement('td');
        const inputAmount = document.createElement('input');
        inputAmount.type = 'text';
        inputAmount.className = 'input-number';
        inputAmount.placeholder = '0';
        inputAmount.inputMode = 'numeric';
        if (amount) {
            inputAmount.value = formatRupiah(amount);
        }
        inputAmount.addEventListener('input', function(e) {
            const raw = this.value.replace(/[^0-9]/g, '');
            if (raw) {
                this.value = formatRupiah(raw);
            } else {
                this.value = '';
            }
            updateTotal();
        });
        tdAmount.appendChild(inputAmount);
        tr.appendChild(tdAmount);

        // Aksi (Delete)
        const tdAction = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-delete';
        deleteBtn.textContent = '✕';
        deleteBtn.title = 'Hapus Baris';
        deleteBtn.setAttribute('aria-label', 'Hapus baris');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (tableBody.children.length > 1) {
                tr.remove();
                updateRowNumbers();
                updateTotal();
                if (tableBody.children.length > 0) {
                    const firstInput = tableBody.firstElementChild.querySelector('.input-name');
                    if (firstInput) firstInput.focus();
                }
            } else {
                showError('Minimal harus ada 1 baris data');
            }
        });
        tdAction.appendChild(deleteBtn);
        tr.appendChild(tdAction);

        tableBody.appendChild(tr);

        // Event listeners
        const validateAndUpdate = function() {
            validateRow(tr);
            updateTotal();
        };
        
        inputName.addEventListener('input', validateAndUpdate);
        inputName.addEventListener('blur', function() { validateRow(tr); });
        selectMonth.addEventListener('change', function() { validateRow(tr); });
        inputAmount.addEventListener('blur', function() { validateRow(tr); });

        inputAmount.addEventListener('focus', function() {
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });

        setTimeout(() => {
            validateRow(tr);
            updateTotal();
        }, 50);
    }

    // Format Rupiah
    function formatRupiah(amount) {
        if (!amount) return '';
        const num = parseInt(amount.toString().replace(/[^0-9]/g, ''));
        if (isNaN(num) || num === 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function parseRupiah(str) {
        if (!str) return 0;
        const num = parseInt(str.replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    // Validasi satu baris
    function validateRow(tr) {
        const inputName = tr.querySelector('.input-name');
        const selectMonth = tr.querySelector('.input-month');
        const inputAmount = tr.querySelector('.input-number');
        let isValid = true;

        const name = inputName.value.trim();
        if (!name) {
            inputName.classList.add('error');
            isValid = false;
        } else {
            inputName.classList.remove('error');
        }

        const amount = parseRupiah(inputAmount.value);
        const month = selectMonth.value;
        if (amount > 0 && !month) {
            selectMonth.classList.add('error');
            isValid = false;
        } else {
            selectMonth.classList.remove('error');
        }

        if (amount < 0) {
            inputAmount.classList.add('error');
            isValid = false;
        } else {
            inputAmount.classList.remove('error');
        }

        tr.dataset.valid = isValid ? 'true' : 'false';
        return isValid;
    }

    function updateRowNumbers() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
            row.dataset.rowId = index + 1;
        });
        rowCounter = rows.length;
    }

    function updateTotal() {
        let total = 0;
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const inputAmount = row.querySelector('.input-number');
            if (inputAmount) {
                const amount = parseRupiah(inputAmount.value);
                if (!isNaN(amount) && amount > 0) {
                    total += amount;
                }
            }
        });
        totalAmount.textContent = 'Rp' + (formatRupiah(total.toString()) || '0');
    }

    function showError(message) {
        if (typeof message === 'string') {
            errorMessages.innerHTML = `<ul><li>${message}</li></ul>`;
        } else if (Array.isArray(message)) {
            errorMessages.innerHTML = '<ul>' + message.map(msg => `<li>${msg}</li>`).join('') + '</ul>';
        }
        errorMessages.style.display = 'block';
        successMessage.style.display = 'none';
        clearTimeout(window.errorTimeout);
        window.errorTimeout = setTimeout(() => {
            errorMessages.style.display = 'none';
        }, 8000);
    }

    function showSuccess(message) {
        successMessage.textContent = message || 'PDF berhasil dibuat!';
        successMessage.style.display = 'block';
        errorMessages.style.display = 'none';
        clearTimeout(window.successTimeout);
        window.successTimeout = setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    function collectData() {
        const rows = tableBody.querySelectorAll('tr');
        const data = [];
        let hasError = false;

        const year = yearInput.value.trim();
        if (!year) {
            showError('Tahun wajib diisi');
            return null;
        }
        if (isNaN(year) || year < 2000 || year > 2100) {
            showError('Tahun harus antara 2000 - 2100');
            return null;
        }

        rows.forEach((row) => {
            const inputName = row.querySelector('.input-name');
            const selectMonth = row.querySelector('.input-month');
            const inputAmount = row.querySelector('.input-number');

            const isValid = validateRow(row);
            if (!isValid) {
                hasError = true;
                return;
            }

            const name = inputName.value.trim();
            const month = selectMonth.value;
            const amount = inputAmount.value.trim();

            if (name) {
                data.push({
                    name: name,
                    month: month,
                    amount: amount,
                    year: year
                });
            }
        });

        if (hasError) {
            showError('Ada data yang tidak valid. Mohon periksa kembali.');
            return null;
        }

        if (data.length === 0) {
            showError('Minimal 1 data anak harus diisi dengan lengkap.');
            return null;
        }

        return data;
    }

    // ========================================
    // GENERATE PDF - MENGGUNAKAN jsPDF + AutoTable
    // ========================================
    async function generatePDF() {
        // Validasi semua row
        const rows = tableBody.querySelectorAll('tr');
        let allValid = true;
        rows.forEach(row => {
            if (!validateRow(row)) {
                allValid = false;
            }
        });

        if (!allValid) {
            showError('Ada data yang tidak valid. Mohon periksa kembali.');
            return;
        }

        const data = collectData();
        if (!data) return;

        // Disable button
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Memproses...';

        try {
            const year = yearInput.value.trim();
            
            // Hitung total
            let total = 0;
            data.forEach(child => {
                total += parseRupiah(child.amount);
            });

            // Buat PDF dengan jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // === HEADER ===
            // Judul
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(26, 26, 46);
            doc.text('REKAPITULASI KEUANGAN ANAK', pageWidth / 2, 28, { align: 'center' });
            
            // Subtitle (Tahun)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(13);
            doc.setTextColor(107, 114, 128);
            doc.text(`Periode Tahun ${year}`, pageWidth / 2, 40, { align: 'center' });
            
            // Garis bawah header
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(20, 48, pageWidth - 20, 48);

            // === TABLE ===
            // Siapkan data untuk tabel
            const tableData = data.map((child, idx) => {
                const amountNum = parseRupiah(child.amount);
                const amountFormatted = formatRupiah(amountNum.toString());
                return [
                    idx + 1,
                    child.name,
                    child.month || '-',
                    `Rp ${amountFormatted}`
                ];
            });

            // Tambahkan total ke footer
            const totalFormatted = formatRupiah(total.toString());

            doc.autoTable({
                startY: 56,
                head: [[
                    { content: 'No', styles: { halign: 'center', cellWidth: 15 } },
                    { content: 'Nama Anak', styles: { halign: 'left', cellWidth: 70 } },
                    { content: 'Bulan', styles: { halign: 'center', cellWidth: 40 } },
                    { content: 'Jumlah', styles: { halign: 'right', cellWidth: 45 } }
                ]],
                body: tableData,
                foot: [[
                    { 
                        content: 'TOTAL KESELURUHAN', 
                        colSpan: 3, 
                        styles: { 
                            halign: 'right', 
                            fontStyle: 'bold',
                            fontSize: 12,
                            fillColor: [243, 244, 246]
                        } 
                    },
                    { 
                        content: `Rp ${totalFormatted}`, 
                        styles: { 
                            halign: 'right', 
                            fontStyle: 'bold',
                            fontSize: 13,
                            textColor: [79, 110, 247],
                            fillColor: [243, 244, 246]
                        } 
                    }
                ]],
                theme: 'striped',
                headStyles: {
                    fillColor: [79, 110, 247],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 11,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 10,
                    textColor: [26, 26, 46]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    1: { halign: 'left', cellWidth: 70 },
                    2: { halign: 'center', cellWidth: 40 },
                    3: { halign: 'right', cellWidth: 45 }
                },
                footStyles: {
                    fillColor: [243, 244, 246],
                    textColor: [26, 26, 46]
                },
                margin: { left: 20, right: 20 },
                tableWidth: pageWidth - 40,
                styles: {
                    cellPadding: 5,
                    lineColor: [209, 213, 219],
                    lineWidth: 0.3
                },
                didDrawPage: function(data) {
                    // Footer di setiap halaman
                    const footerY = pageHeight - 15;
                    doc.setFontSize(8);
                    doc.setTextColor(156, 163, 175);
                    doc.text(
                        `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
                        pageWidth / 2,
                        footerY,
                        { align: 'center' }
                    );
                }
            });

            // === FOOTER (jika tabel tidak cukup panjang) ===
            const finalY = doc.lastAutoTable.finalY || 200;
            if (finalY < pageHeight - 30) {
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text(
                    `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
                    pageWidth / 2,
                    pageHeight - 15,
                    { align: 'center' }
                );
            }

            // Save PDF
            doc.save(`Rekapitulasi_Keuangan_Anak_${year}.pdf`);
            showSuccess('PDF berhasil diunduh!');

        } catch (error) {
            console.error('Error:', error);
            showError('Gagal generate PDF: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.classList.remove('loading');
            generateBtn.textContent = 'Generate PDF';
        }
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    // Tambah baris
    addRowBtn.addEventListener('click', function() {
        addRow();
        setTimeout(() => {
            const lastRow = tableBody.lastElementChild;
            if (lastRow) {
                lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const inputName = lastRow.querySelector('.input-name');
                if (inputName) {
                    setTimeout(() => inputName.focus(), 300);
                }
            }
        }, 150);
    });

    // Generate PDF
    generateBtn.addEventListener('click', generatePDF);

    // Shortcut Ctrl+Enter
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generatePDF();
        }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const tableWrapper = document.querySelector('.table-wrapper');
            if (tableWrapper) {
                tableWrapper.style.display = 'none';
                setTimeout(() => {
                    tableWrapper.style.display = '';
                }, 10);
            }
        }, 250);
    });

    // Initialize
    initializeTable();
    
    console.log('✅ Rekapitulasi Keuangan Anak siap digunakan!');
    console.log('💡 Tip: Ctrl+Enter untuk generate PDF');
});