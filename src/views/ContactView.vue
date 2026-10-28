<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  contactText,
  useContactSettings,
} from "../services/contactSettings.js";
import { useDesignPage } from "../composables/useDesignPage.js";
import SiteFooter from "../components/SiteFooter.vue";
import SiteNav from "../components/SiteNav.vue";
import InquiryForm from "../components/InquiryForm.vue";
import SubsidiaryCards from "../components/SubsidiaryCards.vue";
import ContactDetails from "../components/ContactDetails.vue";
import ContactIntro from "../components/ContactIntro.vue";
import SeoKnowledgeSection from "../components/SeoKnowledgeSection.vue";
const { locale } = useI18n({ useScope: "global" });
const { contactSettings } = useContactSettings();
const contact = computed(() => contactSettings.value?.contact);
const page = ref(null);
useDesignPage("hc-contact", page);
</script>

<template>
  <main
    ref="page"
    class="design-site contact-page site-refined refined-contact"
  >
    <div class="hc-page">
      <SiteNav />
      <ContactIntro />
      <section class="refine-section contact-main">
        <div
          class="hc-w refine-contact-grid"
          :class="{ 'j-contact-single': !contactSettings?.form.showOnContact }"
        >
          <div v-if="contact" class="refine-contact-side">
            <span class="refine-eyebrow">DIRECT CONTACT</span>
            <h2>直接联系</h2>
            <p class="refine-description">
              交流工况、图纸、质量要求和交付计划。
            </p>
            <a
              v-for="email in contact.emails"
              :key="email"
              class="refine-email"
              :href="'mailto:' + email"
              >{{ email }} <span aria-hidden="true">↗</span></a
            >
            <p v-if="contact.phone" class="refine-phone">{{ contact.phone }}</p>
            <ContactDetails :contact="{ ...contact, phone: '', emails: [] }" />
            <div class="refine-response">
              <span>沟通流程</span>
              <ol>
                <li><b>01</b>提交需求</li>
                <li><b>02</b>核对资料</li>
                <li><b>03</b>联系沟通</li>
              </ol>
            </div>
            <details
              v-if="contactSettings.subsidiaries.some((item) => item.enabled)"
              class="refine-company-contacts"
            >
              <summary>
                下属企业联系方式 <span aria-hidden="true">＋</span>
              </summary>
              <SubsidiaryCards />
            </details>
          </div>
          <div
            v-if="contactSettings?.form.showOnContact"
            class="refine-form-wrap"
          >
            <header>
              <span class="refine-eyebrow">TELL US YOUR NEEDS</span>
              <h2>
                {{
                  contactText(contactSettings.form.title, locale).replace(
                    /^\s*\d+\s*[\/／、.．]\s*/,
                    "",
                  )
                }}
              </h2>
              <p>填写基本信息与项目需求，便于我们准确沟通。</p>
            </header>
            <InquiryForm placement="contact" compact :show-heading="false" />
          </div>
        </div>
      </section>
      <SeoKnowledgeSection />
      <SiteFooter :show-contact-cta="false" />
    </div>
  </main>
</template>
