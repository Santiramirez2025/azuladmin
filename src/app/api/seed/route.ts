import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function POST() {
  try {
    execSync("npx tsx prisma/seed-productos.ts", {
      stdio: "inherit",
    })

    return NextResponse.json({ 
      success: true,
      message: "Seed ejecutado correctamente" 
    })
  } catch (error) {
    console.error("Error ejecutando seed:", error)
    return NextResponse.json(
      { success: false, error: "Error ejecutando seed" },
      { status: 500 }
    )
  }
}