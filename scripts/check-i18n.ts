import fs from 'node:fs';
import path from 'node:path';

function getDeepKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value as Record<string, unknown>, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys.sort();
}

function runI18nCheck() {
  const rootDir = process.cwd();
  const arPath = path.join(rootDir, 'messages', 'ar.json');
  const enPath = path.join(rootDir, 'messages', 'en.json');

  if (!fs.existsSync(arPath)) {
    console.error(`[i18n:check] Missing file: ${arPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(enPath)) {
    console.error(`[i18n:check] Missing file: ${enPath}`);
    process.exit(1);
  }

  const arContent = JSON.parse(fs.readFileSync(arPath, 'utf-8'));
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  const arKeys = getDeepKeys(arContent);
  const enKeys = getDeepKeys(enContent);

  const missingInEn = arKeys.filter((k) => !enKeys.includes(k));
  const missingInAr = enKeys.filter((k) => !arKeys.includes(k));

  let hasError = false;

  if (missingInEn.length > 0) {
    console.error(`[i18n:check] Keys present in ar.json but MISSING in en.json:`);
    for (const key of missingInEn) {
      console.error(`  - ${key}`);
    }
    hasError = true;
  }

  if (missingInAr.length > 0) {
    console.error(`[i18n:check] Keys present in en.json but MISSING in ar.json:`);
    for (const key of missingInAr) {
      console.error(`  - ${key}`);
    }
    hasError = true;
  }

  if (hasError) {
    console.error(`[i18n:check] FAILED: Translation keys do not match!`);
    process.exit(1);
  }

  console.log(`[i18n:check] SUCCESS: All ${arKeys.length} translation keys match perfectly between ar.json and en.json.`);
}

runI18nCheck();
