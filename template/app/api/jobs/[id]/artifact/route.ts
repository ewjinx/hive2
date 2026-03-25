import { NextResponse } from "next/server"

export async function GET() {
  const content = "Encrypted build output would be here."
  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="artifact.enc"`,
    },
  })
}
