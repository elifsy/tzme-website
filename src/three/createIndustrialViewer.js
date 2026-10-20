import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TrackballControls } from 'three/addons/controls/TrackballControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildIndustrialScene, disposeObject } from './industrialScene.js'
import { createIndustrialRegions } from './industrialRegions.js'
import { createIndustrialMotion } from './industrialMotion.js'

const V = value => new THREE.Vector3(...value)

export function createIndustrialViewer(host, callbacks = {}, options = {}) {
  const doc = host.ownerDocument, win = doc.defaultView
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)')
  const compact = win.matchMedia('(max-width: 700px)').matches
  const renderer = new THREE.WebGLRenderer({ canvas: doc.createElement('canvas'), alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, compact ? 1.5 : 1.7))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = .98
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  const canvas = renderer.domElement
  canvas.tabIndex = 0; canvas.setAttribute('aria-label', '行业装备全景：拖动环绕，滚轮或双指缩放；设备特写支持自由旋转，Esc 复位。')
  canvas.dataset.renderer = 'webgl2'
  canvas.dataset.layout = 'industrial-island'
  host.append(canvas)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(37, 1, .08, 360)
  const industrial = buildIndustrialScene(options.industries, compact, doc)
  const motion = createIndustrialMotion(industrial.assemblies)
  const regions = createIndustrialRegions(industrial.assemblies, industrial.landscape)
  let overviewPosition = [40, 50, 58], overviewTarget = [0, 2, 0]
  camera.position.fromArray(overviewPosition)
  scene.add(industrial.world)
  scene.add(new THREE.HemisphereLight(0xf1f8ff, 0x879ca7, 1.3))
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.5)
  sun.position.set(-24, 48, 34); sun.castShadow = true
  sun.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048)
  sun.shadow.camera.left = -49; sun.shadow.camera.right = 49; sun.shadow.camera.top = 44; sun.shadow.camera.bottom = -44
  sun.shadow.camera.near = .5; sun.shadow.camera.far = 150; sun.shadow.bias = -.00025; sun.shadow.normalBias = .08
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0xd7eafb, .8); fill.position.set(25, 18, -28); scene.add(fill)
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
  const environment = pmrem.fromScene(room, .04)
  scene.environment = environment.texture
  scene.environmentIntensity = .7
  room.dispose(); pmrem.dispose()
  const orbit = new OrbitControls(camera, canvas), trackball = new TrackballControls(camera, canvas)
  orbit.target.fromArray(overviewTarget); orbit.enableDamping = true; orbit.dampingFactor = .085
  orbit.minDistance = 2; orbit.maxDistance = 250; orbit.minPolarAngle = .03; orbit.maxPolarAngle = Math.PI - .03
  orbit.rotateSpeed = .65; orbit.panSpeed = .7; orbit.zoomSpeed = .85
  trackball.enabled = false; trackball.rotateSpeed = 2.4; trackball.zoomSpeed = .9; trackball.panSpeed = .5
  trackball.staticMoving = true; trackball.minDistance = 1; trackball.maxDistance = 110
  const projected = new THREE.Vector3(), modelRequests = new Map(), modelUrls = new Map()
  const initialSelection = options.industries?.[0]?.id || ''
  let mode = 'orbit', selected = initialSelection, disposed = false, inView = true, frame = 0
  let tween = null, pointerStart = null, isOverview = true, hovered = '', hoverPoint = null, anchorsDirty = true
  let hoverExitTimer = 0
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2()
  const state = () => ({ mode, selected, overview: isOverview, transitioning: Boolean(tween), hovered })
  const notify = () => callbacks.state?.(state())
  const activeControls = () => mode === 'inspect' ? trackball : orbit
  function invalidate() { if (!disposed && !frame && inView && !doc.hidden) frame = win.requestAnimationFrame(render) }
  function cameraChanged() { anchorsDirty = true; invalidate() }
  function cancelHoverExit() { if (hoverExitTimer) { win.clearTimeout(hoverExitTimer); hoverExitTimer = 0 } }
  function commitHover(next) {
    if (hovered === next) return
    hovered = motion.hover(next)
    canvas.dataset.hoveredIndustry = hovered
    canvas.style.cursor = hovered ? 'pointer' : 'grab'
    notify(); invalidate()
  }
  function hover(key = '') {
    if (disposed) return
    const next = key && !tween && !pointerStart && inView && !doc.hidden && industrial.assemblies[key]?.group.visible ? key : ''
    if (!next && hovered) {
      // Bridge brief label-to-model gaps; actual drag/reset/disposal clears now.
      if (!hoverExitTimer) hoverExitTimer = win.setTimeout(() => { hoverExitTimer = 0; commitHover('') }, 100)
      return
    }
    cancelHoverExit(); commitHover(next)
  }
  function clearHover(immediate = false) {
    hoverPoint = null
    if (immediate) { cancelHoverExit(); commitHover(''); motion.reset(); invalidate() }
    else hover('')
  }
  function industryAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect()
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1)
    ray.setFromCamera(pointer, camera)
    return regions.pick(ray, hovered)
  }
  function reportAnchors() {
    const result = {}
    for (const [key, assembly] of Object.entries(industrial.assemblies)) {
      assembly.anchor.getWorldPosition(projected); projected.project(camera)
      result[key] = { x: (projected.x + 1) * 50, y: (1 - projected.y) * 50,
        visible: assembly.group.visible && projected.z >= -1 && projected.z <= 1 && Math.abs(projected.x) < .98 && Math.abs(projected.y) < .98 }
    }
    callbacks.anchors?.(result, { width: host.clientWidth, height: host.clientHeight })
  }
  function setControls() {
    orbit.enabled = mode === 'orbit'; trackball.enabled = mode === 'inspect'
    // The close view needs fewer physical pixels while HTML labels stay sharp.
    const ratio = Math.min(win.devicePixelRatio || 1, mode === 'inspect' ? 1.25 : compact ? 1.5 : 1.7)
    if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio)
    canvas.style.cursor = 'grab'
  }
  function showAll() {
    for (const assembly of Object.values(industrial.assemblies)) { assembly.group.visible = true; assembly.environment.visible = true }
    industrial.landscape.visible = true
    renderer.shadowMap.needsUpdate = true
  }
  function transition(position, target, milliseconds = 1000) {
    clearHover(true)
    tween = { from: camera.position.clone(), targetFrom: activeControls().target.clone(), to: V(position), targetTo: V(target), start: win.performance.now(), duration: reduced.matches ? 0 : milliseconds }
    notify(); invalidate()
  }
  function reset(animate = true) {
    clearHover(true)
    tween = null; mode = 'orbit'; selected = initialSelection; isOverview = true; pointerStart = null
    showAll(); camera.up.set(0, 1, 0)
    // Flush any residual orbit/trackball movement before restoring the saved view.
    orbit.enableDamping = false; orbit.update(); orbit.enableDamping = true
    orbit.target.fromArray(overviewTarget); trackball.target.fromArray(overviewTarget)
    setControls(); transition(overviewPosition, overviewTarget, animate ? 650 : 0); notify()
  }
  function focus(key) {
    const assembly = industrial.assemblies[key]
    if (!assembly) return reset()
    clearHover(true)
    selected = key; mode = 'orbit'; isOverview = false; showAll(); camera.up.set(0, 1, 0); setControls()
    const bounds = new THREE.Box3().setFromObject(assembly.equipment), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3())
    const distance = Math.max(size.x, size.y, size.z) * 2.15
    transition(center.clone().add(new THREE.Vector3(distance * .7, distance * .57, distance)).toArray(), center.toArray()); notify()
  }
  function inspect(key = selected) {
    const assembly = industrial.assemblies[key]
    if (!assembly) return
    clearHover(true)
    tween = null; selected = key; mode = 'inspect'; isOverview = false; camera.up.set(0, 1, 0)
    for (const entry of Object.values(industrial.assemblies)) { entry.group.visible = entry.key === key; entry.environment.visible = false }
    industrial.landscape.visible = false
    renderer.shadowMap.needsUpdate = true
    const target = assembly.custom || assembly.equipment
    const bounds = new THREE.Box3().setFromObject(target), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3())
    const distance = Math.max(size.length() * 1.25, 6)
    trackball.target.copy(center); setControls()
    transition(center.clone().add(new THREE.Vector3(distance * .55, distance * .25, distance * .85)).toArray(), center.toArray(), 850); notify()
  }
  function zoom(factor) {
    clearHover(true)
    tween = null; isOverview = false
    const control = activeControls(), offset = camera.position.clone().sub(control.target)
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, control.minDistance, control.maxDistance))
    camera.position.copy(control.target).add(offset); control.update(); invalidate()
  }
  function keydown(event) {
    if (event.target !== canvas) return
    if (event.code === 'Escape') { event.preventDefault(); callbacks.reset?.(); reset(); return }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      clearHover(true)
      event.preventDefault(); tween = null; isOverview = false
      const control = activeControls(), offset = camera.position.clone().sub(control.target)
      const rotation = new THREE.Quaternion().setFromAxisAngle(event.code.includes('Left') || event.code.includes('Right') ? Y_AXIS : new THREE.Vector3().crossVectors(offset, camera.up).normalize(), event.code.includes('Left') || event.code.includes('Up') ? .12 : -.12)
      camera.position.copy(control.target).add(offset.applyQuaternion(rotation)); camera.lookAt(control.target); control.update(); invalidate()
    } else if (event.code === 'Equal' || event.code === 'NumpadAdd') { event.preventDefault(); zoom(.85) }
    else if (event.code === 'Minus' || event.code === 'NumpadSubtract') { event.preventDefault(); zoom(1.15) }
  }
  const Y_AXIS = new THREE.Vector3(0, 1, 0)
  function pointerdown(event) {
    clearHover(true)
    canvas.focus({ preventScroll: true }); pointerStart = [event.clientX, event.clientY]
    canvas.style.cursor = 'grabbing'
  }
  function pointermove(event) {
    // TrackballControls stores pointer deltas until update(). Unlike Orbit,
    // it does not request a frame itself during mouse/touch dragging.
    if (mode === 'inspect') invalidate()
    if (event.pointerType === 'touch' || pointerStart || event.buttons || tween) return
    hoverPoint = [event.clientX, event.clientY]; invalidate()
  }
  function pointerleave() { clearHover() }
  function pointercancel() { pointerStart = null; clearHover(true); canvas.style.cursor = 'grab' }
  function pointerup(event) {
    const start = pointerStart; pointerStart = null
    canvas.style.cursor = 'grab'
    if (!start || Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 5) return
    const key = industryAt(event.clientX, event.clientY)
    if (key) callbacks.select?.(key)
  }
  function onControlStart() { clearHover(true); tween = null; isOverview = false; notify(); invalidate() }
  function contextLost(event) { event.preventDefault(); if (!disposed) callbacks.failure?.('context-lost') }
  function visibility() { if (doc.hidden) clearHover(true); else invalidate() }
  function motionPreferenceChanged() {
    motion.reset(); motion.hover(hovered); invalidate()
  }
  function fitOverview() {
    const bounds = new THREE.Box3(), points = []
    industrial.world.updateMatrixWorld(true)
    for (const point of industrial.framingPoints) points.push(point.clone().applyMatrix4(industrial.world.matrixWorld))
    for (const assembly of Object.values(industrial.assemblies)) {
      // Rotated world-space boxes contain large empty corners. Frame sampled
      // equipment geometry instead so the continuous island fills its hero.
      assembly.group.traverse(object => {
        const positions = object.geometry?.attributes.position
        if (!positions || !object.visible) return
        const stride = Math.max(1, Math.floor(positions.count / 240))
        for (let index = 0; index < positions.count; index += stride) points.push(new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld))
      })
    }
    points.forEach(point => bounds.expandByPoint(point))
    if (bounds.isEmpty()) return
    const smallViewport = win.matchMedia('(max-width: 700px)').matches
    const center = bounds.getCenter(new THREE.Vector3()), direction = V([.57, smallViewport ? 1.14 : .84, .82]).normalize()
    const right = new THREE.Vector3(direction.z, 0, -direction.x).normalize(), up = new THREE.Vector3().crossVectors(direction, right).normalize()
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect
    let distance = 0
    for (const point of points) {
      const corner = point.clone().sub(center), depth = corner.dot(direction)
      distance = Math.max(distance, Math.abs(corner.dot(right)) / (tanH * .91) + depth, Math.abs(corner.dot(up)) / (tanV * .84) + depth)
    }
    // Desktop art direction matches the selected wide island composition;
    // mobile keeps the complete coastline inside its narrower viewport.
    const compositionTarget = center.clone()
    compositionTarget.y -= smallViewport ? 1.4 : 4.3
    overviewTarget = compositionTarget.toArray(); overviewPosition = compositionTarget.addScaledVector(direction, distance * (smallViewport ? 1 : .85)).toArray()
  }
  function resize() {
    if (disposed) return
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight)
    camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); trackball.handleResize()
    clearHover(true); fitOverview(); anchorsDirty = true; if (isOverview) reset(false); else invalidate()
  }
  function render(now) {
    frame = 0
    if (disposed || !inView || doc.hidden) return
    if (tween) {
      anchorsDirty = true
      const t = tween.duration ? Math.min((now - tween.start) / tween.duration, 1) : 1, ease = t * t * (3 - 2 * t)
      camera.position.lerpVectors(tween.from, tween.to, ease); activeControls().target.lerpVectors(tween.targetFrom, tween.targetTo, ease)
      camera.lookAt(activeControls().target); if (t >= 1) { tween = null; notify() }
    }
    activeControls().update()
    if (hoverPoint) { const point = hoverPoint; hoverPoint = null; hover(industryAt(...point)) }
    const animation = motion.update(now, reduced.matches)
    // Reuse the equipment's resting projection during small mechanical motions.
    // Shadow maps refresh on layout/model/mode changes, never on every hover frame.
    renderer.render(scene, camera)
    if (anchorsDirty) { reportAnchors(); anchorsDirty = false }
    if (tween || animation.running) invalidate()
  }
  const resizeObserver = new win.ResizeObserver(resize); resizeObserver.observe(host)
  const visibilityObserver = new win.IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); if (inView) invalidate(); else clearHover(true) }, { threshold: .01 })
  visibilityObserver.observe(host)
  canvas.addEventListener('keydown', keydown)
  canvas.addEventListener('pointerdown', pointerdown); canvas.addEventListener('pointermove', pointermove); canvas.addEventListener('pointerup', pointerup)
  canvas.addEventListener('pointerleave', pointerleave); canvas.addEventListener('pointercancel', pointercancel)
  canvas.addEventListener('webglcontextlost', contextLost); doc.addEventListener('visibilitychange', visibility)
  reduced.addEventListener('change', motionPreferenceChanged)
  orbit.addEventListener('start', onControlStart); orbit.addEventListener('change', cameraChanged); trackball.addEventListener('start', onControlStart); trackball.addEventListener('change', cameraChanged)
  orbit.update(); resize(); notify()

  async function replaceModels(urls = {}) {
    for (const [key, assembly] of Object.entries(industrial.assemblies)) {
      const url = urls[key] || ''
      if (url === (modelUrls.get(key) || '')) continue
      clearHover(true)
      motion.forget(key)
      modelUrls.set(key, url); modelRequests.get(key)?.abort()
      renderer.shadowMap.needsUpdate = true
      if (assembly.custom) { assembly.group.remove(assembly.custom); disposeObject(assembly.custom); assembly.custom = null }
      assembly.original.visible = true
      regions.refresh(key)
      if (!url) { invalidate(); continue }
      if (!/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.glb$/.test(url) && !/^\/api\/uploads\/models\/[0-9a-f-]{36}\.glb$/.test(url)) { callbacks.modelError?.(key); continue }
      const request = new AbortController(); modelRequests.set(key, request)
      try {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
        const response = await fetch(url, { signal: request.signal }); if (!response.ok) throw Error('Model could not be loaded')
        const bytes = await response.arrayBuffer()
        if (bytes.byteLength > 40 * 1024 * 1024) throw Error('Model exceeds 40 MB')
        const manager = new THREE.LoadingManager()
        manager.setURLModifier(resource => { if (resource.startsWith('blob:') || resource.startsWith('data:')) return resource; throw Error('Use a self-contained GLB model') })
        const loaded = await new GLTFLoader(manager).parseAsync(bytes, '')
        if (disposed || request.signal.aborted) { disposeObject(loaded.scene); continue }
        clearHover(true); motion.forget(key)
        // Normalize in equipment-local space: the island and equipment groups
        // have different orientations, which would inflate world-space bounds.
        const originalSize = new THREE.Box3().setFromObject(assembly.original.clone()).getSize(new THREE.Vector3())
        const bounds = new THREE.Box3().setFromObject(loaded.scene), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3())
        const largest = Math.max(size.x, size.y, size.z)
        if (!Number.isFinite(largest) || largest < .00001) { disposeObject(loaded.scene); throw Error('Empty model') }
        const scale = Math.max(originalSize.x, originalSize.y, originalSize.z) / largest
        const wrapper = new THREE.Group(); wrapper.position.copy(assembly.original.position)
        loaded.scene.scale.multiplyScalar(scale); loaded.scene.position.add(new THREE.Vector3(-center.x * scale, -bounds.min.y * scale, -center.z * scale))
        loaded.scene.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true } })
        wrapper.add(loaded.scene); assembly.group.add(wrapper); assembly.custom = wrapper; assembly.original.visible = false
        regions.refresh(key)
        renderer.shadowMap.needsUpdate = true
        if (mode === 'inspect' && selected === key) inspect(key)
        callbacks.modelLoaded?.(key); invalidate()
      } catch (error) { if (!disposed && error.name !== 'AbortError') callbacks.modelError?.(key) }
    }
  }
  return {
    canvas, reset, focus, inspect, hover, state, replaceModels,
    dispose() {
      disposed = true; if (frame) win.cancelAnimationFrame(frame)
      cancelHoverExit()
      modelRequests.forEach(request => request.abort()); resizeObserver.disconnect(); visibilityObserver.disconnect()
      orbit.dispose(); trackball.dispose()
      canvas.removeEventListener('keydown', keydown)
      canvas.removeEventListener('pointerdown', pointerdown); canvas.removeEventListener('pointermove', pointermove); canvas.removeEventListener('pointerup', pointerup)
      canvas.removeEventListener('pointerleave', pointerleave); canvas.removeEventListener('pointercancel', pointercancel)
      canvas.removeEventListener('webglcontextlost', contextLost); doc.removeEventListener('visibilitychange', visibility)
      reduced.removeEventListener('change', motionPreferenceChanged)
      motion.dispose(); regions.dispose(); sun.shadow.map?.dispose(); environment.dispose(); disposeObject(scene); renderer.dispose(); renderer.forceContextLoss(); canvas.remove()
    },
  }
}
