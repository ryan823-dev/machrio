import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  // Serve the static v3 template file directly to preserve all styles/colors/fonts
  const templatePath = path.join(process.cwd(), 'Machrio_Import_Template_v3.xlsx')

  if (!fs.existsSync(templatePath)) {
    return NextResponse.json(
      { error: '模板文件不存在' },
      { status: 404 }
    )
  }

  const buffer = fs.readFileSync(templatePath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Machrio_Import_Template.xlsx"',
    },
  })
}
