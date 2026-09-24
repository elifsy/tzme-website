<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
const page = ref(null)
const { drawerOpen, goTo, menuItems, locale, setLocale } = useDesignPage('hc-contact', page)
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <header class="hc-nav">
                <div class="hc-nav-in">
                  <span class="hc-logo"><i></i>TZME</span>
                  <nav class="hc-menu"><a>Solutions</a><a>Industries</a><a>Capabilities</a><a>Projects</a><a>About TZME</a><a class="on">Contact</a></nav>
                  <div class="hc-nav-r">
                    <el-button class="hc-mobile-menu" text aria-label="Open navigation" @click="drawerOpen = true">☰</el-button>
                    <span class="hc-lang"><button type="button" class="hc-lang-option" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button> | <button type="button" class="hc-lang-option" :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中</button></span>
                    <span class="hc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg></span>
                    <el-button class="hc-btn solid sm" style="height:34px">Contact us<i>→</i></el-button>
                  </div>
                </div>
              </header>

              <section class="hc-sec" style="padding:72px 0 56px">
                <div class="hc-w" style="display:flex;justify-content:space-between;
                     align-items:flex-end;gap:60px">
                  <div>
                    <span class="hc-kick">Get in touch · Reply within 2 working days</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff;font-size:52px">
                      Contact us</h2>
                  </div>
                  <p class="hc-p" style="max-width:400px">
                    Send a duty statement, a drawing set or just a capacity requirement.</p>
                </div>
              </section>

              <section style="border-top:1px solid var(--line-d2)">
                <div class="hc-w" style="padding:64px 0 96px;display:grid;
                     grid-template-columns:1fr 600px;gap:88px;align-items:start">
                  <div>
                    <span class="hc-kick">01 / Direct contact</span>
                    <div style="margin-top:26px">
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">Address</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">No.139 Xiamen Road, Binhai New Area,<br />Tanggu, Tianjin 300459, China</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">Telephone</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">+86 22 2521 4991 / 2521 1565</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">Fax</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">+86 22 2521 1535</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">Email</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">tzme@tzme.net · jyb@tzme.net</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">Website</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">www.tzme.net</dd>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:24px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3);flex:0 0 110px">Port</dt>
                      <dd style="font-size:13px;color:var(--txt);text-align:right;line-height:1.7">10 km from Tianjin Port</dd>
                    </div>
                    </div>
                    <span class="hc-kick" style="margin-top:46px;display:block">02 / Subsidiaries</span>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px">
                    <div style="padding:24px 24px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:13.5px;font-weight:700;color:#fff">Tianjin Zhenhan Mechanical Equipment</div>
                      <div style="font-size:12px;color:var(--txt-2);margin-top:10px;line-height:1.8">No.9 Xuri Street, Yingcheng Industrial Park, Hangu, Binhai 300840</div>
                    </div>
                    <div style="padding:24px 24px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:13.5px;font-weight:700;color:#fff">Tianjin Greenland Mechanical Equipment</div>
                      <div style="font-size:12px;color:var(--txt-2);margin-top:10px;line-height:1.8">Lingang Port Area, Tianjin Free Trade Zone</div>
                    </div>
                    <div style="padding:24px 24px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:13.5px;font-weight:700;color:#fff">Manufacturing enquiries</div>
                      <div style="font-size:12px;color:var(--txt-2);margin-top:10px;line-height:1.8">Engineering review within two working days</div>
                    </div>
                    </div>
                  </div>
                  <div class="hc-form">
                    <span class="hc-kick">03 / Enquiry form</span>
                    <div style="margin-top:24px">
                      <div class="g2">
                        <div class="hc-f"><label>Name *</label><el-input placeholder="John Miller" /></div>
                        <div class="hc-f"><label>Company *</label><el-input placeholder="Company name" /></div>
                        <div class="hc-f"><label>Country *</label><el-input placeholder="Australia" /></div>
                        <div class="hc-f"><label>Email *</label><el-input placeholder="you@company.com" /></div>
                        <div class="hc-f"><label>Phone</label><el-input placeholder="+61 …" /></div>
                        <div class="hc-f"><label>Industry *</label><el-input placeholder="Mining" /></div>
                      </div>
                      <div class="hc-f"><label>Project requirements *</label>
                        <el-input type="textarea" :rows="3" placeholder="Capacity, material handled, site conditions, required delivery date" /></div>
                      <div class="hc-upload">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="1.6" stroke-linecap="round"><path d="M12 16V6m0 0L8.5 9.5M12 6l3.5 3.5M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>
                        <div>
                          <div style="font-size:12px;color:var(--txt)">Drag and drop, or click to upload</div>
                          <div style="font-size:10.5px;color:var(--txt-3);margin-top:4px">
                            Max 20 MB · PDF · DWG · XLS · JPG · PNG</div>
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:20px">
                        <span style="font-size:10.5px;color:var(--txt-3)">
                          By sending you agree to our privacy policy.</span>
                        <el-button class="hc-btn solid">Send inquiry<i>→</i></el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">+86 22 2521 4991 · tzme@tzme.net</span>
                  <span class="hc-lang" style="margin-left:auto;color:var(--txt-2)"><button type="button" class="hc-lang-option" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button> | <button type="button" class="hc-lang-option" :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中</button></span>
                  <span class="hc-soc"><span>in</span><span>▶</span><span>✕</span></span>
                </div>
              </footer>

            </div>
  <el-drawer v-model="drawerOpen" title="TZME" direction="rtl" size="min(320px, 85vw)" class="hc-mobile-drawer">
    <nav class="hc-mobile-links">
      <el-button v-for="item in menuItems" :key="item.label" text @click="goTo(item.path)">{{ item.label }}</el-button>
    </nav>
    <div class="hc-mobile-language">
      <el-button :type="locale === 'en' ? 'primary' : 'default'" @click="setLocale('en')">English</el-button>
      <el-button :type="locale === 'zh' ? 'primary' : 'default'" @click="setLocale('zh')">中文</el-button>
    </div>
  </el-drawer></main>
</template>
