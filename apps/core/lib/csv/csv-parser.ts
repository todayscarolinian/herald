import type {
  BulkCreatePositionRowInput,
  BulkCreateUserRowInput,
  BulkUpdatePositionRowInput,
  BulkUpdateUserRowInput,
  Domain,
} from '@herald/types'
import { isValidDomain } from '@herald/utils'
import Papa from 'papaparse'

interface ParseResult<T> {
  rows: T[]
  errors: { row: number; message: string }[]
}

function parsePipeDelimitedList(raw: string): string[] {
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
    if (!firstName) {
      rowErrors.push('"firstName" is required')
    }
    if (!lastName) {
      rowErrors.push('"lastName" is required')
    }
    if (!email) {
      rowErrors.push('"email" is required')
    }
    if (!positionsRaw) {
      rowErrors.push('"positions" is required')
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') })
      return null
    }

    return {
      firstName,
      middleName: record['middleName'] || undefined,
      lastName,
      email,
      positionNames: parsePipeDelimitedList(positionsRaw),
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
    if (!email) {
      rowErrors.push('"email" is required')
    }
    if (!firstName) {
      rowErrors.push('"firstName" is required')
    }
    if (!lastName) {
      rowErrors.push('"lastName" is required')
    }
    if (!positionsRaw) {
      rowErrors.push('"positions" is required')
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') })
      return null
    }

    return {
      email,
      firstName,
      middleName: record['middleName'] || undefined,
      lastName,
      positionNames: parsePipeDelimitedList(positionsRaw),
    }
  })
}

export function generateCsvTemplate(mode: 'create' | 'update'): string {
  if (mode === 'create') {
    return 'firstName,middleName,lastName,email,positions\nJohn,,Doe,john.doe@example.com,Editor|Reporter\n'
  }
  return 'email,firstName,middleName,lastName,positions\njohn.doe@example.com,John,,Doe,Editor|Reporter\n'
}

function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadCsvTemplate(mode: 'create' | 'update'): void {
  downloadCsvFile(`bulk-${mode}-users-template.csv`, generateCsvTemplate(mode))
}

// Create and update rows share the exact same columns for positions, since "name"
// doubles as the bulk-update lookup key (there's no separate id column).
function parsePositionsCsv<T extends { name: string; abbreviation: string; domains: Domain[] }>(
  file: File
): Promise<ParseResult<T>> {
  return parseFile<T>(file, (record, rowNumber, errors) => {
    const name = record['name'] ?? ''
    const abbreviation = record['abbreviation'] ?? ''
    const domainsRaw = record['domains'] ?? ''
    const parsedDomains = parsePipeDelimitedList(domainsRaw)
    const invalidDomains = parsedDomains.filter((d) => !isValidDomain(d))

    const rowErrors: string[] = []
    if (!name) {
      rowErrors.push('"name" is required')
    }
    if (!abbreviation) {
      rowErrors.push('"abbreviation" is required')
    }
    if (invalidDomains.length > 0) {
      rowErrors.push(`Unknown domain(s): ${invalidDomains.join(', ')}`)
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') })
      return null
    }

    return { name, abbreviation, domains: parsedDomains as Domain[] } as T
  })
}

export function parseCreatePositionsCsv(
  file: File
): Promise<ParseResult<BulkCreatePositionRowInput>> {
  return parsePositionsCsv<BulkCreatePositionRowInput>(file)
}

export function parseUpdatePositionsCsv(
  file: File
): Promise<ParseResult<BulkUpdatePositionRowInput>> {
  return parsePositionsCsv<BulkUpdatePositionRowInput>(file)
}

// _mode is unused here (create/update share the same column set) but kept in the
// signature to mirror generateCsvTemplate's call-site shape.
export function generatePositionsCsvTemplate(_mode: 'create' | 'update'): string {
  return 'name,abbreviation,domains\nEditor,ED,TC Herald|TC Official Website\n'
}

export function downloadPositionsCsvTemplate(mode: 'create' | 'update'): void {
  downloadCsvFile(`bulk-${mode}-positions-template.csv`, generatePositionsCsvTemplate(mode))
}
