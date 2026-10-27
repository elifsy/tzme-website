import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
const configuration=JSON.parse(readFileSync('server/src/main/resources/seo-defaults.json','utf8'))
const encoded=Buffer.from(JSON.stringify(configuration),'utf8').toString('hex')
const sql=`-- 国内 SEO/GEO：仅初始化缺失的搜索展示配置，保留后续后台修改。\nSET NAMES utf8mb4;\nINSERT INTO site_settings (id,configuration)\nSELECT 'seo',CONVERT(0x${encoded} USING utf8mb4)\nWHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id='seo');\n`
writeFileSync('server/src/main/resources/db/26-seo-settings.sql',sql)
writeFileSync('database/migrations/2026-10-26-seo-settings.sql',sql)
if(process.argv.includes('--append-install')){
 const install=readFileSync('database/install.sql','utf8')
 if(!install.includes("SELECT 'seo',CONVERT(0x"))appendFileSync('database/install.sql','\n'+sql)
}
