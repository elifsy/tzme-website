<script setup>
// Keep equipment contours as vectors so the small mark stays sharp on phones.
const cranes = [
  { x: 614, y: 307, scaleY: 1, facing: 1 },
  { x: 758, y: 301, scaleY: 151 / 145, facing: -1 },
];

function trussBeam(x1, y1, x2, y2, thickness, divisions) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const nx = ((-(y2 - y1) / length) * thickness) / 2;
  const ny = (((x2 - x1) / length) * thickness) / 2;
  const point = (fraction, side) =>
    `${(x1 + (x2 - x1) * fraction + nx * side).toFixed(2)} ${(y1 + (y2 - y1) * fraction + ny * side).toFixed(2)}`;
  return {
    outline: `M ${point(0, 1)} L ${point(1, 1)} L ${point(1, -1)} L ${point(0, -1)} Z`,
    braces: Array.from(
      { length: divisions + 1 },
      (_, index) =>
        `${index ? "L" : "M"} ${point(index / divisions, index % 2 ? -1 : 1)}`,
    ).join(" "),
  };
}

const booms = [
  trussBeam(619, 315, 687, 400, 8, 6),
  trussBeam(754, 309, 687, 400, 8, 6),
];
const platforms = [
  { name: "top", x: 800, y: 333, end: 935 },
  { name: "middle", x: 800, y: 386, end: 931 },
  { name: "bottom", x: 813, y: 429, end: 935 },
].map((platform) => ({
  ...platform,
  ...trussBeam(
    platform.x,
    platform.y + 5.5,
    platform.end,
    platform.y + 5.5,
    11,
    8,
  ),
}));
</script>

<template>
  <g
    class="port-equipment-monogram"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <g class="equipment-letter-m">
      <g
        v-for="(crane, index) in cranes"
        :key="index"
        class="equipment-crane"
        :transform="`translate(${crane.x} ${crane.y}) scale(${crane.facing} ${crane.scaleY})`"
      >
        <path
          class="equipment-body"
          d="M -6 7 H 6 V 81 H -6 Z M -9 0 H 10 V 8 H -9 Z"
        />
        <path
          class="equipment-brace"
          d="M -6 10 6 26 -6 42 6 58 -6 74 M 6 10 -6 26 6 42 -6 58 6 74"
        />
        <path
          class="equipment-body"
          d="M -6 80 -27 142 H -17 L 2 86 Z M 4 80 27 142 H 17 L -2 86 Z"
        />
        <path
          class="equipment-brace"
          d="M -9 91 -1 99 -16 108 -8 118 -23 132 -17 140 M 9 91 1 99 16 108 8 118 23 132 17 140 M -17 112 H 17 M -21 126 H 21"
        />
        <path
          class="equipment-deck"
          d="M -30 142 H -14 V 145 H -30 Z M 14 142 H 30 V 145 H 14 Z"
        />
        <path
          class="equipment-cabin"
          d="M -17 66 H 25 V 70 H -17 Z M -12 70 H 22 V 84 H -12 Z M -15 84 H 25 V 88 H -15 Z"
        />
        <path
          class="equipment-brace"
          d="M -8 74 H 0 V 79 H -8 Z M 4 74 H 12 V 79 H 4 Z"
        />
        <path
          class="equipment-fine-detail"
          d="M -17 66 V 61 H 25 V 66 M -9 61 V 66 M 1 61 V 66 M 13 61 V 66 M -3 2 V 6 M 3 2 V 6 M -4 91 V 105 M 3 99 V 110"
        />
      </g>
      <g v-for="(boom, index) in booms" :key="index" class="equipment-boom">
        <path class="equipment-body" :d="boom.outline" />
        <path class="equipment-brace" :d="boom.braces" />
      </g>
      <circle cx="619" cy="315" r="3" />
      <circle cx="754" cy="309" r="3" />
      <circle cx="687" cy="400" r="3.2" />
      <path
        class="equipment-hoist"
        d="M 687 404 V 422 C 692 422 692 429 687 430 C 683 430 681 426 684 424 M 682 432 H 692 L 696 442 H 678 Z"
      />
    </g>

    <g class="equipment-letter-e">
      <path
        class="equipment-body"
        d="M 813 315 H 834 V 448 H 813 Z M 816 306 H 827 V 315 H 816 Z M 808 448 H 839 V 452 H 808 Z"
      />
      <path
        class="equipment-brace"
        d="M 813 318 834 340 813 362 834 384 813 406 834 428 813 448 M 834 318 813 340 834 362 813 384 834 406 813 428 834 448"
      />
      <path class="equipment-support" d="M 834 369 910 344 M 834 419 904 397" />
      <g
        v-for="platform in platforms"
        :key="platform.name"
        class="equipment-e-arm"
        :class="`equipment-e-arm-${platform.name}`"
      >
        <path class="equipment-body" :d="platform.outline" />
        <path class="equipment-brace" :d="platform.braces" />
        <path
          class="equipment-fine-detail"
          :d="`M ${platform.x} ${platform.y} v -4 H ${platform.end - 2} v 4 M ${platform.end - 23} ${platform.y} v -7 h 13 v 7`"
        />
      </g>
      <path class="equipment-cabin" d="M 800 324 H 813 V 333 H 800 Z" />
      <path
        class="equipment-fine-detail"
        d="M 803 327 H 809 V 331 H 803 Z M 819 308 H 824 M 819 311 H 824"
      />
    </g>
  </g>
</template>

<style scoped>
.port-equipment-monogram {
  color: #78a79b;
}
.equipment-body,
.equipment-deck {
  fill: #78a79b;
  fill-opacity: 0.07;
}
.equipment-cabin {
  fill: #78a79b;
  fill-opacity: 0.35;
}
.equipment-brace {
  stroke-width: 1.2;
  opacity: 0.82;
}
.equipment-support {
  stroke-width: 1.5;
}
.equipment-fine-detail {
  stroke-width: 0.85;
  opacity: 0.75;
}
.equipment-hoist {
  fill: #78a79b;
  fill-opacity: 0.28;
  stroke-width: 1.4;
}
@media (max-width: 700px) {
  .port-equipment-monogram {
    stroke-width: 2.6;
  }
  .equipment-fine-detail {
    display: none;
  }
  .equipment-brace {
    stroke-width: 1.35;
    opacity: 0.75;
  }
}
</style>
