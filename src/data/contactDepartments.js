export const MAX_CONTACT_DEPARTMENTS = 20;

export const contactDepartmentDefaults = [
  { id: 'procurement', title: '采购', description: '采购需求、供应商合作与物料对接。' },
  { id: 'sales', title: '销售', description: '设备咨询、制造需求与供货沟通。' },
  { id: 'hr', title: 'HR', description: '招聘应聘、人才发展与人力资源合作。' },
  { id: 'culture', title: '企业文化', description: '企业文化、品牌传播与交流合作。' },
  { id: 'digital-lean', title: '数字精益', description: '数字化建设、精益改善与协同交流。' },
];

export function contactDepartments(contact) {
  const source = Array.isArray(contact?.departments) ? contact.departments : contactDepartmentDefaults;
  return source.map(item => ({
    title: '', description: '', phone: '', email: '', enabled: true, ...item,
  }));
}

export function departmentChannels(department, contact) {
  const ownEmail = department.email?.trim(), ownPhone = department.phone?.trim();
  return {
    emails: ownEmail ? [ownEmail] : (contact?.emails || []).filter(Boolean),
    phone: ownPhone || contact?.phone || '',
    generalEmail: !ownEmail, generalPhone: !ownPhone,
  };
}

export const departmentMailto = (email, title) =>
  `mailto:${encodeURIComponent(email).replace('%40', '@')}?subject=${encodeURIComponent(`【${title}】联系咨询`)}`;

export function contactTelephone(value) {
  const first = String(value || '').split(/[\/、,，;；]/)[0].trim();
  const number = (first.match(/^\+?[\d\s().-]+/)?.[0] || '').replace(/[^\d+]/g, '');
  return number ? `tel:${number}` : '';
}
