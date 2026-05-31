(() => {
  const STICKER_COUNT = 215;
  const CANVAS_SIZE = 512;

  // Sticker sets from the 7 sprite sheets
  const STICKER_SETS = [
    { set: 1, start: 1, end: 34 },
    { set: 2, start: 35, end: 67 },
    { set: 3, start: 68, end: 101 },
    { set: 4, start: 102, end: 132 },
    { set: 5, start: 133, end: 160 },
    { set: 6, start: 161, end: 187 },
    { set: 7, start: 188, end: 215 },
  ];

  let canvas;
  let bgImage = null;
  let activeTab = 'all';

  // DOM elements
  const fileInput = document.getElementById('fileInput');
  const btnUpload = document.getElementById('btnUpload');
  const btnDelete = document.getElementById('btnDelete');
  const btnClear = document.getElementById('btnClear');
  const btnDownload = document.getElementById('btnDownload');
  const stickerGrid = document.getElementById('stickerGrid');
  const stickerCount = document.getElementById('stickerCount');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const stickerSearch = document.getElementById('stickerSearch');

  // Initialize Fabric canvas
  function initCanvas() {
    canvas = new fabric.Canvas('mainCanvas', {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: '#1a1d27',
      preserveObjectStacking: true,
      selection: true,
    });

    // Custom control styling
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#2563eb',
      cornerStrokeColor: '#fff',
      borderColor: '#2563eb',
      cornerSize: 10,
      cornerStyle: 'circle',
      padding: 6,
    });

    canvas.on('selection:created', onSelectionChange);
    canvas.on('selection:updated', onSelectionChange);
    canvas.on('selection:cleared', onSelectionChange);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName === 'INPUT') return;
        deleteSelected();
      }
    });
  }

  function onSelectionChange() {
    const active = canvas.getActiveObject();
    const hasSticker = active && active !== bgImage;
    btnDelete.disabled = !hasSticker;
  }

  // Load user image
  function loadUserImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target.result, (img) => {
        // Remove old bg
        if (bgImage) {
          canvas.remove(bgImage);
        }

        // Scale image to fit canvas
        const scale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: CANVAS_SIZE / 2,
          top: CANVAS_SIZE / 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          hoverCursor: 'default',
        });

        bgImage = img;
        canvas.insertAt(img, 0);
        canvas.backgroundColor = 'transparent';
        canvas.renderAll();

        uploadPlaceholder.classList.add('hidden');
        btnDownload.disabled = false;
      }, { crossOrigin: 'anonymous' });
    };
    reader.readAsDataURL(file);
  }

  // Upload button click
  btnUpload.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      loadUserImage(e.target.files[0]);
      fileInput.value = '';
    }
  });

  // Drag & drop image upload on canvas
  canvasWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  canvasWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if it's a sticker drag
    const stickerSrc = e.dataTransfer.getData('text/sticker');
    if (stickerSrc) {
      addStickerToCanvas(stickerSrc, e);
      return;
    }

    // Otherwise, it's an image file
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadUserImage(file);
    }
  });

  // Delete selected sticker
  function deleteSelected() {
    const active = canvas.getActiveObject();
    if (active && active !== bgImage) {
      if (active.type === 'activeSelection') {
        active.forEachObject((obj) => {
          if (obj !== bgImage) canvas.remove(obj);
        });
        canvas.discardActiveObject();
      } else {
        canvas.remove(active);
      }
      canvas.renderAll();
    }
  }

  btnDelete.addEventListener('click', deleteSelected);

  // Clear all stickers (keep bg)
  btnClear.addEventListener('click', () => {
    const objects = canvas.getObjects().slice();
    objects.forEach((obj) => {
      if (obj !== bgImage) {
        canvas.remove(obj);
      }
    });
    canvas.discardActiveObject();
    canvas.renderAll();
  });

  // Download
  btnDownload.addEventListener('click', () => {
    canvas.discardActiveObject();
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = 'nabu-pfp.png';
    link.href = dataURL;
    link.click();
  });

  // Add sticker to canvas
  function addStickerToCanvas(src, dropEvent) {
    fabric.Image.fromURL(src, (img) => {
      const maxSize = 120;
      const scale = maxSize / Math.max(img.width, img.height);

      let left = CANVAS_SIZE / 2;
      let top = CANVAS_SIZE / 2;

      if (dropEvent) {
        const canvasEl = canvas.getElement();
        const rect = canvasEl.getBoundingClientRect();
        left = (dropEvent.clientX - rect.left) * (CANVAS_SIZE / rect.width);
        top = (dropEvent.clientY - rect.top) * (CANVAS_SIZE / rect.height);
      }

      img.set({
        left: left,
        top: top,
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  }

  // Get which set a sticker index belongs to
  function getStickerSet(index) {
    for (const s of STICKER_SETS) {
      if (index >= s.start && index <= s.end) return s.set;
    }
    return 1;
  }

  // Load stickers into panel
  function loadStickers() {
    stickerCount.textContent = `${STICKER_COUNT} stiker`;

    for (let i = 1; i <= STICKER_COUNT; i++) {
      const num = String(i).padStart(3, '0');
      const src = `stickers/sticker_${num}.png`;

      const item = document.createElement('div');
      item.className = 'sticker-item';
      item.setAttribute('draggable', 'true');
      item.dataset.index = i;
      item.dataset.set = getStickerSet(i);

      const img = document.createElement('img');
      img.src = src;
      img.alt = `Sticker ${i}`;
      img.loading = 'lazy';

      item.appendChild(img);

      // Click to add
      item.addEventListener('click', () => {
        addStickerToCanvas(src);
      });

      // Drag start
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/sticker', src);
        e.dataTransfer.effectAllowed = 'copy';
      });

      stickerGrid.appendChild(item);
    }
  }

  // Filter stickers by active tab and search query
  function filterStickers() {
    const query = stickerSearch.value.trim().toLowerCase();
    const items = stickerGrid.querySelectorAll('.sticker-item');
    let visibleCount = 0;
    items.forEach((item) => {
      const index = item.dataset.index;
      const set = item.dataset.set;
      const matchesTab = activeTab === 'all' || set === activeTab;
      const matchesSearch = !query || index.includes(query);
      if (matchesTab && matchesSearch) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });
    stickerCount.textContent = activeTab === 'all' ? `${STICKER_COUNT} stiker` : `${visibleCount} stiker`;
  }

  // Tab click handler
  const stickerTabs = document.getElementById('stickerTabs');
  stickerTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    stickerTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    filterStickers();
  });

  // Search/filter stickers
  stickerSearch.addEventListener('input', () => filterStickers());

  // File drag-drop overlay for the whole page
  let dragCounter = 0;
  const overlay = document.createElement('div');
  overlay.className = 'drag-overlay';
  overlay.innerHTML = '<p>Drop gambar di sini!</p>';
  overlay.style.display = 'none';
  document.body.appendChild(overlay);

  document.addEventListener('dragenter', (e) => {
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter++;
      overlay.style.display = 'flex';
    }
  });

  document.addEventListener('dragleave', (e) => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      overlay.style.display = 'none';
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    overlay.style.display = 'none';

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadUserImage(file);
    }
  });

  document.addEventListener('dragover', (e) => e.preventDefault());

  // Init
  initCanvas();
  loadStickers();
})();
