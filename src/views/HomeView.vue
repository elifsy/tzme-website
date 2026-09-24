<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
const page = ref(null)
const { drawerOpen, goTo, menuItems, locale, setLocale } = useDesignPage('hc-home', page)
</script>

<template>
<main ref="page" class="design-site">
<div class="hc-page">

              <!-- Hero -->
              <section class="hc-hero hc-home-hero">
                <div class="hc-bleed"><img src="/assets/hero-01.jpg" alt="" /></div>
                <span class="hc-scrim"></span>
              <header class="hc-nav over">
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
                    <el-button class="hc-btn ghost sm" style="height:34px">Contact us<i>→</i></el-button>
                  </div>
                </div>
              </header>
                <div class="hc-hero-in"><div class="hc-w">
                  <span class="hc-kick">Heavy engineering. Built around your challenge.</span>
                  <h1 class="hc-h1" style="margin-top:22px;max-width:820px">
                    Engineered for<br />the world's toughest<br />challenges.</h1>
                  <p class="hc-p" style="margin-top:22px;max-width:520px">
                    Custom-built heavy machinery and industrial equipment
                    engineered for demanding applications worldwide.</p>
                  <div style="display:flex;gap:14px;margin-top:34px">
                    <el-button class="hc-btn solid">Explore solutions<i>→</i></el-button>
                    <el-button class="hc-btn ghost">Start a project</el-button>
                  </div>
                </div></div>
              </section>

              <!-- 02 简介 -->
              <section class="hc-about">
                <div class="hc-about-l"><div class="hc-w">
                  <span class="hc-kick">About TZME</span>
                  <h2 class="hc-h2" style="margin-top:18px">Engineering<br />without limits.</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:520px">
                    TZME delivers engineered equipment and customised industrial solutions
                    for some of the world's most demanding operating environments.</p>
                  <div class="hc-band" style="margin-top:52px">
                    <div><div class="hc-stat">20<u>+</u></div>
                      <div class="hc-stat-cap">Years of experience</div></div>
                    <div><div class="hc-stat">Global</div>
                      <div class="hc-stat-cap">Project capability</div></div>
                    <div><div class="hc-stat">End-to-end</div>
                      <div class="hc-stat-cap">Engineering &amp; manufacturing</div></div>
                  </div>
                </div></div>
                <div class="hc-about-r"><img src="/assets/rnd-2.jpg" alt="" /></div>
              </section>

              <!-- 03 服务分类 -->
              <section class="hc-sec">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">Our solutions</span>
                      <h2 class="hc-h2" style="margin-top:18px">What we engineer</h2>
                    </div>
                    <span class="hc-lnk">All solutions<i>→</i></span>
                  </div>
                  <div class="hc-cards">
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">01</span>
                    <h3>Material handling</h3>
                    <p>Moving more. Moving smarter.</p>
                    <span class="go">Explore<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-mining-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">02</span>
                    <h3>Mining</h3>
                    <p>Built for extreme conditions.</p>
                    <span class="go">Explore<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-port-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">03</span>
                    <h3>Ports &amp; terminals</h3>
                    <p>Engineered for global trade.</p>
                    <span class="go">Explore<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-metal-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">04</span>
                    <h3>Metallurgy</h3>
                    <p>Precision built for heavy industry.</p>
                    <span class="go">Explore<i>→</i></span>
                  </div>
                </a>
                <a class="hc-card">
                  <div class="im"><img src="/assets/p-bridge-1.jpg" alt="" /></div>
                  <div class="bd">
                    <span class="no">05</span>
                    <h3>Infrastructure</h3>
                    <p>Engineering at scale.</p>
                    <span class="go">Explore<i>→</i></span>
                  </div>
                </a>
                  </div>
                </div>
              </section>

              <!-- 04 行业 -->
              <section id="industries" class="hc-ind-sec">
                <div class="hc-bleed"><img src="/assets/p-mining-4.jpg" alt="" /></div>
                <span class="hc-scrim"></span>
                <div class="hc-ind-in">
                  <div class="hc-ind-grid">
                    <div>
                      <span class="hc-kick">Industries</span>
                      <h2 class="hc-h2" style="margin-top:18px;color:#fff">Engineered for<br />your industry</h2>
                      <p class="hc-p" style="margin-top:20px;max-width:420px;color:var(--txt-2)">
                        We understand the unique challenges of your industry and deliver
                        solutions that keep your operations moving.</p>
                      <div style="margin-top:30px"><span class="hc-lnk">Explore all industries<i>→</i></span></div>
                    </div>
                    <div class="hc-ind">
                  <div><span class="ic"></span>
                    <div><b>Mining</b><u>Mining &amp; bulk materials</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>Ports</b><u>Ports &amp; terminals</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>Metallurgy</b><u>Steel &amp; metallurgy</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>Energy</b><u>Energy &amp; industrial infrastructure</u></div></div>
                  <div><span class="ic"></span>
                    <div><b>Construction</b><u>Construction &amp; heavy infrastructure</u></div></div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 05 流程 -->
              <section id="capabilities" class="hc-sec hc-light hc-cap">
                <div class="hc-cap-bg"><img src="/assets/hero-03.jpg" alt="" /></div>
                <div class="hc-w hc-cap-in">
                  <span class="hc-kick">Our capabilities</span>
                  <h2 class="hc-h2" style="margin-top:18px">From concept<br />to reality.</h2>
                  <p class="hc-p" style="margin-top:20px;max-width:440px">
                    From initial concept to final commissioning, our engineering and
                    manufacturing capabilities are built around the specific
                    requirements of every project.</p>
                  <div class="hc-steps">
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">01</div>
                  <div class="lb">Concept</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">02</div>
                  <div class="lb">Engineering</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">03</div>
                  <div class="lb">Design</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">04</div>
                  <div class="lb">Fabrication</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">05</div>
                  <div class="lb">Assembly</div>
                </div>
                <div>
                  <span class="ic"><i></i></span>
                  <div class="no">06</div>
                  <div class="lb">Delivery</div>
                </div>
                  </div>
                </div>
              </section>

              <!-- 06 制造能力 -->
              <section class="hc-sec hc-deep">
                <div class="hc-w hc-scale">
                  <div>
                    <span class="hc-kick">Manufacturing</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">Built for scale.</h2>
                    <p class="hc-p" style="margin-top:20px;max-width:420px">
                      Large-scale engineering requires more than design.
                      It requires manufacturing capability, precision and control.</p>
                    <div style="margin-top:30px"><el-button class="hc-btn ghost">Our facilities<i>→</i></el-button></div>
                  </div>
                  <div class="hc-tiles">
                <div class="hc-tile"><img src="/assets/rnd-2.jpg" alt="" />
                  <span class="lb">Large-scale fabrication</span></div>
                <div class="hc-tile"><img src="/assets/rnd-1.jpg" alt="" />
                  <span class="lb">3D design &amp; simulation</span></div>
                <div class="hc-tile"><img src="/assets/p-metal-1.jpg" alt="" />
                  <span class="lb">Welding &amp; NDT</span></div>
                <div class="hc-tile"><img src="/assets/p-port-2.png" alt="" />
                  <span class="lb">Assembly &amp; testing</span></div>
                  </div>
                </div>
              </section>

              <!-- 07 案例 -->
              <section id="projects" class="hc-sec hc-white">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">Selected projects</span>
                      <h2 class="hc-h2" style="margin-top:18px">Real projects. Lasting value.</h2>
                    </div>
                    <span class="hc-lnk">View all projects<i>→</i></span>
                  </div>
                  <div class="hc-proj">
                <div class="c">
                  <div class="im"><img src="/assets/p-port-1.jpg" alt="" /></div>
                  <div class="bd">
                    <h3>Port material handling system</h3>
                    <div class="tg"><span class="hc-tag l">Port infrastructure</span><span class="hc-tag l">Chile</span></div>
                    <div class="meta">
                      <div><b>Capacity</b><span>3,000 t/h</span></div>
                      <div><b>Technology</b><span>Stacker reclaimer</span></div>
                      <div><b>Scope</b><span>EP + MC</span></div>
                    </div>
                  </div>
                </div>
                <div class="c">
                  <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                  <div class="bd">
                    <h3>Mining material handling</h3>
                    <div class="tg"><span class="hc-tag l">Mining industry</span><span class="hc-tag l">Australia</span></div>
                    <div class="meta">
                      <div><b>Capacity</b><span>5,000 t/h</span></div>
                      <div><b>Technology</b><span>Belt conveyor</span></div>
                      <div><b>Scope</b><span>EP + MC</span></div>
                    </div>
                  </div>
                </div>
                <div class="c">
                  <div class="im"><img src="/assets/p-metal-1.jpg" alt="" /></div>
                  <div class="bd">
                    <h3>Heavy industrial equipment</h3>
                    <div class="tg"><span class="hc-tag l">Metallurgy</span><span class="hc-tag l">Middle East</span></div>
                    <div class="meta">
                      <div><b>Capacity</b><span>1,200 t/h</span></div>
                      <div><b>Technology</b><span>Blast furnace eq.</span></div>
                      <div><b>Scope</b><span>EP + MC</span></div>
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              </section>

              <!-- 08 全球 -->
              <section class="hc-sec">
                <div class="hc-w hc-global">
                  <div>
                    <span class="hc-kick">Global</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">
                      Engineered in China.<br />Built for the world.</h2>
                    <p class="hc-p" style="margin-top:20px;max-width:520px">
                      Working with industrial customers and partners across international markets.</p>
                    <div class="hc-map" style="margin-top:34px">
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
                    <div style="padding-top:26px"><el-button class="hc-btn ghost sm">Our global reach<i>→</i></el-button></div>
                  </div>
                </div>
              </section>

              <!-- 09 询价 -->
              <section class="hc-cta">
                <div class="hc-bleed"><img src="/assets/video-poster.jpg" alt="" /></div>
                <span class="hc-scrim"></span>
                <div class="hc-w hc-cta-in">
                  <div>
                    <span class="hc-kick">Get in touch</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff">
                      Have a challenge<br />that needs engineering?</h2>
                    <p class="hc-p" style="margin-top:20px;max-width:420px">
                      Tell us what you're trying to build, move or solve.</p>
                    <div style="margin-top:30px"><el-button class="hc-btn solid">Start a project<i>→</i></el-button></div>
                    <div class="hc-cinfo">
                      <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>tzme@tzme.net</div>
                      <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 5h4l2 5-2.5 1.5a12 12 0 0 0 5 5L14 14l5 2v4a15 15 0 0 1-15-15Z"/></svg>+86 22 2521 4991</div>
                    </div>
                  </div>
                  <div class="hc-form">
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 16V6m0 0L8.5 9.5M12 6l3.5 3.5M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>
                      <div>
                        <div style="font-size:12px;color:var(--txt)">Drag and drop, or click to upload</div>
                        <div style="font-size:10.5px;color:var(--txt-3);margin-top:4px">
                          Max 20 MB · PDF · DWG · XLS · JPG · PNG</div>
                      </div>
                    </div>
                    <div style="display:flex;justify-content:flex-end">
                      <el-button class="hc-btn solid">Send inquiry<i>→</i></el-button>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 10 页脚 -->
              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">Heavy engineering. Built around your challenge.</span>
                  <nav class="hc-foot-nav">
                    <a>Solutions</a><a>Industries</a><a>Capabilities</a>
                    <a>Projects</a><a>About TZME</a><a>Insights</a>
                  </nav>
                  <span class="hc-lang" style="color:var(--txt-2)"><button type="button" class="hc-lang-option" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button> | <button type="button" class="hc-lang-option" :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中</button></span>
                  <span class="hc-soc"><span>in</span><span>▶</span><span>✕</span></span>
                </div>
                <div class="hc-foot-bot">
                  <span>© 2026 TZME. All rights reserved.</span>
                  <span>Privacy policy &nbsp;·&nbsp; Terms of use &nbsp;·&nbsp;
                    No.139 Xiamen Road, Binhai New Area, Tanggu, Tianjin 300459, China</span>
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
