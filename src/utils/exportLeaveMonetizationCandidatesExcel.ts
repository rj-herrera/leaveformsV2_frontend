import type { Cell, Fill } from 'exceljs'
import type {
  LeaveMonetizationCandidateRow,
  LeaveMonetizationCandidatesReport,
  LeaveMonetizationGrandTotals,
} from '../api/types'
import { formatDateTime } from './leaveDisplay'

const TEXT = 'FF212529'
const GRAY = 'FF6C757D'
const BORDER = 'FFD9DDE5'
const HEADER_BG = 'FFF4F5F7'
const PRIMARY = 'FF009688'
const FONT_VL = 'FF4BC0C0'
const FONT_SL = 'FFFF9F40'
const FILL_VL = mixOnWhite('#4bc0c0', 0.1)
const FILL_SL = mixOnWhite('#ff9f40', 0.1)

const MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const LAST_COL = 11

const thin = {
  style: 'thin' as const,
  color: { argb: BORDER },
}

const borders = {
  top: thin,
  left: thin,
  bottom: thin,
  right: thin,
}

const HEADERS: { label: string; color?: string }[] = [
  { label: 'Employee No.' },
  { label: 'Employee Name' },
  { label: 'Group' },
  { label: 'VL Balance' },
  { label: 'VL Retained' },
  { label: 'VL Excess', color: FONT_VL },
  { label: 'SL Balance' },
  { label: 'SL Retained' },
  { label: 'SL Excess', color: FONT_SL },
  { label: 'Total Eligible Days' },
  { label: 'Eligibility Basis' },
]

function mixOnWhite(hex: string, opacity: number): string {
  const n = hex.replace('#', '')
  const r = Number.parseInt(n.slice(0, 2), 16)
  const g = Number.parseInt(n.slice(2, 4), 16)
  const b = Number.parseInt(n.slice(4, 6), 16)
  const mix = (channel: number) =>
    Math.round(channel * opacity + 255 * (1 - opacity))
  const toHex = (channel: number) =>
    mix(channel).toString(16).padStart(2, '0').toUpperCase()
  return `FF${toHex(r)}${toHex(g)}${toHex(b)}`
}

function solidFill(argb: string): Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  }
}

