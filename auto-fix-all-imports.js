#!/usr/bin/env node
// auto-fix-all-imports.js - EJECUTAR ESTE

const fs = require('fs');
const path = require('path');

console.log('🔧 AUTO-FIX: Corrigiendo todos los imports...\n');

let filesFixed = 0;

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Verificar si es un client component
  const isClient = content.trim().startsWith('"use client"') || 
                   content.trim().startsWith("'use client'");
  
  const changes = [];
  
  // FIX 1: radix-ui → @radix-ui/react-slot
  if (content.includes('from "radix-ui"') || content.includes("from 'radix-ui'")) {
    content = content.replace(/from\s+["']radix-ui["']/g, 'from "@radix-ui/react-slot"');
    changes.push('radix-ui → @radix-ui/react-slot');
  }
  
  // FIX 2: @/lib/utils → @/lib/utils-client (SOLO en client components)
  if (isClient) {
    if (content.includes('from "@/lib/utils"') || content.includes("from '@/lib/utils'")) {
      content = content.replace(/from\s+["']@\/lib\/utils["']/g, 'from "@/lib/utils-client"');
      changes.push('@/lib/utils → @/lib/utils-client');
    }
  }
  
  // Si hubo cambios, guardar
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`✅ ${relativePath}`);
    changes.forEach(change => console.log(`   - ${change}`));
    filesFixed++;
  }
}

const srcDir = path.join(process.cwd(), 'src');

if (!fs.existsSync(srcDir)) {
  console.error('❌ No se encontró la carpeta src/');
  process.exit(1);
}

walkDir(srcDir, fixFile);

console.log(`\n✅ Proceso completado!`);
console.log(`   Archivos corregidos: ${filesFixed}\n`);

if (filesFixed > 0) {
  console.log('🚀 Siguiente paso:');
  console.log('   rm -rf .next && npm run build\n');
} else {
  console.log('ℹ️  No se encontraron archivos para corregir.\n');
}