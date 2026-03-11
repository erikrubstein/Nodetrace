export function renderMobileCapturePage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>PhotoMap Capture</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #121212;
        --panel: #1d1d1d;
        --surface: #262626;
        --text: #f4f4f0;
        --muted: #9a9a9a;
        --accent: #f4f4f0;
      }

      @media (prefers-color-scheme: light) {
        :root {
          --bg: #efefea;
          --panel: #f7f7f2;
          --surface: #ffffff;
          --text: #161616;
          --muted: #6f6f6a;
          --accent: #161616;
        }
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--text);
        font-family: "JetBrains Mono", ui-monospace, monospace;
      }

      .shell {
        max-width: 640px;
        margin: 0 auto;
        padding: 20px 16px 32px;
      }

      .header {
        margin-bottom: 18px;
      }

      .title {
        font-size: 1rem;
        margin-bottom: 6px;
      }

      .subtitle,
      .status {
        color: var(--muted);
        font-size: 0.82rem;
      }

      .panel {
        background: var(--panel);
        border-radius: 10px;
        padding: 14px;
        display: grid;
        gap: 12px;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 0.78rem;
        color: var(--muted);
      }

      select,
      button,
      input[type="text"] {
        width: 100%;
        border: none;
        border-radius: 8px;
        font: inherit;
        padding: 12px 10px;
      }

      select,
      input[type="text"] {
        background: var(--surface);
        color: var(--text);
      }

      button {
        background: var(--text);
        color: var(--bg);
        font-weight: 600;
      }

      .capture-input {
        display: none;
      }

      .capture-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        border-radius: 8px;
        background: var(--text);
        color: var(--bg);
        padding: 14px 10px;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .status {
        min-height: 1.2em;
      }

      .status.error {
        color: #d46868;
      }

      .hint {
        color: var(--muted);
        font-size: 0.75rem;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="header">
        <div class="title">PhotoMap Capture</div>
        <div class="subtitle">Take a photo on your phone and send it straight into the selected project node.</div>
      </div>

      <section class="panel">
        <label>
          <span>Project</span>
          <select id="projectSelect"></select>
        </label>

        <label>
          <span>Target Node</span>
          <select id="nodeSelect"></select>
        </label>

        <label>
          <span>Optional Name</span>
          <input id="nameInput" type="text" placeholder="<untitled>" />
        </label>

        <label class="capture-button" for="captureInput">Take Photo</label>
        <input id="captureInput" class="capture-input" type="file" accept="image/*" capture="environment" />

        <button id="chooseButton" type="button">Choose Existing Photo</button>

        <div id="status" class="status"></div>
        <div class="hint">Open this page on your phone using your computer's network address, for example <code>http://YOUR-PC-IP:3001/capture</code>.</div>
      </section>
    </main>

    <script>
      const projectSelect = document.getElementById('projectSelect')
      const nodeSelect = document.getElementById('nodeSelect')
      const captureInput = document.getElementById('captureInput')
      const chooseButton = document.getElementById('chooseButton')
      const nameInput = document.getElementById('nameInput')
      const statusEl = document.getElementById('status')
      const search = new URLSearchParams(window.location.search)

      let projects = []

      function setStatus(message, isError = false) {
        statusEl.textContent = message
        statusEl.className = isError ? 'status error' : 'status'
      }

      async function api(url, options = {}) {
        const response = await fetch(url, options)
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || 'Request failed')
        }

        if (response.status === 204) {
          return null
        }

        return response.json()
      }

      async function createPreviewFile(file) {
        const imageUrl = URL.createObjectURL(file)

        try {
          const image = await new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = imageUrl
          })

          const maxDimension = 640
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0, canvas.width, canvas.height)

          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
          if (!blob) {
            return null
          }

          const baseName = file.name.replace(/\\.[^.]+$/, '') || 'preview'
          return new File([blob], \`\${baseName}-preview.jpg\`, { type: 'image/jpeg' })
        } finally {
          URL.revokeObjectURL(imageUrl)
        }
      }

      function flattenNodes(node, depth = 0, rows = []) {
        if (!node) {
          return rows
        }

        rows.push({
          id: node.id,
          label: \`\${'  '.repeat(depth)}\${node.name}\`,
        })

        for (const child of node.children || []) {
          flattenNodes(child, depth + 1, rows)
        }

        return rows
      }

      async function loadProjects() {
        projects = await api('/api/projects')
        projectSelect.innerHTML = ''

        for (const project of projects) {
          const option = document.createElement('option')
          option.value = project.id
          option.textContent = project.name
          projectSelect.append(option)
        }

        const requestedProjectId = search.get('projectId')
        if (requestedProjectId && projects.some((project) => String(project.id) === requestedProjectId)) {
          projectSelect.value = requestedProjectId
        }

        await loadNodes()
      }

      async function loadNodes() {
        if (!projectSelect.value) {
          nodeSelect.innerHTML = ''
          return
        }

        const tree = await api(\`/api/projects/\${projectSelect.value}/tree\`)
        const rows = flattenNodes(tree.root)
        nodeSelect.innerHTML = ''

        for (const row of rows) {
          const option = document.createElement('option')
          option.value = row.id
          option.textContent = row.label
          nodeSelect.append(option)
        }

        const requestedParentId = search.get('parentId')
        if (requestedParentId && rows.some((row) => String(row.id) === requestedParentId)) {
          nodeSelect.value = requestedParentId
        } else if (tree.root) {
          nodeSelect.value = String(tree.root.id)
        }
      }

      async function uploadSelectedFiles(files) {
        if (!files.length || !projectSelect.value || !nodeSelect.value) {
          return
        }

        setStatus('Uploading...')

        try {
          for (const file of files) {
            const previewFile = await createPreviewFile(file)
            const formData = new FormData()
            formData.append('parentId', nodeSelect.value)
            formData.append('name', nameInput.value.trim() || '<untitled>')
            formData.append('notes', '')
            formData.append('tags', '')
            formData.append('file', file)
            if (previewFile) {
              formData.append('preview', previewFile)
            }

            await api(\`/api/projects/\${projectSelect.value}/photos\`, {
              method: 'POST',
              body: formData,
            })
          }

          captureInput.value = ''
          nameInput.value = ''
          setStatus('Uploaded.')
        } catch (error) {
          setStatus(error.message, true)
        }
      }

      projectSelect.addEventListener('change', () => {
        loadNodes().catch((error) => setStatus(error.message, true))
      })

      captureInput.addEventListener('change', () => {
        uploadSelectedFiles(Array.from(captureInput.files || []))
      })

      chooseButton.addEventListener('click', () => {
        captureInput.removeAttribute('capture')
        captureInput.click()
        window.setTimeout(() => {
          captureInput.setAttribute('capture', 'environment')
        }, 0)
      })

      loadProjects().catch((error) => setStatus(error.message, true))
    </script>
  </body>
</html>`
}
