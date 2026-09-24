<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
const page = ref(null)
const { drawerOpen, goTo, menuItems, locale, setLocale } = useDesignPage('hc-detail', page)
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <header class="hc-nav">
                <div class="hc-nav-in">
                  <span class="hc-logo"><i></i>TZME</span>
                  <nav class="hc-menu">
                    <a class="on">Solutions</a><a>Industries</a><a>Capabilities</a>
                    <a>Projects</a><a>About TZME</a><a>Insights</a>
                  </nav>
                  <div class="hc-nav-r">
                    <el-button class="hc-mobile-menu" text aria-label="Open navigation" @click="drawerOpen = true">☰</el-button>
                    <span class="hc-lang"><button type="button" class="hc-lang-option" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button> | <button type="button" class="hc-lang-option" :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中</button></span>
                    <span class="hc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg></span>
                    <el-button class="hc-btn solid sm" style="height:34px">Contact us<i>→</i></el-button>
                  </div>
                </div>
              </header>

              <section class="hc-hero">
                <div class="hc-bleed"><img src="/assets/p-port-1.jpg" alt="" /></div>
                <span class="hc-scrim"></span>
                <div class="hc-hero-in" style="bottom:74px"><div class="hc-w">
                  <span class="hc-kick">Ports &amp; terminals · DWG TZME-HM-0412</span>
                  <h2 class="hc-h1" style="margin-top:20px;font-size:52px">
                    Ship loader<br />2,500 t/h</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:520px">
                    Rail-mounted travelling ship loader. Boom luffs and slews independently
                    to trim the hold without moving the portal.</p>
                  <div style="display:flex;gap:14px;margin-top:30px">
                    <el-button class="hc-btn solid">Request a quote<i>→</i></el-button>
                    <el-button class="hc-btn ghost">Download datasheet</el-button>
                  </div>
                </div></div>
              </section>

              <section class="hc-sec">
                <div class="hc-w" style="display:grid;grid-template-columns:1fr 480px;gap:88px">
                  <div>
                    <span class="hc-kick">01 / Description</span>
                    <h3 class="hc-h3" style="margin-top:16px;color:#fff;font-size:24px">
                      Continuous loading of iron ore and coal</h3>
                    <p class="hc-p" style="margin-top:18px">
                      Structure, machinery house and boom are fabricated in our own workshops
                      to EN 1090-2 EXC4, trial-assembled before shipment, then erected and
                      commissioned on site by our own supervisors. The machine can trim the
                      hold without moving the portal — which matters when the berth is short
                      and the vessel has to be loaded in a single pass.</p>
                    <span class="hc-kick" style="margin-top:44px;display:block">02 / Technical notes</span>
                    <div style="margin-top:22px">
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">01</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">Welding to EN 1090-2 EXC4 in an ISO 3834-2 certified workshop.</span>
                    </div>
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">02</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">Fatigue assessment to EN 1993-1-9 for boom and slew structure.</span>
                    </div>
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">03</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">Surface preparation to Sa 2.5; coating system C5-M for marine service.</span>
                    </div>
                    <div style="display:flex;gap:20px;padding:15px 0;border-bottom:1px solid var(--line-d2)">
                      <span style="font-family:var(--f-din);font-size:11px;font-weight:700;color:var(--blue-2);flex:0 0 24px">04</span>
                      <span style="font-size:13px;line-height:1.7;color:var(--txt-2)">Trial assembly and functional test recorded before shipment.</span>
                    </div>
                    </div>
                  </div>
                  <div>
                    <span class="hc-kick">03 / Specification</span>
                    <div style="margin-top:22px">
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">Rated capacity</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">2 500 t/h</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">Outreach</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">78 m</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">Boom length</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">92 m</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">Total mass</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">1 850 t</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">Steel grade</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">S355J2 · S690QL</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">Welding standard</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">EN 1090-2 EXC4</dd>
                      </div>
                      <div style="display:flex;justify-content:space-between;gap:24px;padding:13px 0;border-bottom:1px solid var(--line-d2)">
                        <dt style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt-3)">Coating</dt>
                        <dd style="font-size:13px;font-weight:600;color:var(--txt)">C5-M · Sa 2.5</dd>
                      </div>
                    </div>
                    <div style="margin-top:34px;padding:26px 26px 24px;border-radius:6px;
                         background:var(--navy-2);border:1px solid var(--line-d)">
                      <span class="hc-kick">Indicative delivery</span>
                      <div style="font-size:38px;font-weight:700;color:#fff;margin-top:14px;
                           letter-spacing:-.01em">Q3 · 2027</div>
                      <div style="font-size:11px;color:var(--txt-3);margin-top:12px;
                           letter-spacing:.06em">15 – 18 MONTHS FROM PO</div>
                      <div style="display:flex;gap:10px;margin-top:22px">
                        <span class="hc-tag d">EN 1090-2 EXC4</span>
                        <span class="hc-tag d">ISO 3834-2</span>
                        <span class="hc-tag d">CWB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="hc-sec hc-light" style="padding:72px 0">
                <div class="hc-w">
                  <span class="hc-kick">04 / Manufacturing route</span>
                  <div class="hc-steps" style="margin-top:40px">
                    <div><span class="ic"><i></i></span><div class="no">01</div>
                      <div class="lb">Concept</div></div>
                    <div><span class="ic"><i></i></span><div class="no">02</div>
                      <div class="lb">Engineering</div></div>
                    <div><span class="ic"><i></i></span><div class="no">03</div>
                      <div class="lb">Design</div></div>
                    <div><span class="ic"><i></i></span><div class="no">04</div>
                      <div class="lb">Fabrication</div></div>
                    <div><span class="ic"><i></i></span><div class="no">05</div>
                      <div class="lb">Assembly</div></div>
                    <div><span class="ic"><i></i></span><div class="no">06</div>
                      <div class="lb">Delivery</div></div>
                  </div>
                </div>
              </section>

              <section class="hc-sec">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">05 / Related equipment</span>
                      <h2 class="hc-h2" style="margin-top:18px">Same category</h2>
                    </div>
                    <span class="hc-lnk">All port equipment<i>→</i></span>
                  </div>
                  <div class="hc-cards" style="grid-template-columns:repeat(3,1fr)">
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-port-2.png" alt="" /></div>
                    <div class="bd">
                      <h3>Ship unloader</h3>
                      <p>Capacity 1,800 t/h · grab type</p>
                      <span class="go">View<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-convey-1.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>Belt conveyor</h3>
                      <p>Capacity 1,200 t/h · long distance</p>
                      <span class="go">View<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>Stacker-reclaimer</h3>
                      <p>Capacity 6,000 t/h · rail mounted</p>
                      <span class="go">View<i>→</i></span>
                    </div>
                  </a>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">TZME-HM-0412 · Rev 1.0</span>
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
