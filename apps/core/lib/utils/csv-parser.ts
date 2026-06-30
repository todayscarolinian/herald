import type { BulkCreateUserRowInput, BulkUpdateUserRowInput } from '@herald/types'
import Papa from 'papaparse'

interface ParseResult<T> {
  rows: T[]
  errors: { row: number; message: string }[]
}

function parsePositionNames(raw: string): string[] {
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseFile<T>(
  file: File,
  mapRow: (
    record: Record<string, string>,
    rowIndex: number,
    errors: { row: number; message: string }[]
  ) => T | null
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => (typeof value === 'string' ? value.trim() : value),
      complete: (results) => {
        const rows: T[] = []
        const errors: { row: number; message: string }[] = []

        results.data.forEach((record, index) => {
          const rowNumber = index + 2 // 1-based, skipping header row
          const mapped = mapRow(record, rowNumber, errors)
          if (mapped !== null) {
            rows.push(mapped)
          }
        })

        resolve({ rows, errors })
      },
      error: (error) => {
        resolve({
          rows: [],
          errors: [{ row: 0, message: `Failed to parse CSV: ${error.message}` }],
        })
      },
    })
  })
}

export function parseCreateUsersCsv(file: File): Promise<ParseResult<BulkCreateUserRowInput>> {
  return parseFile<BulkCreateUserRowInput>(file, (record, rowNumber, errors) => {
    const firstName = record['firstName'] ?? ''
    const lastName = record['lastName'] ?? ''
    const email = record['email'] ?? ''
    const positionsRaw = record['positions'] ?? ''

    const rowErrors: string[] = []
    if (!firstName) {rowErrors.push('"firstName" is required')}
    if (!lastName) {rowErrors.push('"lastName" is required')}
    if (!email) {rowErrors.push('"email" is required')}
    if (!positionsRaw) {rowErrors.push('"positions" is required')}

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') })
      return null
    }

    return {
      firstName,
      middleName: record['middleName'] || undefined,
      lastName,
      email,
      positionNames: parsePositionNames(positionsRaw),
    }
  })
}

export function parseUpdateUsersCsv(file: File): Promise<ParseResult<BulkUpdateUserRowInput>> {
  return parseFile<BulkUpdateUserRowInput>(file, (record, rowNumber, errors) => {
    const email = record['email'] ?? ''
    const firstName = record['firstName'] ?? ''
    const lastName = record['lastName'] ?? ''
    const positionsRaw = record['positions'] ?? ''

    const rowErrors: string[] = []
    if (!email) {rowErrors.push('"email" is required')}
    if (!firstName) {rowErrors.push('"firstName" is required')}
    if (!lastName) {rowErrors.push('"lastName" is required')}
    if (!positionsRaw) {rowErrors.push('"positions" is required')}

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') })
      return null
    }

    return {
      email,
      firstName,
      middleName: record['middleName'] || undefined,
      lastName,
      positionNames: parsePositionNames(positionsRaw),
    }
  })
}

export function generateCsvTemplate(mode: 'create' | 'update'): string {
  if (mode === 'create') {
    return 'firstName,middleName,lastName,email,positions\nJohn,,Doe,john.doe@example.com,Editor|Reporter\n'
  }
  return 'email,firstName,middleName,lastName,positions\njohn.doe@example.com,John,,Doe,Editor|Reporter\n'
}

export function downloadCsvTemplate(mode: 'create' | 'update'): void {
  const content = generateCsvTemplate(mode)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bulk-${mode}-users-template.csv`
  link.click()
  URL.revokeObjectURL(url)
}
