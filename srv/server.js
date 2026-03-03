// server.js (root of your CAP project)
const cds = require('@sap/cds')
const express = require('express')
const multer = require('multer')
const xlsx = require('xlsx')
const path = require('path')

// --- Configuration ---
const MAX_FILE_SIZE_MB = 10 // adjust if needed
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const FIELD_NAME = 'file' // <input name="file" />

// Strict list of accepted MIME types and file extensions
const ALLOWED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel.sheet.macroEnabled.12',                    // .xlsm
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',             // .xlsb
  'application/vnd.ms-excel'                                           // .xls (legacy)
])
const ALLOWED_EXT = new Set(['.xlsx', '.xlsm', '.xlsb', '.xls'])

// Multer setup (in-memory for ~MB sized files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES }
})

// Helper for validating content-type and extension
function validateExcelFile(file) {
  if (!file) return 'No file uploaded'

  const { mimetype, originalname, size } = file
  const ext = (path.extname(originalname) || '').toLowerCase()

  if (size <= 0) return 'Empty file uploaded'
  if (size > MAX_FILE_SIZE_BYTES) return `File too large: limit is ${MAX_FILE_SIZE_MB} MB`
  if (!ALLOWED_EXT.has(ext)) return `Unsupported extension ${ext}. Allowed: ${[...ALLOWED_EXT].join(', ')}`

  // Some browsers/clients may send generic types; prefer strict but allow known excel types
  if (mimetype && !ALLOWED_MIME.has(mimetype)) {
    return `Unsupported MIME type ${mimetype}. Allowed: ${[...ALLOWED_MIME].join(', ')}`
  }
  return null
}

// Bootstrap runs before CAP mounts its services
cds.on('bootstrap', (app) => {
  // Keep global body limits small for DoS protection; large payloads go through the upload route only
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  /**
   * Upload endpoint (multipart/form-data)
   * IMPORTANT: Define BEFORE CAP services are mounted
   * Route examples:
   *   - Simple REST:            POST /excel/upload
   *   - Within OData path:      POST /odata/v4/students/uploadStudentExcel
   */
  app.post('/excel/upload', upload.single(FIELD_NAME), async (req, res) => {
    try {
      const file = req.file
      const err = validateExcelFile(file)
      if (err) return res.status(400).json({ error: err })

      // Parse Excel in memory
      const workbook = xlsx.read(file.buffer, { type: 'buffer' })
      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) return res.status(400).json({ error: 'No sheets found in workbook' })

      const sheet = workbook.Sheets[firstSheetName]
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: true })

      // Example: optionally upsert into a CAP entity
      // Replace 'StudentService.Students' and the mapping with your real model.
      // Comment this block if you only need to return parsed JSON.
      /*
      const db = await cds.connect.to('db')
      const { Students } = db.entities('StudentService') // namespace.service if used

      // Map rows -> entity fields as needed
      // Assume rows columns: ID, name, email
      if (!Students) {
        return res.status(500).json({ error: 'Entity StudentService.Students not found. Check your CDS model.' })
      }

      // Upsert example (will insert/update based on key)
      // - You can validate rows or transform as needed
      await Promise.all(rows.map(r => {
        const entry = {
          ID: r.ID,           // ensure this exists or generate UUIDs prior
          name: r.name,
          email: r.email
        }
        return INSERT.into(Students).entries(entry)
          .catch(async () => {
            return UPDATE(Students).set(entry).where({ ID: entry.ID })
          })
      }))
      */

      // Return parsed data to client
      return res.status(200).json({
        ok: true,
        sheet: firstSheetName,
        count: rows.length,
        data: rows // remove in production if large; consider pagination
      })
    } catch (e) {
      // Multer file-size errors show up with code 'LIMIT_FILE_SIZE'
      if (e && e.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `File too large: limit is ${MAX_FILE_SIZE_MB} MB` })
      }
      console.error('Upload error:', e)
      return res.status(500).json({ error: e.message || 'Internal Server Error' })
    }
  })
})

module.exports = cds.server