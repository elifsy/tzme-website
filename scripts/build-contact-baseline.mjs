import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { localeMessages } from '../src/i18n/locales/index.js'
import { initialSocialLinks } from '../src/data/socialLinks.js'

const target = 'database/baseline/contact-settings.json'
if (!existsSync(target)) {
  const { values } = JSON.parse(readFileSync('database/baseline/site-settings.json', 'utf8'))
  const translated = (key) => Object.fromEntries(Object.entries(localeMessages).map(([code, messages]) => [code, messages.site[key]]))
  const joined = (...keys) => Object.fromEntries(Object.entries(localeMessages).map(([code, messages]) => [code, keys.map(key => messages.site[key]).join('\n')]))
  const emailCopy = value => value.replaceAll("{'@'}", '@')
  const config = {
    contact: {
      headquarters: translated('headquartersTanggu'), address: joined('no139XiamenRoadBinhaiNewArea', 'tangguTianjin300459China'),
      phone: values.text_1bdbc09db8a1, fax: values.text_c9d5e797c268,
      emails: values.text_da9ede954e47.split(/\s*[·;,]\s*/).filter(Boolean), website: values.text_24e69a35b122, port: translated('10KmFromTianjinPort'),
      socialLinks: initialSocialLinks(),
    },
    subsidiaries: [
      { id: 'zhenhan', name: translated('tianjinZhenhanMechanicalEquipment'), address: translated('no9XuriStreetYingchengIndustrialParkHanguBinhai300840'), phone: '', email: '', website: '', enabled: true, showOnAbout: true },
      { id: 'greenland', name: translated('tianjinGreenlandMechanicalEquipment'), address: translated('lingangPortAreaTianjinFreeTradeZone'), phone: '', email: '', website: '', enabled: true, showOnAbout: true },
      { id: 'manufacturing', name: translated('manufacturingEnquiries'), address: translated('engineeringReviewWithinTwoWorkingDays'), phone: '', email: '', website: '', enabled: true, showOnAbout: false },
    ],
    form: {
      enabled: true, showOnHome: true, showOnContact: true, title: translated('03EnquiryForm'), buttonText: translated('sendInquiry'),
      successText: translated('inquirySent'), closedText: { en: 'Online inquiries are currently closed. Please contact us by email or phone.', zh: '\u5728\u7ebf\u54a8\u8be2\u6682\u672a\u5f00\u653e\uff0c\u8bf7\u901a\u8fc7\u90ae\u7bb1\u6216\u7535\u8bdd\u8054\u7cfb\u6211\u4eec\u3002' },
      showPrivacy: true, privacyText: translated('bySendingYouAgreeToOurPrivacyPolicy'), requiredFields: ['name', 'company', 'country', 'email', 'industry', 'requirements'],
    },
    upload: { enabled: true, allowedExtensions: ['pdf', 'dwg', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'], maxFileSizeMb: 20, maxFiles: 5 },
    notification: {
      enabled: false, recipients: values.text_da9ede954e47.split(/\s*[·;,]\s*/).filter(Boolean).map(email => ({ email: emailCopy(email), enabled: true })),
      smtp: { host: '', port: 465, username: '', password: '', from: '', security: 'ssl' },
    },
  }
  writeFileSync(target, JSON.stringify(config, null, 2) + '\n')
}
