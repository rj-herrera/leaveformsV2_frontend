import type { Cell, Fill, Workbook } from 'exceljs'
import type {
  MonthlyAttendanceCategory,
  MonthlyAttendanceCell,
  MonthlyAttendanceDateColumn,
  MonthlyAttendanceReport,
} from '../api/types'

const TEXT = 'FF212529'
const GRAY = 'FF6C757D'
const BORDER = 'FFD9DDE5'
const HEADER_BG = 'FFF4F5F7'
const WHITE = 'FFFFFFFF'
const PRIMARY = 'FF009688'

const FONT_VL = 'FF4BC0C0'
const FONT_SL = 'FFFF9F40'
const FONT_OTHERS = 'FF4F46E5'
const FONT_LWOP = 'FFDC3545'

const MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

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

const LEGEND: {
  label: string
  description: string
  fill: string
  sample?: number
}[] = [
  { label: 'VL', description: 'Vacation Leave', fill: mixOnWhite('#4bc0c0', 0.25) },
  { label: 'SL', description: 'Sick Leave', fill: mixOnWhite('#ff9f40', 0.25) },
  {
    label: 'Others',
    description: 'Emergency, PTB, Maternity, Paternity Leave, etc.',
    fill: mixOnWhite('#4f46e5', 0.3),
  },
  {
    label: 'LWOP',
    description: 'Leave Without Pay',
    fill: mixOnWhite('#dc3545', 0.15),
  },
  {
    label: 'Non-working',
    description: 'Weekends & holidays',
    fill: HEADER_BG,
  },
  {
    label: '0.5 (AM/PM)',
    description: 'Half-day leave',
    fill: WHITE,
    sample: 0.5,
  },
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

function attendanceAmount(value: string): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function cellExcelValue(
  cell: MonthlyAttendanceCell | undefined,
): number | string | null {
  if (!cell) return null
  if (cell.amount === '0.50') {
    return `0.5 (${cell.half === 'pm' ? 'PM' : 'AM'})`
  }
  return 1
}

function cellsByDate(
  cells: MonthlyAttendanceCell[],
): Map<string, MonthlyAttendanceCell> {
  return new Map(cells.map((cell) => [cell.date, cell]))
}

function resolvedCell(
  column: MonthlyAttendanceDateColumn,
  lookup: Map<string, MonthlyAttendanceCell>,
): {
  category: MonthlyAttendanceCategory | null
  isNonWorking: boolean
  value: number | string | null
} {
  const cell = lookup.get(column.date)
  return {
    category: cell?.category ?? null,
    isNonWorking: cell?.is_non_working ?? column.is_non_working,
    value: cellExcelValue(cell),
  }
}

function categoryFill(
  category: MonthlyAttendanceCategory | null,
  isNonWorking: boolean,
): string | null {
  switch (category) {
    case 'vl':
      return mixOnWhite('#4bc0c0', 0.25)
    case 'sl':
      return mixOnWhite('#ff9f40', 0.25)
    case 'others':
      return mixOnWhite('#4f46e5', 0.3)
    case 'lwop':
      return mixOnWhite('#dc3545', 0.15)
    default:
      return isNonWorking ? HEADER_BG : null
  }
}

function applyBase(cell: Cell, opts?: { fill?: string; bold?: boolean; color?: string }) {
  cell.font = {
    name: 'Calibri',
    size: 10,
    bold: opts?.bold ?? false,
    color: { argb: opts?.color ?? TEXT },
  }
  cell.border = borders
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  if (opts?.fill) cell.fill = solidFill(opts.fill)
}

function groupLabel(report: MonthlyAttendanceReport): string {
  const group = report.group
  if (!group) return 'All Groups'
  return group.abbreviation?.trim() || group.name?.trim() || 'All Groups'
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function loadWorkbook(): Promise<Workbook> {
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

export async function downloadMonthlyAttendanceExcel(
  report: MonthlyAttendanceReport,
  options?: { groupLabel?: string },
): Promise<void> {
  const workbook = await loadWorkbook()
  workbook.creator = 'Leave Forms'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Attendance', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4, showGridLines: false }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
    },
  })

  const dateCount = report.dates.length
  const lastCol = 2 + dateCount + 4
  const headerRow = 4
  const firstDataRow = 5
  const totalsRow = firstDataRow + report.rows.length

  sheet.mergeCells(1, 1, 1, lastCol)
  const title = sheet.getCell(1, 1)
  title.value = 'Monthly Attendance Report'
  title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: PRIMARY } }
  title.alignment = { vertical: 'middle', horizontal: 'left' }

  sheet.mergeCells(2, 1, 2, lastCol)
  const subtitle = sheet.getCell(2, 1)
  const scopeLabel = options?.groupLabel ?? groupLabel(report)
  subtitle.value = `${report.month_label}  ·  ${report.cut_off_label}  ·  ${scopeLabel}  ·  ${report.employee_count} employee${report.employee_count === 1 ? '' : 's'}`
  subtitle.font = { name: 'Calibri', size: 11, color: { argb: GRAY } }
  subtitle.alignment = { vertical: 'middle', horizontal: 'left' }

  sheet.getRow(1).height = 24
  sheet.getRow(2).height = 18
  sheet.getRow(headerRow).height = 28

  const header = sheet.getRow(headerRow)
  const headerLabels = ['Employee No.', 'Employee Name']
  headerLabels.forEach((label, index) => {
    const cell = header.getCell(index + 1)
    cell.value = label
    applyBase(cell, { fill: HEADER_BG, bold: true, color: GRAY })
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  })

  report.dates.forEach((column, index) => {
    const cell = header.getCell(3 + index)
    cell.value = `${column.day_of_month}\n${column.weekday_short}`
    applyBase(cell, {
      fill: HEADER_BG,
      bold: true,
      color: column.is_non_working ? GRAY : TEXT,
    })
  })

  const totalHeaders: { label: string; color: string }[] = [
    { label: 'VL', color: FONT_VL },
    { label: 'SL', color: FONT_SL },
    { label: 'Others', color: FONT_OTHERS },
    { label: 'LWOP', color: FONT_LWOP },
  ]
  totalHeaders.forEach((item, index) => {
    const cell = header.getCell(3 + dateCount + index)
    cell.value = item.label
    applyBase(cell, { fill: HEADER_BG, bold: true, color: item.color })
  })

  report.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(firstDataRow + rowIndex)
    const lookup = cellsByDate(row.cells)

    const numberCell = excelRow.getCell(1)
    const numeric = Number(row.employee.employee_number)
    numberCell.value = Number.isFinite(numeric)
      ? numeric
      : row.employee.employee_number
    applyBase(numberCell)
    numberCell.alignment = { vertical: 'middle', horizontal: 'left' }

    const nameCell = excelRow.getCell(2)
    nameCell.value = row.employee.name
    applyBase(nameCell)
    nameCell.alignment = { vertical: 'middle', horizontal: 'left' }

    report.dates.forEach((column, index) => {
      const resolved = resolvedCell(column, lookup)
      const cell = excelRow.getCell(3 + index)
      cell.value = resolved.value
      const fill = categoryFill(resolved.category, resolved.isNonWorking)
      applyBase(cell, fill ? { fill } : undefined)
    })

    const totals = [
      row.totals.vl,
      row.totals.sl,
      row.totals.others,
      row.totals.lwop,
    ]
    totals.forEach((value, index) => {
      const cell = excelRow.getCell(3 + dateCount + index)
      cell.value = attendanceAmount(value)
      applyBase(cell)
    })
  })

  const total = sheet.getRow(totalsRow)
  sheet.mergeCells(totalsRow, 1, totalsRow, 2)
  const totalLabel = total.getCell(1)
  totalLabel.value = 'Total'
  applyBase(totalLabel, { fill: HEADER_BG, bold: true })
  totalLabel.alignment = { vertical: 'middle', horizontal: 'left' }
  applyBase(total.getCell(2), { fill: HEADER_BG, bold: true })

  report.dates.forEach((_, index) => {
    applyBase(total.getCell(3 + index), { fill: HEADER_BG, bold: true })
  })

  ;[
    report.grand_totals.vl,
    report.grand_totals.sl,
    report.grand_totals.others,
    report.grand_totals.lwop,
  ].forEach((value, index) => {
    const cell = total.getCell(3 + dateCount + index)
    cell.value = attendanceAmount(value)
    applyBase(cell, { fill: HEADER_BG, bold: true })
  })

  const legendStart = totalsRow + 2
  const legendTitle = sheet.getCell(legendStart, 1)
  legendTitle.value = 'Legend'
  legendTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: TEXT } }

  LEGEND.forEach((item, index) => {
    const rowNumber = legendStart + 1 + index
    const swatch = sheet.getCell(rowNumber, 1)
    swatch.value = item.sample ?? null
    applyBase(swatch, { fill: item.fill, bold: true })

    const label = sheet.getCell(rowNumber, 2)
    label.value = `${item.label}  —  ${item.description}`
    label.font = { name: 'Calibri', size: 10, color: { argb: TEXT } }
    label.alignment = { vertical: 'middle', horizontal: 'left' }
  })

  sheet.getColumn(1).width = 16
  sheet.getColumn(2).width = 28
  for (let col = 3; col <= 2 + dateCount; col += 1) {
    sheet.getColumn(col).width = 7
  }
  sheet.getColumn(3 + dateCount).width = 8
  sheet.getColumn(4 + dateCount).width = 8
  sheet.getColumn(5 + dateCount).width = 10
  sheet.getColumn(6 + dateCount).width = 10

  const buffer = await workbook.xlsx.writeBuffer()
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const blob = new Blob([bytes], { type: MIME })
  downloadBlob(
    blob,
    `Monthly_Attendance_${report.month}_${report.cut_off}.xlsx`,
  )
}
