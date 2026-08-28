document.addEventListener('DOMContentLoaded', function() {
    // State
    let rowCounter = 0;
    let isKeyboardOpen = false;
    let scrollTimeout = null;
    
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
    const tableWrapper = document.getElementById('tableWrapper');

    // Cek perangkat mobile
    function isMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    }

    // Initialize with 1 empty row
    function initializeTable() {
        addRow('', '', '', '');
        setTimeout(updateTotal, 100);
    }

    // Add row function - DENGAN KOLOM KETERANGAN
    function addRow(name = '', month = '', amount = '', keterangan = '') {
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
        inputName.inputMode = 'text';
        inputName.setAttribute('autocorrect', 'off');
        inputName.setAttribute('autocapitalize', 'off');
        inputName.setAttribute('spellcheck', 'false');
        inputName.setAttribute('aria-label', 'Nama Anak');
        tdName.appendChild(inputName);
        tr.appendChild(tdName);

        // Bulan
        const tdMonth = document.createElement('td');
        const selectMonth = document.createElement('select');
        selectMonth.className = 'input-month';
        selectMonth.setAttribute('aria-label', 'Pilih Bulan');
        
        const optionDefault = document.createElement('option');
        optionDefault.value = '';
        optionDefault.textContent = 'Pilih';
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
        inputAmount.setAttribute('pattern', '[0-9]*');
        inputAmount.setAttribute('autocomplete', 'off');
        inputAmount.setAttribute('autocorrect', 'off');
        inputAmount.setAttribute('spellcheck', 'false');
        inputAmount.setAttribute('aria-label', 'Jumlah Uang');
        
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

        // KETERANGAN - Kolom baru
        const tdKeterangan = document.createElement('td');
        const inputKeterangan = document.createElement('input');
        inputKeterangan.type = 'text';
        inputKeterangan.className = 'input-keterangan';
        inputKeterangan.placeholder = 'Catatan';
        inputKeterangan.value = keterangan;
        inputKeterangan.autocomplete = 'off';
        inputKeterangan.setAttribute('autocorrect', 'off');
        inputKeterangan.setAttribute('autocapitalize', 'off');
        inputKeterangan.setAttribute('spellcheck', 'false');
        inputKeterangan.setAttribute('aria-label', 'Keterangan');
        tdKeterangan.appendChild(inputKeterangan);
        tr.appendChild(tdKeterangan);

        // Aksi (Delete)
        const tdAction = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-delete';
        deleteBtn.textContent = '✕';
        deleteBtn.title = 'Hapus';
        deleteBtn.setAttribute('aria-label', 'Hapus baris');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (tableBody.children.length > 1) {
                tr.remove();
                updateRowNumbers();
                updateTotal();
                if (tableBody.children.length > 0) {
                    const firstInput = tableBody.firstElementChild.querySelector('.input-name');
                    if (firstInput) {
                        setTimeout(() => firstInput.focus(), 300);
                    }
                }
            } else {
                showError('Minimal harus ada 1 baris data');
            }
        });
        tdAction.appendChild(deleteBtn);
        tr.appendChild(tdAction);

        tableBody.appendChild(tr);

        // Event listeners untuk validasi
        const validateAndUpdate = function() {
            validateRow(tr);
            updateTotal();
        };
        
        inputName.addEventListener('input', validateAndUpdate);
        inputName.addEventListener('blur', function() { 
            setTimeout(() => validateRow(tr), 100);
        });
        
        selectMonth.addEventListener('change', function() { 
            validateRow(tr); 
        });
        
        inputAmount.addEventListener('blur', function() { 
            setTimeout(() => validateRow(tr), 100);
        });

        inputKeterangan.addEventListener('input', function() {
            validateRow(tr);
        });

        // Handler untuk mobile: mencegah scroll berlebihan
        const handleMobileFocus = function(e) {
            if (isMobile()) {
                const rect = this.getBoundingClientRect();
                const isVisible = (
                    rect.top >= 0 &&
                    rect.bottom <= window.innerHeight
                );
                
                if (!isVisible) {
                    setTimeout(() => {
                        this.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }, 300);
                }
            }
        };

        inputName.addEventListener('focus', handleMobileFocus);
        inputAmount.addEventListener('focus', handleMobileFocus);
        inputKeterangan.addEventListener('focus', handleMobileFocus);
        selectMonth.addEventListener('focus', handleMobileFocus);

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
        
        if (isMobile()) {
            setTimeout(() => {
                errorMessages.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
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
            const inputKeterangan = row.querySelector('.input-keterangan');

            const isValid = validateRow(row);
            if (!isValid) {
                hasError = true;
                return;
            }

            const name = inputName.value.trim();
            const month = selectMonth.value;
            const amount = inputAmount.value.trim();
            const keterangan = inputKeterangan ? inputKeterangan.value.trim() : '';

            if (name) {
                data.push({
                    name: name,
                    month: month,
                    amount: amount,
                    year: year,
                    keterangan: keterangan
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
    // GENERATE PDF - DENGAN KOLOM KETERANGAN
    // ========================================
    async function generatePDF() {
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

        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Memproses...';

        try {
            const year = yearInput.value.trim();
            
            let total = 0;
            data.forEach(child => {
                total += parseRupiah(child.amount);
            });

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(26, 26, 46);
            doc.text('REKAPITULASI KEUANGAN ANAK', pageWidth / 2, 28, { align: 'center' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(13);
            doc.setTextColor(107, 114, 128);
            doc.text(`Periode Tahun ${year}`, pageWidth / 2, 40, { align: 'center' });
            
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(20, 48, pageWidth - 20, 48);

            // Table - DENGAN KOLOM KETERANGAN
            const tableData = data.map((child, idx) => {
                const amountNum = parseRupiah(child.amount);
                const amountFormatted = formatRupiah(amountNum.toString());
                return [
                    idx + 1,
                    child.name,
                    child.month || '-',
                    `Rp ${amountFormatted}`,
                    child.keterangan || '-'
                ];
            });

            const totalFormatted = formatRupiah(total.toString());

            // Hitung lebar kolom yang lebih baik
            const colWidths = [15, 60, 35, 40, 45];

            doc.autoTable({
                startY: 56,
                head: [[
                    { content: 'No', styles: { halign: 'center' } },
                    { content: 'Nama Anak', styles: { halign: 'left' } },
                    { content: 'Bulan', styles: { halign: 'center' } },
                    { content: 'Jumlah', styles: { halign: 'right' } },
                    { content: 'Keterangan', styles: { halign: 'left' } }
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
                        colSpan: 2,
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
                    fontSize: 10,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [26, 26, 46]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },
                    1: { halign: 'left', cellWidth: 58 },
                    2: { halign: 'center', cellWidth: 32 },
                    3: { halign: 'right', cellWidth: 38 },
                    4: { halign: 'left', cellWidth: 45 }
                },
                footStyles: {
                    fillColor: [243, 244, 246],
                    textColor: [26, 26, 46]
                },
                margin: { left: 18, right: 18 },
                tableWidth: pageWidth - 36,
                styles: {
                    cellPadding: 4,
                    lineColor: [209, 213, 219],
                    lineWidth: 0.2
                },
                didDrawPage: function(data) {
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
    
    addRowBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addRow();
        if (isMobile()) {
            setTimeout(() => {
                const lastRow = tableBody.lastElementChild;
                if (lastRow) {
                    const inputName = lastRow.querySelector('.input-name');
                    if (inputName) {
                        setTimeout(() => inputName.focus(), 400);
                    }
                }
            }, 300);
        }
    });

    generateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        generatePDF();
    });

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generatePDF();
        }
    });

    // Mencegah zoom berlebihan di mobile
    if (isMobile()) {
        document.addEventListener('focusin', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    e.target.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 350);
            }
        });
    }

    // Handle resize untuk mobile keyboard
    let lastHeight = window.innerHeight;
    window.addEventListener('resize', function() {
        const currentHeight = window.innerHeight;
        if (isMobile()) {
            if (currentHeight < lastHeight) {
                isKeyboardOpen = true;
            } else if (currentHeight > lastHeight) {
                isKeyboardOpen = false;
            }
            lastHeight = currentHeight;
        }
    });

    // Initialize
    initializeTable();
    
    console.log('✅ Rekapitulasi Keuangan Anak siap digunakan!');
    console.log('💡 Tip: Ctrl+Enter untuk generate PDF');
});