<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
const page = ref(null)
const { drawerOpen, goTo, menuItems, locale, setLocale } = useDesignPage('hc-about', page)
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <header class="hc-nav">
                <div class="hc-nav-in">
                  <span class="hc-logo"><i></i>TZME</span>
                  <nav class="hc-menu">
                    <a>Solutions</a><a>Industries</a><a>Capabilities</a>
                    <a>Projects</a><a class="on">About TZME</a><a>Insights</a>
                  </nav>
                  <div class="hc-nav-r">
                    <el-button class="hc-mobile-menu" text aria-label="Open navigation" @click="drawerOpen = true">☰</el-button>
                    <span class="hc-lang"><button type="button" class="hc-lang-option" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button> | <button type="button" class="hc-lang-option" :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中</button></span>
                    <span class="hc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg></span>
                    <el-button class="hc-btn solid sm" style="height:34px">Contact us<i>→</i></el-button>
                  </div>
                </div>
              </header>

              <section class="hc-about">
                <div class="hc-about-l"><div class="hc-w">
                  <span class="hc-kick">About TZME</span>
                  <h2 class="hc-h2" style="margin-top:18px">Engineering<br />without limits.</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:540px">
                    Tianjin Heavy Steel Machinery Equipment Co., Ltd. designs, fabricates and
                    delivers engineered-to-order heavy steel equipment. Our work starts from a
                    client's duty statement or drawing set and ends with a commissioned machine
                    on site — design, welding, machining, trial assembly, export packing and
                    erection supervision are all handled in-house.</p>
                  <p class="hc-p" style="margin-top:18px;max-width:540px">
                    Roughly 90 % of our output is exported, mainly to mining houses, port operators
                    and EPC contractors in Australia, Europe and North America.</p>
                  <div class="hc-band" style="margin-top:48px;grid-template-columns:repeat(4,1fr)">
                    <div><div class="hc-stat">30,000<u>t</u></div>
                      <div class="hc-stat-cap">Annual output</div></div>
                    <div><div class="hc-stat">220,000<u>m²</u></div>
                      <div class="hc-stat-cap">Site area · 5 bases</div></div>
                    <div><div class="hc-stat">40<u>+</u></div>
                      <div class="hc-stat-cap">Export countries</div></div>
                    <div><div class="hc-stat">2002</div>
                      <div class="hc-stat-cap">Founded in Tianjin</div></div>
                  </div>
                </div></div>
                <div class="hc-about-r"><img src="/assets/rnd-2.jpg" alt="" /></div>
              </section>

              <section class="hc-sec hc-light">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">Certification</span>
                      <h2 class="hc-h2" style="margin-top:18px">Audited and certified</h2>
                    </div>
                    <span class="hc-lnk">Request certificates<i>→</i></span>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 340px;gap:64px;
                       align-items:start">
                    <div>
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                    <div style="padding:26px 24px;background:#fff;border:1px solid var(--line-l);border-radius:6px">
                      <div style="font-family:var(--f-din);font-size:20px;font-weight:700;color:var(--blue)">EN 1090-2</div>
                      <div style="font-size:11.5px;color:var(--mut);margin-top:10px;line-height:1.7">Execution of steel structures<br />Class EXC4</div>
                    </div>
                    <div style="padding:26px 24px;background:#fff;border:1px solid var(--line-l);border-radius:6px">
                      <div style="font-family:var(--f-din);font-size:20px;font-weight:700;color:var(--blue)">ISO 3834-2</div>
                      <div style="font-size:11.5px;color:var(--mut);margin-top:10px;line-height:1.7">Quality requirements for<br />fusion welding</div>
                    </div>
                    <div style="padding:26px 24px;background:#fff;border:1px solid var(--line-l);border-radius:6px">
                      <div style="font-family:var(--f-din);font-size:20px;font-weight:700;color:var(--blue)">CWB</div>
                      <div style="font-size:11.5px;color:var(--mut);margin-top:10px;line-height:1.7">Canadian Welding Bureau<br />certified fabricator</div>
                    </div>
                    <div style="padding:26px 24px;background:#fff;border:1px solid var(--line-l);border-radius:6px">
                      <div style="font-family:var(--f-din);font-size:20px;font-weight:700;color:var(--blue)">ISO 9001</div>
                      <div style="font-size:11.5px;color:var(--mut);margin-top:10px;line-height:1.7">Quality management<br />system</div>
                    </div>
                      </div>
                      <p class="hc-p" style="margin-top:26px;max-width:640px">
                        Our quality management system and welding certification were issued by
                        accredited third-party bodies and are renewed on a fixed audit cycle.
                        Current certificates are included in every tender submission.</p>
                    </div>
                    <div>
                      <img src="/assets/cert-1.jpg" style="width:100%;border-radius:6px;
                           border:1px solid var(--line-l)" alt="" />
                      <div style="font-size:10.5px;letter-spacing:.1em;color:var(--mut);
                           margin-top:14px;text-transform:uppercase">Fig. 01 — ISO 9001 certificate scan</div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="hc-sec">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">Facilities</span>
                      <h2 class="hc-h2" style="margin-top:18px">Three sites in Tianjin</h2>
                    </div>
                    <span class="hc-lnk">Book a factory visit<i>→</i></span>
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
                    <div style="padding:26px 26px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.02em">Headquarters · Tanggu</div>
                      <div style="font-size:12.5px;color:var(--txt-2);margin-top:12px;line-height:1.8">No.139 Xiamen Road, Binhai New Area,<br />Tanggu, Tianjin 300459, China</div>
                    </div>
                    <div style="padding:26px 26px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.02em">Tianjin Zhenhan Mechanical Equipment</div>
                      <div style="font-size:12.5px;color:var(--txt-2);margin-top:12px;line-height:1.8">No.9 Xuri Street, Yingcheng Industrial Park,<br />Hangu, Binhai 300840</div>
                    </div>
                    <div style="padding:26px 26px;background:var(--navy-2);border:1px solid var(--line-d);border-radius:6px">
                      <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.02em">Tianjin Greenland Mechanical Equipment</div>
                      <div style="font-size:12.5px;color:var(--txt-2);margin-top:12px;line-height:1.8">Lingang Port Area,<br />Tianjin Free Trade Zone</div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="hc-sec" style="padding:0 0 96px">
                <div class="hc-w hc-global">
                  <div>
                    <span class="hc-kick">Global reach</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">
                      Engineered in China.<br />Built for the world.</h2>
                    <div class="hc-map" style="margin-top:30px">
                      <img src="/assets/worldmap.png" alt="" />
                    </div>
                  </div>
                  <div class="hc-gstats">
                    <div><div class="hc-stat">60<u>+</u></div>
                      <div class="hc-stat-cap">Countries &amp; regions</div></div>
                    <div><div class="hc-stat">100<u>+</u></div>
                      <div class="hc-stat-cap">Global projects</div></div>
                    <div><div class="hc-stat">5</div>
                      <div class="hc-stat-cap">Continents</div></div>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">Tianjin Heavy Steel Machinery Equipment Co., Ltd.</span>
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
