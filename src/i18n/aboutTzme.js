export const aboutTzmeZh = {
  aboutTzmeAdmin: {
    title: '关于 TZME 配置', description: '分别维护首页和关于我们页的“关于 TZME”内容，每处固定展示 4 个词条。',
    homeTab: '首页 · 关于 TZME', aboutTab: '关于我们 · 首屏介绍',
    textSettings: '中英文内容', textHint: '两处页面分别配置，切换语言维护文案，保存时一起提交。',
    fields: { kicker: '栏目小标题', titleLine1: '标题第一行', titleLine2: '标题第二行（选填）', description: '介绍正文', description2: '补充说明（选填）', imageAlt: '图片说明（选填）' },
    entries: '下方词条', entriesHint: '每处固定 4 个词条。可填写数字或短文字，维护中英文内容并调整顺序。建议数值或短语保持简短。',
    entryTitle: '词条 {number}', entryValue: '数字 / 短语', entrySuffix: '单位 / 后缀（选填）', entryLabel: '词条说明',
    moveUp: '上移', moveDown: '下移', imageSettings: '图片配置', homeImage: '首页配图', aboutImage: '关于我们首屏背景图',
    homeImageHint: '建议使用清晰的工厂、设备或生产场景照片，主体靠近中心，四周预留裁切空间。',
    aboutImageHint: '建议使用横向工业场景大图，主体放在中间或右侧，左侧保持简洁，避免图片中带文字。',
    preview: '当前页面预览', previewHint: '预览跟随当前页面和编辑语言，保存后更新官网。',
    saveNote: '两个页面的中英文内容将一起保存', unsaved: '有未保存的修改，两个页面的中英文内容将一起保存',
    saved: '关于 TZME 配置已保存', loadFailed: '配置加载失败，请重启 Java 服务完成数据库初始化后重试。', saveFailed: '保存失败，请检查填写内容和服务连接。',
    required: '请填写“{page}”中{language}的{field}。', invalidEntries: '每处必须填写 4 个词条。', invalidImage: '请通过上传功能选择图片。', uploading: '图片正在上传，请等待完成后保存。',
  },
}

export const aboutTzmeEn = {
  aboutTzmeAdmin: {
    title: 'About TZME settings', description: 'Manage the homepage and About page introductions, each with exactly four entries.',
    homeTab: 'Homepage · About TZME', aboutTab: 'About page · Introduction',
    textSettings: 'Bilingual content', textHint: 'Configure each page separately. Use the language selector to edit copy; both pages and languages are saved together.',
    fields: { kicker: 'Section eyebrow', titleLine1: 'Title line 1', titleLine2: 'Title line 2 (optional)', description: 'Introduction', description2: 'Additional description (optional)', imageAlt: 'Image description (optional)' },
    entries: 'Introduction entries', entriesHint: 'Each page displays exactly four entries. Enter a number or short phrase in each language and adjust their order. Keep values and phrases concise.',
    entryTitle: 'Entry {number}', entryValue: 'Number / short phrase', entrySuffix: 'Unit / suffix (optional)', entryLabel: 'Entry description',
    moveUp: 'Move up', moveDown: 'Move down', imageSettings: 'Image settings', homeImage: 'Homepage image', aboutImage: 'About page background image',
    homeImageHint: 'Use a clear factory, equipment or production photo. Keep the subject near the center and leave room for cropping.',
    aboutImageHint: 'Use a wide industrial photo with the subject in the center or on the right. Keep the left side uncluttered and avoid embedded text.',
    preview: 'Current page preview', previewHint: 'The preview follows the selected page and editing language. Save to update the website.',
    saveNote: 'Both pages and languages are saved together', unsaved: 'Unsaved changes; both pages and languages will be saved together',
    saved: 'About TZME settings saved', loadFailed: 'Could not load settings. Restart Java to initialize the database, then retry.', saveFailed: 'Could not save. Check the entries and server connection.',
    required: 'Enter {field} in {language} for {page}.', invalidEntries: 'Each page must contain exactly four entries.', invalidImage: 'Select images using the upload control.', uploading: 'Images are uploading. Wait for completion before saving.',
  },
}
