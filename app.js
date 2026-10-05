        // Lucideアイコンの初期化
        lucide.createIcons();

        let splitBlobs = [];

        function getFormattedDate() {
            const now = new Date();
            const pad = (num) => String(num).padStart(2, '0');
            return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        }

        document.addEventListener('DOMContentLoaded', () => {
            const dropZone = document.getElementById('dropZone');
            const splitInput = document.getElementById('splitInput');
            const rows = document.getElementById('rows');
            const cols = document.getElementById('cols');

            updateSplitButton();
            splitInput.addEventListener('change', updateSplitButton);
            rows.addEventListener('input', updateSplitButton);
            cols.addEventListener('input', updateSplitButton);

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragging');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragging');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragging');
                if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                    splitInput.files = e.dataTransfer.files;
                    handleFileChange({ target: splitInput });
                }
            });
        });

        function updateSplitButton() {
            const hasFile = document.getElementById('splitInput').files.length > 0;
            const rows = Number(document.getElementById('rows').value);
            const cols = Number(document.getElementById('cols').value);
            const validCount = Number.isInteger(rows) && Number.isInteger(cols) &&
                rows >= 1 && rows <= 50 && cols >= 1 && cols <= 50;
            document.getElementById('splitBtn').disabled = !(hasFile && validCount);
        }

        function handleFileChange(event) {
            const file = event.target.files[0];
            const display = document.getElementById('fileNameDisplay');
            const previewContainer = document.getElementById('previewContainer');
            const previewImg = document.getElementById('selectedImagePreview');
            if (file) {
                display.textContent = file.name;
                previewImg.src = URL.createObjectURL(file);
                previewContainer.style.display = 'flex';
            } else {
                display.textContent = '未選択';
                previewImg.src = '';
                previewContainer.style.display = 'none';
            }
            updateSplitButton();
        }

        function handleSplit() {
            const file = document.getElementById('splitInput').files[0];
            const r = parseInt(document.getElementById('rows').value);
            const c = parseInt(document.getElementById('cols').value);
            const resultArea = document.getElementById('resultArea');
            const results = document.getElementById('splitResults');

            resultArea.style.display = 'flex';

            if (!file || r < 1 || c < 1 || r > 50 || c > 50) {
                results.innerHTML = '<div class="error-message">画像ファイルを選択し、正しい分割数（1〜50）を入力してください。</div>';
                document.getElementById('splitZipBtn').style.display = 'none';
                return;
            }

            results.innerHTML = '';
            splitBlobs.forEach(b => URL.revokeObjectURL(b.url));
            splitBlobs = [];
            document.getElementById('splitZipBtn').style.display = 'none';

            const img = new Image();
            img.onload = () => {
                const w = img.width / c;
                const h = img.height / r;
                let count = 0;
                const dateStr = getFormattedDate();

                for (let y = 0; y < r; y++) {
                    for (let x = 0; x < c; x++) {
                        const cvs = document.createElement('canvas');
                        cvs.width = w;
                        cvs.height = h;
                        cvs.getContext('2d').drawImage(img, x * w, y * h, w, h, 0, 0, w, h);

                        cvs.toBlob(blob => {
                            count++;
                            const url = URL.createObjectURL(blob);
                            const name = `${dateStr}_${y + 1}-${x + 1}.png`;
                            splitBlobs.push({ blob: blob, name: name, url: url });

                            const item = document.createElement('div');
                            item.className = 'result-item';

                            const imgWrapper = document.createElement('div');
                            imgWrapper.className = 'img-wrapper';

                            const preview = document.createElement('img');
                            preview.src = url;
                            imgWrapper.appendChild(preview);
                            item.appendChild(imgWrapper);

                            const btn = document.createElement('button');
                            btn.className = 'btn-item-dl';
                            btn.innerHTML = '<i data-lucide="download"></i> 保存';
                            btn.addEventListener('click', () => {
                                saveAs(blob, name);
                            });
                            item.appendChild(btn);

                            results.appendChild(item);

                            // 動的に追加したアイコンをレンダリング
                            lucide.createIcons({ root: item });

                            if (count === r * c) {
                                document.getElementById('splitZipBtn').style.display = 'flex';
                            }
                        }, 'image/png');
                    }
                }
            };
            img.src = URL.createObjectURL(file);
        }

        function downloadZip() {
            if (splitBlobs.length === 0) return;
            const zip = new JSZip();
            const dateStr = getFormattedDate();
            splitBlobs.forEach(b => zip.file(b.name, b.blob));
            zip.generateAsync({ type: "blob" }).then(content => {
                saveAs(content, `split_images_${dateStr}.zip`);
            });
        }

        function handleReset() {
            document.getElementById('splitInput').value = '';
            document.getElementById('fileNameDisplay').textContent = '未選択';
            document.getElementById('previewContainer').style.display = 'none';
            document.getElementById('selectedImagePreview').src = '';
            document.getElementById('rows').value = 2;
            document.getElementById('cols').value = 4;
            updateSplitButton();
            document.getElementById('resultArea').style.display = 'none';
            document.getElementById('splitResults').innerHTML = '';
            document.getElementById('splitZipBtn').style.display = 'none';

            splitBlobs.forEach(b => URL.revokeObjectURL(b.url));
            splitBlobs = [];
        }

        function handleResetAndTop() {
            handleReset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    
