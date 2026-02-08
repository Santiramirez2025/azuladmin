// app/api/settings/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await prisma.setting.findUnique({
      where: { key: "payment_rates" }
    })
    
    return NextResponse.json(
      settings?.value || {
        "1": 0,
        "3": 18,
        "6": 25,
        "9": 35,
        "12": 47
      }
    )
  } catch (error) {
    console.error("Error loading payment rates:", error)
    return NextResponse.json(
      {
        "1": 0,
        "3": 18,
        "6": 25,
        "9": 35,
        "12": 47
      }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    const setting = await prisma.setting.upsert({
      where: { key: "payment_rates" },
      create: {
        key: "payment_rates",
        value: data
      },
      update: {
        value: data
      }
    })
    
    return NextResponse.json(setting.value)
  } catch (error) {
    console.error("Error saving payment rates:", error)
    return NextResponse.json(
      { error: "Error al guardar tasas de pago" },
      { status: 500 }
    )
  }
}