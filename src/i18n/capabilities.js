export const capabilitiesZh = {
  capabilitiesAdmin: {
    title: '首页能力配置', description: '维护首页“我们的能力”的中英文文案、背景图与流程步骤。',
    textSettings: '中英文内容', textHint: '使用上方语言选项维护文案，中英文一起保存。',
    fields: { kicker: '栏目小标题', titleLine1: '标题第一行', titleLine2: '标题第二行（选填）', description: '区域说明', imageAlt: '背景图说明（选填）' },
    displaySettings: '展示与背景', enabled: '在首页显示此区域', image: '背景图片（选填）',
    steps: '流程步骤', stepsHint: '最多 {max} 个步骤，可调整顺序、隐藏或删除。展示编号按可见步骤顺序自动生成，中英文共用图标与显示状态。',
    stepTitle: '步骤 {number}', stepName: '步骤名称', addStep: '新增步骤', stepVisible: '展示此步骤', visible: '显示', hidden: '隐藏',
    moveUp: '上移', moveDown: '下移', deleteStep: '删除步骤', iconMode: '图标方式', preset: '内置图标', uploaded: '上传图标', iconName: '选择图标', stepIcon: '步骤图标',
    icons: { idea: '概念 / 创意', engineering: '工程设计', design: '设计 / 绘图', fabrication: '制造 / 工具', assembly: '装配 / 连接', delivery: '交付 / 运输', general: '通用能力' },
    preview: '首页实时预览', previewHint: '预览跟随当前编辑语言，保存后更新官网。', hiddenPreview: '此区域已关闭首页展示，仍可预览编辑中的内容。', noVisibleSteps: '当前没有开启展示的步骤。',
    loadFailed: '配置加载失败，请重启 Java 服务并执行数据库初始化后重试。', saveFailed: '保存失败，请检查填写内容和服务连接。', saved: '首页能力配置已保存', unsaved: '有未保存的修改，中英文内容将一起保存', saveNote: '中英文内容将一起保存',
    required: '请填写{language}的{field}。', atLeastOne: '在首页显示此区域时，请至少开启一个流程步骤。', iconRequired: '请上传步骤 {number} 的图标，或切换为内置图标。', invalidImage: '请通过上传功能选择图片。', uploading: '图片正在上传，请等待完成后保存。',
  },
}

export const capabilitiesEn = {
  capabilitiesAdmin: {
    title: 'Homepage capabilities', description: 'Manage the bilingual copy, background and process steps in Our capabilities on the homepage.',
    textSettings: 'Bilingual content', textHint: 'Edit each language using the selector above. Both languages are saved together.',
    fields: { kicker: 'Section eyebrow', titleLine1: 'Title line 1', titleLine2: 'Title line 2 (optional)', description: 'Description', imageAlt: 'Background description (optional)' },
    displaySettings: 'Visibility and background', enabled: 'Show this section on the homepage', image: 'Background image (optional)',
    steps: 'Process steps', stepsHint: 'Up to {max} steps. Reorder, hide or delete steps. Visible steps are numbered automatically; both languages share icons and visibility.',
    stepTitle: 'Step {number}', stepName: 'Step name', addStep: 'Add step', stepVisible: 'Show this step', visible: 'Visible', hidden: 'Hidden',
    moveUp: 'Move up', moveDown: 'Move down', deleteStep: 'Delete step', iconMode: 'Icon source', preset: 'Built-in icon', uploaded: 'Upload image', iconName: 'Choose icon', stepIcon: 'Step icon',
    icons: { idea: 'Concept / idea', engineering: 'Engineering', design: 'Design / drawing', fabrication: 'Fabrication / tools', assembly: 'Assembly / connection', delivery: 'Delivery / transport', general: 'General capability' },
    preview: 'Live homepage preview', previewHint: 'The preview follows the editing language. Save to update the website.', hiddenPreview: 'This section is hidden on the homepage. Its draft content is still shown in the preview.', noVisibleSteps: 'No steps are currently visible.',
    loadFailed: 'Could not load settings. Restart Java and initialize the database, then retry.', saveFailed: 'Could not save. Check the entries and server connection.', saved: 'Homepage capabilities saved', unsaved: 'Unsaved changes; both languages will be saved together', saveNote: 'Both languages are saved together',
    required: 'Enter {field} in {language}.', atLeastOne: 'Enable at least one process step when this section is visible.', iconRequired: 'Upload an icon for step {number}, or select a built-in icon.', invalidImage: 'Select images using the upload control.', uploading: 'Images are uploading. Wait for completion before saving.',
  },
}
