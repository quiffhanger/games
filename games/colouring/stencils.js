// Colouring stencils — each is an SVG with regions tagged `data-region`
// so the game logic can click a region and set its fill colour.
//
// Style conventions for every stencil:
//   • viewBox 0 0 400 400
//   • default fill #ffffff (so empty regions are white and clickable)
//   • thick black outlines via a wrapping <g>
//   • each fillable region has a unique data-region id within the SVG
//
// Only include `data-region` on elements you actually want the user to
// be able to fill. Pure stroke-only decorations (mouth lines, whiskers)
// don't need it.

export const STENCILS = [
  {
    id: 'dinosaur',
    name: 'Dinosaur',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path data-region="tail" d="M110 240 Q30 220 20 300 Q55 295 130 260 Z"/>
    <path data-region="body" d="M110 260 Q70 150 170 120 Q270 100 305 170 Q315 230 270 265 Q180 290 110 260 Z"/>
    <path data-region="belly" d="M140 230 Q200 260 270 245 Q285 220 260 200 Q190 195 140 215 Z"/>
    <path data-region="head" d="M265 165 Q340 130 380 175 Q378 205 340 220 Q300 220 270 205 Q260 185 265 165 Z"/>
    <circle data-region="eye" cx="345" cy="172" r="6"/>
    <path data-region="teeth" d="M300 200 L312 212 L322 200 L332 212 L342 200 L344 215 L302 215 Z"/>
    <path data-region="arm" d="M258 200 L275 228 L282 245 L270 245 L260 228 L250 210 Z"/>
    <path data-region="leg-front" d="M170 260 Q160 340 180 370 L215 370 L215 260 Z"/>
    <path data-region="leg-back" d="M240 260 Q230 340 250 370 L285 370 L280 260 Z"/>
  </g>
</svg>`,
  },

  {
    id: 'rocket',
    name: 'Rocket',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path data-region="nose" d="M200 40 L260 160 L140 160 Z"/>
    <rect data-region="body" x="140" y="160" width="120" height="150" rx="8"/>
    <rect data-region="stripe" x="140" y="252" width="120" height="16"/>
    <circle data-region="window" cx="200" cy="210" r="28"/>
    <path data-region="fin-left" d="M140 225 L70 330 L140 305 Z"/>
    <path data-region="fin-right" d="M260 225 L330 330 L260 305 Z"/>
    <path data-region="flame-outer" d="M150 310 Q158 360 178 345 Q186 375 200 355 Q214 375 222 345 Q242 360 250 310 Z"/>
    <path data-region="flame-inner" d="M172 320 Q182 350 200 338 Q218 350 228 320 Z"/>
    <circle data-region="star-1" cx="60" cy="90" r="8"/>
    <circle data-region="star-2" cx="335" cy="120" r="8"/>
    <circle data-region="star-3" cx="70" cy="240" r="6"/>
  </g>
</svg>`,
  },

  {
    id: 'mermaid',
    name: 'Mermaid',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path data-region="hair-back" d="M145 95 Q135 40 205 40 Q275 45 280 105 Q295 170 255 210 L150 210 Q115 170 145 95 Z"/>
    <circle data-region="face" cx="200" cy="125" r="48"/>
    <path data-region="hair-top" d="M160 95 Q200 60 245 95 Q220 85 200 85 Q180 85 160 95 Z"/>
    <circle data-region="eye-l" cx="184" cy="125" r="4"/>
    <circle data-region="eye-r" cx="216" cy="125" r="4"/>
    <path data-region="top" d="M155 185 Q200 205 245 185 L252 230 Q200 250 148 230 Z"/>
    <path data-region="arm-l" d="M150 190 Q110 230 128 270 L144 265 Q128 230 165 205 Z"/>
    <path data-region="arm-r" d="M250 190 Q290 230 272 270 L256 265 Q272 230 235 205 Z"/>
    <path data-region="tail" d="M150 225 Q145 335 200 365 Q255 335 250 225 Z"/>
    <path data-region="scales" d="M165 255 Q185 248 200 255 Q215 248 235 255 M160 285 Q180 278 200 285 Q220 278 240 285 M170 315 Q190 308 200 315 Q210 308 230 315" fill="none" stroke-width="3"/>
    <path data-region="fin-l" d="M200 360 Q140 380 115 395 Q170 380 195 378 Z"/>
    <path data-region="fin-r" d="M200 360 Q260 380 285 395 Q230 380 205 378 Z"/>
  </g>
</svg>`,
  },

  {
    id: 'climber',
    name: 'Rock Climber',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <rect data-region="wall" x="25" y="25" width="350" height="350" rx="14"/>
    <path data-region="crack-1" d="M70 80 L110 130 L95 170" fill="none" stroke-width="3"/>
    <path data-region="crack-2" d="M320 60 L290 110 L315 160" fill="none" stroke-width="3"/>
    <path data-region="crack-3" d="M60 300 L100 340" fill="none" stroke-width="3"/>
    <circle data-region="hold-1" cx="125" cy="90" r="14"/>
    <circle data-region="hold-2" cx="285" cy="115" r="14"/>
    <circle data-region="hold-3" cx="85" cy="210" r="14"/>
    <circle data-region="hold-4" cx="310" cy="240" r="14"/>
    <circle data-region="hold-5" cx="155" cy="330" r="14"/>
    <path data-region="rope" d="M205 150 Q270 90 360 45 L365 60 Q275 105 215 165 Z"/>
    <path data-region="helmet" d="M165 130 Q165 80 205 75 Q250 80 245 130 L245 140 L165 140 Z"/>
    <circle data-region="head" cx="205" cy="140" r="26"/>
    <rect data-region="body" x="180" y="165" width="55" height="80" rx="6"/>
    <path data-region="arm-up" d="M228 170 L275 125 L295 115 L302 128 L285 138 L240 185 Z"/>
    <path data-region="arm-down" d="M182 180 L145 225 L135 240 L150 245 L165 232 L200 200 Z"/>
    <path data-region="leg-l" d="M185 245 L160 330 L182 335 L210 260 Z"/>
    <path data-region="leg-r" d="M230 245 L255 330 L235 335 L205 260 Z"/>
    <rect data-region="shoe-l" x="152" y="330" width="36" height="14" rx="4"/>
    <rect data-region="shoe-r" x="230" y="330" width="36" height="14" rx="4"/>
  </g>
</svg>`,
  },

  {
    id: 'runner',
    name: 'Runner',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path data-region="ponytail" d="M175 110 Q130 130 128 180 Q160 150 190 140 Z"/>
    <circle data-region="head" cx="210" cy="100" r="34"/>
    <path data-region="hair-top" d="M178 85 Q210 50 245 90 Q225 75 210 75 Q190 75 178 85 Z"/>
    <circle data-region="eye" cx="223" cy="100" r="3"/>
    <path data-region="top" d="M180 135 Q210 150 240 135 L248 215 L170 215 Z"/>
    <path data-region="shorts" d="M170 215 L248 215 L252 270 L166 270 Z"/>
    <path data-region="arm-back" d="M175 150 L140 200 L128 235 L145 238 L158 210 L188 170 Z"/>
    <path data-region="arm-forward" d="M240 150 L275 190 L290 205 L298 195 L282 175 L252 145 Z"/>
    <path data-region="leg-forward" d="M220 267 L275 305 L285 345 L268 350 L252 320 L200 285 Z"/>
    <path data-region="leg-back" d="M180 267 L150 330 L130 360 L152 362 L172 338 L200 285 Z"/>
    <path data-region="shoe-forward" d="M258 340 L305 345 L305 360 L250 358 Z"/>
    <path data-region="shoe-back" d="M112 358 L160 352 L165 368 L108 368 Z"/>
  </g>
</svg>`,
  },

  {
    id: 'skater',
    name: 'Skateboarder',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path data-region="helmet" d="M158 100 Q158 55 210 50 Q262 55 262 110 L262 128 L158 128 Z"/>
    <path data-region="face" d="M175 118 Q175 158 210 162 Q245 158 245 118 Z"/>
    <circle data-region="eye" cx="228" cy="135" r="3"/>
    <path data-region="shirt" d="M170 162 Q210 175 250 162 L268 235 L152 235 Z"/>
    <path data-region="pants" d="M152 235 L268 235 L278 305 L142 305 Z"/>
    <path data-region="arm-back" d="M170 175 Q125 200 112 245 L128 252 L145 220 L185 185 Z"/>
    <path data-region="arm-front" d="M252 175 Q295 200 308 235 L292 245 L278 218 L240 190 Z"/>
    <path data-region="shoe-l" d="M145 305 L200 305 L208 325 L137 325 Z"/>
    <path data-region="shoe-r" d="M215 305 L270 305 L280 325 L207 325 Z"/>
    <rect data-region="board" x="85" y="325" width="230" height="18" rx="9"/>
    <circle data-region="wheel-l" cx="130" cy="358" r="14"/>
    <circle data-region="wheel-r" cx="270" cy="358" r="14"/>
  </g>
</svg>`,
  },

  {
    id: 'cat',
    name: 'Cat',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path data-region="tail" d="M285 320 Q360 290 345 205 Q320 250 290 295 Z"/>
    <ellipse data-region="body" cx="200" cy="295" rx="95" ry="65"/>
    <circle data-region="head" cx="200" cy="170" r="75"/>
    <path data-region="ear-l" d="M142 128 L125 60 L185 112 Z"/>
    <path data-region="ear-r" d="M258 128 L275 60 L215 112 Z"/>
    <path data-region="ear-in-l" d="M150 115 L142 78 L172 112 Z"/>
    <path data-region="ear-in-r" d="M250 115 L258 78 L228 112 Z"/>
    <ellipse data-region="eye-l" cx="172" cy="165" rx="8" ry="13"/>
    <ellipse data-region="eye-r" cx="228" cy="165" rx="8" ry="13"/>
    <path data-region="nose" d="M192 195 L208 195 L200 208 Z"/>
    <path d="M200 208 L200 220 M200 218 Q188 230 176 224 M200 218 Q212 230 224 224 M140 175 L105 168 M140 185 L105 190 M260 175 L295 168 M260 185 L295 190" fill="none" stroke-width="3"/>
    <rect data-region="paw-l" x="158" y="332" width="30" height="28" rx="10"/>
    <rect data-region="paw-r" x="212" y="332" width="30" height="28" rx="10"/>
  </g>
</svg>`,
  },

  {
    id: 'owl',
    name: 'Owl',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path data-region="tuft-l" d="M135 95 L120 55 L160 95 Z"/>
    <path data-region="tuft-r" d="M265 95 L280 55 L240 95 Z"/>
    <path data-region="body" d="M200 80 Q100 95 100 230 Q100 345 200 345 Q300 345 300 230 Q300 95 200 80 Z"/>
    <ellipse data-region="belly" cx="200" cy="240" rx="60" ry="95"/>
    <path data-region="wing-l" d="M118 175 Q90 260 125 315 Q152 290 142 195 Z"/>
    <path data-region="wing-r" d="M282 175 Q310 260 275 315 Q248 290 258 195 Z"/>
    <circle data-region="eye-ring-l" cx="162" cy="160" r="38"/>
    <circle data-region="eye-ring-r" cx="238" cy="160" r="38"/>
    <circle data-region="pupil-l" cx="162" cy="160" r="15"/>
    <circle data-region="pupil-r" cx="238" cy="160" r="15"/>
    <path data-region="beak" d="M188 200 L212 200 L200 222 Z"/>
    <path data-region="feet-l" d="M168 340 L160 370 L182 370 L186 340 Z"/>
    <path data-region="feet-r" d="M214 340 L218 370 L240 370 L232 340 Z"/>
  </g>
</svg>`,
  },

  {
    id: 'turtle',
    name: 'Turtle',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <ellipse data-region="leg-fl" cx="105" cy="180" rx="30" ry="22"/>
    <ellipse data-region="leg-fr" cx="295" cy="180" rx="30" ry="22"/>
    <ellipse data-region="leg-bl" cx="115" cy="290" rx="28" ry="20"/>
    <ellipse data-region="leg-br" cx="285" cy="290" rx="28" ry="20"/>
    <path data-region="tail" d="M200 310 L190 345 L210 345 Z"/>
    <circle data-region="head" cx="200" cy="110" r="38"/>
    <circle data-region="eye" cx="215" cy="102" r="4"/>
    <path d="M188 122 Q200 128 212 122" fill="none" stroke-width="3"/>
    <ellipse data-region="shell" cx="200" cy="230" rx="115" ry="92"/>
    <polygon data-region="hex-c" points="200,190 228,210 218,245 182,245 172,210"/>
    <polygon data-region="hex-tl" points="145,170 175,165 175,200 148,210"/>
    <polygon data-region="hex-tr" points="255,170 225,165 225,200 252,210"/>
    <polygon data-region="hex-bl" points="148,255 178,250 182,285 155,295"/>
    <polygon data-region="hex-br" points="252,255 222,250 218,285 245,295"/>
  </g>
</svg>`,
  },

  {
    id: 'butterfly',
    name: 'Butterfly',
    svg: `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
    <path d="M198 85 Q175 45 150 50 M202 85 Q225 45 250 50" fill="none" stroke-width="4"/>
    <circle data-region="antenna-tip-l" cx="150" cy="50" r="6"/>
    <circle data-region="antenna-tip-r" cx="250" cy="50" r="6"/>
    <circle data-region="head" cx="200" cy="100" r="18"/>
    <ellipse data-region="body" cx="200" cy="210" rx="14" ry="90"/>
    <path data-region="wing-tl" d="M186 155 Q90 95 50 180 Q85 225 186 215 Z"/>
    <path data-region="wing-tr" d="M214 155 Q310 95 350 180 Q315 225 214 215 Z"/>
    <path data-region="wing-bl" d="M186 225 Q85 245 95 325 Q180 325 195 260 Z"/>
    <path data-region="wing-br" d="M214 225 Q315 245 305 325 Q220 325 205 260 Z"/>
    <circle data-region="dot-tl" cx="125" cy="170" r="12"/>
    <circle data-region="dot-tr" cx="275" cy="170" r="12"/>
    <circle data-region="dot-bl" cx="140" cy="275" r="9"/>
    <circle data-region="dot-br" cx="260" cy="275" r="9"/>
  </g>
</svg>`,
  },
];
