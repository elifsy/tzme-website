<script setup>
import { ref } from 'vue'
import { useDesignPage } from '../composables/useDesignPage.js'
const page = ref(null)
const { drawerOpen, goTo, menuItems, locale, setLocale } = useDesignPage('hc-products', page)
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

              <section class="hc-sec" style="padding:72px 0 60px">
                <div class="hc-w" style="display:grid;grid-template-columns:1fr 380px;gap:80px;
                     align-items:flex-end">
                  <div>
                    <span class="hc-kick">Solutions / 31 products in 8 categories</span>
                    <h2 class="hc-h2" style="margin-top:18px;color:#fff;font-size:52px">
                      What we engineer</h2>
                  </div>
                  <p class="hc-p">
                    Every unit is engineered to order — capacity, geometry and drive
                    configuration are set per project, not selected from a catalogue.</p>
                </div>
              </section>

              <section style="border-top:1px solid var(--line-d2)">
                <div class="hc-w" style="padding:56px 0 96px">
                  <div class="hc-cards" style="grid-template-columns:repeat(4,1fr)">
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-mining-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">01</span>
                      <h3>Mining machinery</h3>
                      <p>Excavators, crushers, spreaders.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">02</span>
                      <h3>Material handling</h3>
                      <p>Stackers and reclaimers.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-convey-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">03</span>
                      <h3>Conveying</h3>
                      <p>Belt, tubular and pipe conveyors.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-port-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">04</span>
                      <h3>Ports &amp; terminals</h3>
                      <p>Ship loaders and unloaders.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-bridge-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">05</span>
                      <h3>Bridge building</h3>
                      <p>Launching girders, MSS travellers.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-metal-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">06</span>
                      <h3>Metallurgy</h3>
                      <p>Ladle turrets, furnace structures.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-env-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">07</span>
                      <h3>Environment</h3>
                      <p>Waste handling, flue-gas ducting.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  <a class="hc-card">
                    <div class="im"><img src="/assets/p-tour-1.jpg" alt="" /></div>
                    <div class="bd">
                      <span class="no">08</span>
                      <h3>Tourism facilities</h3>
                      <p>Ferris wheels, ropeways.</p>
                      <span class="go">Explore<i>→</i></span>
                    </div>
                  </a>
                  </div>
                </div>
              </section>

              <section class="hc-sec hc-white">
                <div class="hc-w">
                  <div class="hc-shead">
                    <div class="l">
                      <span class="hc-kick">Selected equipment</span>
                      <h2 class="hc-h2" style="margin-top:18px">Typical configurations</h2>
                    </div>
                    <span class="hc-lnk">Full product list<i>→</i></span>
                  </div>
                  <div class="hc-proj">
                  <div class="c">
                    <div class="im"><img src="/assets/p-mining-2.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>Stacker-reclaimer</h3>
                      <div class="tg"><span class="hc-tag l">Mining</span><span class="hc-tag l">Australia</span></div>
                      <div class="meta">
                        <div><b>Capacity</b><span>6,000 t/h</span></div>
                        <div><b>Technology</b><span>Rail mounted</span></div>
                        <div><b>Scope</b><span>EP + MC</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="c">
                    <div class="im"><img src="/assets/p-convey-2.jpg" alt="" /></div>
                    <div class="bd">
                      <h3>Pipe conveyor system</h3>
                      <div class="tg"><span class="hc-tag l">Conveying</span><span class="hc-tag l">Chile</span></div>
                      <div class="meta">
                        <div><b>Capacity</b><span>600 t/h</span></div>
                        <div><b>Technology</b><span>Tubular belt</span></div>
                        <div><b>Scope</b><span>EP + MC</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="c">
                    <div class="im"><img src="/assets/p-port-2.png" alt="" /></div>
                    <div class="bd">
                      <h3>Travelling ship unloader</h3>
                      <div class="tg"><span class="hc-tag l">Port</span><span class="hc-tag l">India</span></div>
                      <div class="meta">
                        <div><b>Capacity</b><span>1,800 t/h</span></div>
                        <div><b>Technology</b><span>Grab type</span></div>
                        <div><b>Scope</b><span>EP + MC</span></div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </section>

              <footer class="hc-foot">
                <div class="hc-foot-in">
                  <span class="hc-logo" style="font-size:19px"><i></i>TZME</span>
                  <span class="tag">Solutions · 8 categories · 31 products</span>
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