function daysAmount(value: string | null): number {
  if (value == null) return 0
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function applyBase(
  cell: Cell,
  opts?: { fill?: string; bold?: boolean; color?: string; align?: 'left' | 'center' },
) {
  cell.font = {
    name: 'Calibri',
    size: 10,
    bold: opts?.bold ?? false,
    color: { argb: opts?.color ?? TEXT },
  }
  cell.border = borders
  cell.alignment = {
    vertical: 'middle',
    horizontal: opts?.align ?? 'center',
    wrapText: true,
  }
  if (opts?.fill) cell.fill = solidFill(opts.fill)
}

function formatIsoDateLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function groupLabel(row: LeaveMonetizationCandidateRow): string {
  return (
    row.employee.group?.abbreviation?.trim() ||
    row.employee.group?.name?.trim() ||
    '—'
  )
}

function employeeNumberValue(value: string): number | string {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : value
}

function writeDaysCell(
  cell: Cell,
  value: string | null,
  opts?: { fill?: string; color?: string; bold?: boolean },
) {
  if (value == null) {
    cell.value = 'N/A'
    applyBase(cell, { color: GRAY, fill: opts?.fill })
    return
  }
  cell.value = daysAmount(value)
  cell.numFmt = '0.0'
  applyBase(cell, opts)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function loadWorkbook() {
  const exceljs = await import('exceljs')
  const Ctor =
    exceljs.Workbook ??
    (exceljs as { default?: { Workbook?: typeof exceljs.Workbook } }).default
      ?.Workbook
  if (!Ctor) {
    throw new Error('ExcelJS failed to load')
  }
  return new Ctor()
}

export async function downloadLeaveMonetizationCandidatesExcel(params: {
  report: LeaveMonetizationCandidatesReport
  rows: LeaveMonetizationCandidateRow[]
  totals: LeaveMonetizationGrandTotals
}): Promise<void> {
  const { report, rows, totals } = params
  const workbook = await loadWorkbook()
  workbook.creator = 'Leave Forms'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Monetization', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
    },
  })

  const headerRow = 4
  const firstDataRow = 5
  const totalsRow = firstDataRow + rows.length

  sheet.mergeCells(1, 1, 1, LAST_COL)
  const title = sheet.getCell(1, 1)
  title.value = 'Leave Monetization Candidates'
  title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: PRIMARY } }
  title.alignment = { vertical: 'middle', horizontal: 'left' }

  sheet.mergeCells(2, 1, 2, LAST_COL)
  const subtitle = sheet.getCell(2, 1)
  subtitle.value = [
    `Conversion year ${report.conversion_year}`,
    `Cut-off ${formatIsoDateLabel(report.balance_cut_off)}`,
    `As of ${formatIsoDateLabel(report.as_of)}`,
    `Generated ${formatDateTime(report.generated_at)}`,
    `${rows.length} eligible employee${rows.length === 1 ? '' : 's'}`,
  ].join('  ·  ')
  subtitle.font = { name: 'Calibri', size: 11, color: { argb: GRAY } }
  subtitle.alignment = { vertical: 'middle', horizontal: 'left' }

  sheet.getRow(1).height = 24
  sheet.getRow(2).height = 18
  sheet.getRow(headerRow).height = 28

  const header = sheet.getRow(headerRow)
  HEADERS.forEach((item, index) => {
    const cell = header.getCell(index + 1)
    cell.value = item.label
    applyBase(cell, {
      fill: HEADER_BG,
      bold: true,
      color: item.color ?? GRAY,
      align: index < 3 ? 'left' : 'center',
    })
  })

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(firstDataRow + rowIndex)
    const showVl = row.vl_excess != null
    const showSl = row.sl_excess != null

    const numberCell = excelRow.getCell(1)
    numberCell.value = employeeNumberValue(row.employee.employee_number)
    applyBase(numberCell, { align: 'left' })

    const nameCell = excelRow.getCell(2)
    nameCell.value = row.employee.name
    applyBase(nameCell, { align: 'left' })

    const groupCell = excelRow.getCell(3)
    groupCell.value = groupLabel(row)
    applyBase(groupCell, { align: 'left' })

    writeDaysCell(excelRow.getCell(4), showVl ? row.vl_balance : null)
    writeDaysCell(excelRow.getCell(5), showVl ? row.vl_retained : null, {
      color: GRAY,
    })
    writeDaysCell(excelRow.getCell(6), showVl ? row.vl_excess : null, {
      fill: showVl ? FILL_VL : undefined,
      color: showVl ? FONT_VL : GRAY,
      bold: showVl,
    })

    writeDaysCell(excelRow.getCell(7), showSl ? row.sl_balance : null)
    writeDaysCell(excelRow.getCell(8), showSl ? row.sl_retained : null, {
      color: GRAY,
    })
    writeDaysCell(excelRow.getCell(9), showSl ? row.sl_excess : null, {
      fill: showSl ? FILL_SL : undefined,
      color: showSl ? FONT_SL : GRAY,
      bold: showSl,
    })

    const totalCell = excelRow.getCell(10)
    totalCell.value = daysAmount(row.total_eligible_days)
    totalCell.numFmt = '0.0'
    applyBase(totalCell, { bold: true })

    const basisCell = excelRow.getCell(11)
    basisCell.value = row.eligibility_basis
    applyBase(basisCell, { align: 'left' })
  })

  const total = sheet.getRow(totalsRow)
  sheet.mergeCells(totalsRow, 1, totalsRow, 3)
  const totalLabel = total.getCell(1)
  totalLabel.value = 'Total'
  applyBase(totalLabel, { fill: HEADER_BG, bold: true, align: 'left' })
  applyBase(total.getCell(2), { fill: HEADER_BG, bold: true })
  applyBase(total.getCell(3), { fill: HEADER_BG, bold: true })

  writeDaysCell(total.getCell(4), totals.vl_balance, {
    fill: HEADER_BG,
    bold: true,
  })
  const retainedVl = total.getCell(5)
  retainedVl.value = '—'
  applyBase(retainedVl, { fill: HEADER_BG, color: GRAY, bold: true })

  writeDaysCell(total.getCell(6), totals.vl_excess_days, {
    fill: FILL_VL,
    color: FONT_VL,
    bold: true,
  })

  writeDaysCell(total.getCell(7), totals.sl_balance, {
    fill: HEADER_BG,
    bold: true,
  })
  const retainedSl = total.getCell(8)
  retainedSl.value = '—'
  applyBase(retainedSl, { fill: HEADER_BG, color: GRAY, bold: true })

  writeDaysCell(total.getCell(9), totals.sl_excess_days, {
    fill: FILL_SL,
    color: FONT_SL,
    bold: true,
  })

  writeDaysCell(total.getCell(10), totals.total_eligible_days, {
    fill: HEADER_BG,
    bold: true,
  })
  applyBase(total.getCell(11), { fill: HEADER_BG })

  sheet.getColumn(1).width = 16
  sheet.getColumn(2).width = 28
  sheet.getColumn(3).width = 12
  for (let col = 4; col <= 10; col += 1) {
    sheet.getColumn(col).width = 16
  }
  sheet.getColumn(11).width = 18

  const buffer = await workbook.xlsx.writeBuffer()
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const blob = new Blob([bytes], { type: MIME })
  downloadBlob(
    blob,
    `leave-monetization-candidates-${report.conversion_year}.xlsx`,
  )
}
