#!/usr/bin/env node
// find-client-components-with-utils.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Buscando Client Components que importan @/lib/utils...\n');

const problematicFiles = [];

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

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Verificar si es un client component
  const isClient = content.trim().startsWith('"use client"') || 
                   content.trim().startsWith("'use client'");
  
  if (!isClient) return;
  
  // Verificar si importa de @/lib/utils
  const hasUtilsImport = content.includes('from "@/lib/utils"') || 
                         content.includes("from '@/lib/utils'");
  
  if (hasUtilsImport) {
    const relativePath = path.relative(process.cwd(), filePath);
    problematicFiles.push(relativePath);
    console.log(`❌ ${relativePath}`);
  }
}

const srcDir = path.join(process.cwd(), 'src');

if (!fs.existsSync(srcDir)) {
  console.error('❌ No se encontró la carpeta src/');
  process.exit(1);
}

walkDir(srcDir, checkFile);

console.log(`\n📊 Total de archivos problemáticos: ${problematicFiles.length}\n`);

if (problematicFiles.length > 0) {
  console.log('🔧 Para corregir, cambia en cada archivo:');
  console.log('   from "@/lib/utils"');
  console.log('   ↓');
  console.log('   from "@/lib/utils-client"\n');
  
  console.log('💡 Tip: Usa VSCode Find & Replace (Ctrl+Shift+H)');
  console.log('   Buscar: from "@/lib/utils"');
  console.log('   Reemplazar: from "@/lib/utils-client"');
  console.log('   Archivos: src/components/**/*.tsx\n');
} else {
  console.log('✅ ¡No se encontraron problemas!\n');
}