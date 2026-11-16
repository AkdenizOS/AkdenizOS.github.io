var Ye=["#2478C8","#8ECBF2","#F7FBFF","#C5D8EC"],At=["#9AA3AD","#C8CED4","#5C6570","#3F4750"],fn={backgroundColor:"#5BA3DC",backgroundImage:["linear-gradient(180deg, #2478C8 0%, #5BA3DC 48%, #8ECBF2 100%)","radial-gradient(28% 18% at 22% 68%, #F7FBFF 0%, transparent 70%)","radial-gradient(24% 16% at 74% 42%, #F7FBFF 0%, transparent 68%)","radial-gradient(20% 14% at 88% 76%, #C5D8EC 0%, transparent 70%)"].join(", ")},hn={backgroundColor:"#A8B0B8",backgroundImage:["linear-gradient(180deg, #9AA3AD 0%, #B0B7BF 46%, #C8CED4 100%)","radial-gradient(32% 22% at 24% 62%, #5C6570 0%, transparent 70%)","radial-gradient(26% 18% at 76% 34%, #3F4750 0%, transparent 68%)","radial-gradient(22% 16% at 58% 80%, #5C6570 0%, transparent 70%)"].join(", ")};var Ft=`
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,Ct=`
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_coverage;
uniform float u_intensity;
uniform float u_amount;
uniform float u_scale;
uniform float u_variation;
uniform float u_glass;
uniform float u_glassSize;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform vec2 u_mouse;
uniform float u_gradient;
uniform float u_flash;
uniform vec2 u_flashPos;
uniform sampler2D u_noise;

// Cloud slab, in world units above the viewer.
const float BASE = 1.0;
const float TOP = 1.9;
// Past this distance the layer is haze, not clouds.
const float FAR = 34.0;
const int STEPS = 36;
const int LIGHT_STEPS = 3;
// Horizon just inside the bottom edge, like a photo taken from a hill.
const float TILT = 0.46;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Value noise from a 256\xB2 random texture: one lookup per sample.
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return texture2D(u_noise, (i + f + 0.5) / 256.0).x;
}

// 3D value noise: the texture's green channel is red offset by (37, 239),
// so one lookup returns two neighbouring z slices.
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec2 uv = i.xy + vec2(37.0, 239.0) * i.z + f.xy;
  vec2 rg = texture2D(u_noise, (uv + 0.5) / 256.0).yx;
  return mix(rg.x, rg.y, f.z);
}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// Henyey\u2013Greenstein, scaled so isotropic scattering is 1.
float phaseHG(float mu, float g) {
  float g2 = g * g;
  return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * mu, 1.5);
}

// Local coverage: a slow 2D weather map splits the sky into distinct
// clouds with clear gaps between them.
float coverageAt(vec2 xz) {
  float weather = noise2(xz * mix(0.14, 0.32, u_amount) + 13.7);
  float cov = mix(0.22, 0.72, u_coverage);
  return clamp(cov + (weather - 0.5) * mix(1.0, 0.55, u_amount), 0.0, 1.0);
}

// Cumulus density: 3D fbm shaped by a height profile (flat-ish base,
// billowing top), then cut back to the local coverage.
float density(vec3 q, float hf, float cov, float t, float fine) {
  float shape = smoothstep(0.0, 0.14, hf) * (1.0 - smoothstep(0.35, 1.0, hf));
  float n = noise3(q) * 0.52;
  n += noise3(q * 2.03 + 3.1) * 0.27;
  n += noise3(q * 4.07 + 7.7) * 0.14;
  n += fine * noise3(q * 8.3 + 1.9) * 0.1;
  n /= 0.93 + fine * 0.1;
  float d = n * shape;
  d = clamp((d - (1.0 - cov)) / max(cov, 0.05), 0.0, 1.0);
  if (fine > 0.5 && d > 0.0) {
    // Wispy erosion at the rims, rising slowly like convection.
    float e = noise3(q * 6.1 + vec3(0.0, -t * 0.6, 0.0));
    d = clamp(d - e * mix(0.08, 0.26, u_variation) * (1.0 - d), 0.0, 1.0);
  }
  return d;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float t = u_time * u_speed;
  float cell = max(u_glassSize, 2.0);

  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 glassLocal = fract(gl_FragCoord.xy / cell) - 0.5;
  if (u_glass > 0.5) {
    uv += glassLocal * 0.0032;
  }

  vec2 s = (uv - 0.5) * vec2(aspect, 1.0);
  s += (u_mouse - 0.5) * vec2(0.06, 0.03);
  vec3 dir = normalize(vec3(s.x, s.y + TILT, 1.0));
  vec3 sunDir = normalize(vec3(0.85, 0.95, 1.0));
  float mu = dot(dir, sunDir);

  // Storm palettes (cloud darker than the horizon) mute the sun.
  float storm = smoothstep(0.02, -0.12, luma(u_c3) - luma(u_c2));
  float sunAmt = 1.0 - storm * 0.75;
  vec3 sunTint = mix(vec3(1.0, 0.96, 0.88), u_c3, 0.3);

  // --- Sky ---------------------------------------------------------------
  // Below the horizon there is only haze.
  float up = clamp(dir.y, 0.0, 1.0);
  vec3 sky = mix(u_c2, u_c1, pow(smoothstep(0.0, 0.85, up), 0.6));
  vec3 haze = mix(u_c2, vec3(1.0), 0.3 * luma(u_c2));
  sky = mix(sky, haze, exp(-up * 9.0) * 0.6);
  float glow = pow(max(mu, 0.0), 8.0) * 0.14 + pow(max(mu, 0.0), 120.0) * 0.3;
  sky += sunTint * glow * sunAmt;

  // Broad light fields share the cloud clock and eased pointer.
  vec2 flow = uv + (u_mouse - 0.5) * 0.18;
  vec2 warmCenter = vec2(0.73 + sin(t * 0.32) * 0.24, 0.20 + cos(t * 0.24) * 0.10);
  vec2 seaCenter = vec2(0.22 + cos(t * 0.28) * 0.22, 0.35 + sin(t * 0.21) * 0.24);
  float warmField = exp(-dot(flow - warmCenter, flow - warmCenter) * 5.5);
  float seaField = exp(-dot(flow - seaCenter, flow - seaCenter) * 4.0);
  vec3 warmColor = mix(vec3(0.96, 0.72, 0.56), u_c4 * vec3(1.1, 0.85, 0.9), storm);
  vec3 seaColor = mix(vec3(0.25, 0.66, 0.73), u_c1 * vec3(0.65, 0.85, 1.0), storm);
  sky = mix(sky, seaColor, seaField * u_gradient * 0.38);
  sky = mix(sky, warmColor, warmField * u_gradient * 0.72);

  // --- Clouds ------------------------------------------------------------
  float freq = mix(2.2, 0.9, u_scale);
  // Wind carries the field sideways and toward the viewer.
  vec3 drift = vec3(t * 0.5, 0.0, t * 0.2);
  float sigma = mix(10.0, 26.0, u_intensity);
  vec3 sunLight = u_c3 * mix(1.12, 1.0, storm) * mix(vec3(1.0), sunTint, sunAmt * 0.5);
  float phase = mix(phaseHG(mu, -0.2), phaseHG(mu, 0.7), 0.12);

  vec3 L = vec3(0.0);
  float T = 1.0;
  float hitAt = 0.0;
  if (dir.y > 0.02) {
    float t0 = BASE / dir.y;
    if (t0 < FAR) {
      float t1 = min(TOP / dir.y, t0 + 5.0);
      float dt = (t1 - t0) / float(STEPS);
      // Jitter the start per pixel so the steps don't band.
      float tt = t0 + dt * hash(gl_FragCoord.xy);
      for (int i = 0; i < STEPS; i++) {
        vec3 p = dir * tt;
        vec3 q = p * freq + drift;
        float hf = (p.y - BASE) / (TOP - BASE);
        float cov = coverageAt(q.xz);
        float d = cov > 0.02 ? density(q, hf, cov, t, 1.0) : 0.0;
        if (d > 0.003) {
          if (hitAt == 0.0) hitAt = tt;
          // March toward the sun for self-shadowing.
          float od = 0.0;
          for (int j = 0; j < LIGHT_STEPS; j++) {
            vec3 lp = p + sunDir * (0.05 + float(j) * 0.12);
            float lh = (lp.y - BASE) / (TOP - BASE);
            od += density(lp * freq + drift, lh, cov, t, 0.0);
          }
          od *= 0.12 * sigma * 0.5;
          // Beer\u2013Lambert with a softer tail standing in for multiple scattering.
          float beer = max(exp(-od), exp(-od * 0.25) * 0.6);
          float powder = 1.0 - exp(-d * 5.0);
          vec3 ambient = mix(u_c4 * mix(0.82, 0.62, storm), mix(u_c1, u_c3, 0.6), hf);
          vec3 lum = sunLight * beer * phase * mix(1.0, powder, 0.35) + ambient * 0.72;
          float dT = exp(-d * sigma * dt);
          L += T * (1.0 - dT) * lum;
          T *= dT;
          if (T < 0.02) break;
        }
        tt += dt;
      }
      // Aerial perspective: distant clouds melt into the horizon haze.
      float fog = 1.0 - exp(-max(hitAt, t0) * 0.05);
      L = mix(L, haze * (1.0 - T), fog * 0.85);
    }
  }

  vec3 col = sky * T + L;
  col = mix(col, warmColor, warmField * (1.0 - T) * u_gradient * 0.08);

  // Lightning, lit from inside the clouds it hits.
  if (u_flash > 0.0) {
    vec2 fp = vec2(u_flashPos.x * aspect, u_flashPos.y - 0.5);
    float bloom = exp(-dot(s - fp, s - fp) * 3.2);
    vec3 bolt = vec3(0.86, 0.9, 1.0);
    col += bolt * u_flash * (bloom * (1.0 - T) * 0.95 + 0.05);
  }

  if (u_glass > 0.5) {
    float pane = smoothstep(0.50, 0.22, length(glassLocal));
    col *= mix(0.93, 1.0, pane);
    vec2 hl = glassLocal - vec2(-0.16, 0.18);
    col += exp(-dot(hl, hl) * 55.0) * 0.035;
    col = mix(col, vec3(luma(col)), 0.04);
  }
  col += (hash(gl_FragCoord.xy + fract(u_time) * 91.0) - 0.5) * 0.008;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,Rt=72e4,Oe=256;function je(){return typeof process<"u"&&!1}function kt(e){let a=e.replace("#","").trim(),o=a.length===3?a.split("").map(r=>r+r).join(""):a.padEnd(6,"0").slice(0,6),t=Number.parseInt(o,16);return Number.isNaN(t)?[.14,.47,.78]:[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}function Dt(){let e=Oe,a=new Uint8Array(e*e*4),o=573,t=()=>{o=o+1831565813|0;let r=Math.imul(o^o>>>15,1|o);return r=r+Math.imul(r^r>>>7,61|r)^r,((r^r>>>14)>>>0)/4294967296};for(let r=0;r<e*e;r++)a[r*4]=Math.floor(t()*256);for(let r=0;r<e;r++)for(let f=0;f<e;f++){let b=(r-239&e-1)*e+(f-37&e-1),n=(r*e+f)*4;a[n+1]=a[b*4],a[n+2]=0,a[n+3]=255}return a}function It(){if(typeof document>"u")return!1;let e=document.documentElement;if(e.classList.contains("dark"))return!0;if(e.classList.contains("light"))return!1;let a=e.getAttribute("data-theme");return a==="dark"?!0:a==="light"?!1:window.matchMedia("(prefers-color-scheme: dark)").matches}function Xe(e){return e==="dark"?!0:e==="light"?!1:It()}function Ve(e,a,o){let t=e.createShader(a);return t?(e.shaderSource(t,o),e.compileShader(t),e.getShaderParameter(t,e.COMPILE_STATUS)?t:(je()&&console.warn(`ShaderSky: shader failed to compile
`,e.getShaderInfoLog(t)),e.deleteShader(t),null)):null}function Ke(e,a={}){let o={speed:.1,coverage:.5,intensity:.9,amount:.5,scale:.4,variation:.7,interactive:!1,lightning:!1,glass:!1,glassSize:7,theme:"auto",...a},t={x:.5,y:.5},r={x:.5,y:.5},f=!1,b=Xe(o.theme??"auto");o.onThemeChange?.(b);let n=e.getContext("webgl",{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance"});if(!n)return null;let l=null,g=null,u=null,x=null,S=null,w=null,R=null,M=null,$=null,U=null,ie=null,J=null,oe=null,Z=null,_=null,Y=null,se=null,T=null,A=null,P=null,K=null,H=null,le=null,B=()=>{if(l=Ve(n,n.VERTEX_SHADER,Ft),g=Ve(n,n.FRAGMENT_SHADER,Ct),!l||!g)return l&&n.deleteShader(l),g&&n.deleteShader(g),!1;if(u=n.createProgram(),!u)return n.deleteShader(l),n.deleteShader(g),!1;if(n.attachShader(u,l),n.attachShader(u,g),n.linkProgram(u),!n.getProgramParameter(u,n.LINK_STATUS))return je()&&console.warn(`ShaderSky: program failed to link
`,n.getProgramInfoLog(u)),n.deleteProgram(u),n.deleteShader(l),n.deleteShader(g),!1;n.useProgram(u),x=n.createBuffer(),n.bindBuffer(n.ARRAY_BUFFER,x),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),n.STATIC_DRAW);let c=n.getAttribLocation(u,"a_position");return n.enableVertexAttribArray(c),n.vertexAttribPointer(c,2,n.FLOAT,!1,0,0),S=n.createTexture(),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,S),n.texImage2D(n.TEXTURE_2D,0,n.RGBA,Oe,Oe,0,n.RGBA,n.UNSIGNED_BYTE,Dt()),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.REPEAT),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.REPEAT),n.uniform1i(n.getUniformLocation(u,"u_noise"),0),w=n.getUniformLocation(u,"u_resolution"),R=n.getUniformLocation(u,"u_time"),M=n.getUniformLocation(u,"u_speed"),$=n.getUniformLocation(u,"u_coverage"),U=n.getUniformLocation(u,"u_intensity"),ie=n.getUniformLocation(u,"u_amount"),J=n.getUniformLocation(u,"u_scale"),oe=n.getUniformLocation(u,"u_variation"),Z=n.getUniformLocation(u,"u_glass"),_=n.getUniformLocation(u,"u_glassSize"),Y=n.getUniformLocation(u,"u_c1"),se=n.getUniformLocation(u,"u_c2"),T=n.getUniformLocation(u,"u_c3"),A=n.getUniformLocation(u,"u_c4"),P=n.getUniformLocation(u,"u_gradient"),K=n.getUniformLocation(u,"u_mouse"),H=n.getUniformLocation(u,"u_flash"),le=n.getUniformLocation(u,"u_flashPos"),!0};if(!B())return null;let k=0,F=!1,C=!1,ee=!0,ue=0,v=0,E={at:0,next:0,x:0,y:0},q=c=>c<0?0:Math.exp(-c*14),z=c=>{if(!o.lightning||f)return E.next=0,0;if(E.next===0&&(E.next=c+1500+Math.random()*2500),c>=E.next&&(E.at=c,E.next=c+4e3+Math.random()*6e3,E.x=(Math.random()-.5)*.9,E.y=.55+Math.random()*.35),E.at===0)return 0;let h=(c-E.at)/1e3;return Math.min(1,q(h)+.65*q(h-.16))},X=()=>ee&&document.visibilityState!=="hidden",V=()=>X()&&!f;function Q(){k||F||C||(ue=performance.now(),k=requestAnimationFrame(y))}let te=1,de=()=>{let c=e.parentElement;if(!c)return!1;let h=c.clientWidth,L=c.clientHeight;if(h<=0||L<=0)return!1;let ne=Math.min(window.devicePixelRatio||1,2);te=Math.min(ne,Math.sqrt(Rt/(h*L)));let W=Math.max(1,Math.floor(h*te)),O=Math.max(1,Math.floor(L*te));return e.style.width=`${h}px`,e.style.height=`${L}px`,Q(),W===e.width&&O===e.height?!1:(e.width=W,e.height=O,C||n.viewport(0,0,e.width,e.height),!0)},re=window.matchMedia("(prefers-reduced-motion: reduce)"),ae=()=>{f=re.matches,Q()};re.addEventListener("change",ae);let ce=()=>{let c=Xe(o.theme??"auto");c!==b&&(b=c,o.onThemeChange?.(b),Q())},me=new MutationObserver(ce);me.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme","style"]});let m=window.matchMedia("(prefers-color-scheme: dark)");m.addEventListener("change",ce);let G=c=>{if(!o.interactive)return;let h=e.parentElement;if(!h)return;let L=h.getBoundingClientRect();L.width<=0||L.height<=0||(r.x=(c.clientX-L.left)/L.width,r.y=1-(c.clientY-L.top)/L.height,X()&&Q())};window.addEventListener("pointermove",G,{passive:!0});let y=c=>{if(k=0,F||C)return;let h=Math.min(.25,Math.max(0,(c-ue)/1e3));ue=c;let L=V();L&&(v+=h);let ne=v,W=o.colors??(b?At:Ye),O=[0,1,2,3].map(j=>kt(W[j%W.length]??Ye[j]));t.x+=(r.x-t.x)*.03,t.y+=(r.y-t.y)*.03;let D=o.interactive&&Math.abs(r.x-t.x)+Math.abs(r.y-t.y)>.001,fe=Math.max(2,o.glassSize??7)*te;n.uniform2f(w,e.width,e.height),n.uniform1f(R,ne),n.uniform1f(M,f?0:o.speed??.1),n.uniform1f($,Math.min(1,Math.max(0,o.coverage??.5))),n.uniform1f(U,Math.min(1,Math.max(0,o.intensity??.9))),n.uniform1f(ie,Math.min(1,Math.max(0,o.amount??.5))),n.uniform1f(J,Math.min(1,Math.max(0,o.scale??.4))),n.uniform1f(oe,Math.min(1,Math.max(0,o.variation??.7))),n.uniform1f(P,o.gradient?1:0),n.uniform1f(Z,o.glass?1:0),n.uniform1f(_,fe),n.uniform3f(Y,O[0][0],O[0][1],O[0][2]),n.uniform3f(se,O[1][0],O[1][1],O[1][2]),n.uniform3f(T,O[2][0],O[2][1],O[2][2]),n.uniform3f(A,O[3][0],O[3][1],O[3][2]),n.uniform2f(K,o.interactive?t.x:.5,o.interactive?t.y:.5),n.uniform1f(H,z(v*1e3)),n.uniform2f(le,E.x,E.y),n.drawArrays(n.TRIANGLES,0,6),(L||D&&X())&&(k=requestAnimationFrame(y))},N=()=>{F||C||(cancelAnimationFrame(k),k=0,ue=performance.now(),y(ue))};de();let d=new ResizeObserver(()=>{de()&&N()});e.parentElement&&d.observe(e.parentElement),ae();let p=new IntersectionObserver(([c])=>{ee=c?.isIntersecting??!0,Q()});p.observe(e);let I=()=>Q();document.addEventListener("visibilitychange",I);let i=c=>{c.preventDefault(),C=!0,cancelAnimationFrame(k),k=0},s=()=>{F||!B()||(C=!1,n.viewport(0,0,e.width,e.height),Q())};return e.addEventListener("webglcontextlost",i),e.addEventListener("webglcontextrestored",s),Q(),{setOptions(c){o={...o,...c},ce(),Q()},destroy(){F=!0,cancelAnimationFrame(k),k=0,d.disconnect(),p.disconnect(),me.disconnect(),document.removeEventListener("visibilitychange",I),re.removeEventListener("change",ae),m.removeEventListener("change",ce),window.removeEventListener("pointermove",G),e.removeEventListener("webglcontextlost",i),e.removeEventListener("webglcontextrestored",s),n.deleteProgram(u),n.deleteShader(l),n.deleteShader(g),n.deleteBuffer(x),n.deleteTexture(S);let c=n.getExtension("WEBGL_lose_context");queueMicrotask(()=>{!e.isConnected&&!n.isContextLost()&&c?.loseContext()})}}}var et=["#F7A48B","#F9D78E","#9FCBF0","#BBA9EE"],tt=["#3D52F2","#9150F2","#E0479F","#FF7B60"],nt="#FBF8F4",ot="#07080B";var Pt=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.16 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;function rt(e,a){let[o,t,r,f]=e;return{backgroundColor:a,backgroundImage:[Pt,`radial-gradient(70% 60% at 18% 22%, ${o} 0%, transparent 70%)`,`radial-gradient(60% 60% at 82% 30%, ${t} 0%, transparent 70%)`,`radial-gradient(70% 60% at 70% 88%, ${r} 0%, transparent 70%)`,`radial-gradient(55% 55% at 12% 86%, ${f} 0%, transparent 70%)`].join(", ")}}var gn=rt(et,nt),bn=rt(tt,ot),Ot=`
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,Bt=`
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_blur;
uniform float u_intensity;
uniform float u_grain;
uniform float u_grainSeed;
uniform float u_pixel;
uniform float u_pointer;
uniform vec2 u_mouse;
// Palette stops and the paper / ink underneath, in OKLab.
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_base;

// Dave Hoskins' hash: no sin(), so it stays stable on mobile GPUs.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

// Weight of the stop at 'at' on a cyclic 0\u20131 track: a smoothed hat, so any
// two neighbouring weights always sum to one.
float stop(float v, float at) {
  float d = abs(v - at);
  d = min(d, 1.0 - d);
  return smoothstep(0.0, 1.0, 1.0 - clamp(d * 4.0, 0.0, 1.0));
}

vec3 palette(float v) {
  return u_c0 * stop(v, 0.0) + u_c1 * stop(v, 0.25) +
         u_c2 * stop(v, 0.5) + u_c3 * stop(v, 0.75);
}

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float scale = mix(2.0, 0.8, u_blur);
  vec2 p = vec2(uv.x * aspect, uv.y) * scale;
  float t = u_time;

  // A soft swirl around the pointer.
  vec2 d = p - vec2(u_mouse.x * aspect, u_mouse.y) * scale;
  p += vec2(-d.y, d.x) * exp(-dot(d, d) * 1.4) * 0.4 * u_pointer;

  // Domain warping: noise fed back through itself twice gives slow,
  // liquid bands that never read as a loop.
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.12 * t)),
    fbm(p + vec2(5.2, 1.3) - 0.1 * t)
  );
  vec2 r = vec2(
    fbm(p + 2.2 * q + vec2(1.7, 9.2) + 0.07 * t),
    fbm(p + 2.2 * q + vec2(8.3, 2.8) - 0.06 * t)
  );
  float f = fbm(p + 2.0 * r);

  // Where on the palette this pixel sits. The track is cyclic, so wrapping
  // past the last color flows back into the first without a seam.
  float v = fract(f * 2.4 + 0.35 * r.x + 0.02 * t);
  vec3 lab = palette(v);

  // Some of the paper / ink breathes through, so it isn't wall-to-wall color.
  // Ink dulls far faster than paper does, so on a dark base only a little
  // shows, and the color gets a chroma lift to glow against it.
  float air = smoothstep(0.28, 0.72, fbm(p * 0.6 - q + 13.0 + 0.03 * t));
  float floorMix = mix(0.82, 0.45, u_base.x);
  lab.yz *= mix(1.15, 1.0, u_base.x);
  lab = mix(u_base, lab, u_intensity * mix(floorMix, 1.0, air));

  vec3 col = linearToSrgb(oklabToLinear(lab));

  // Film grain on a CSS-pixel grid: two hashes averaged for a softer,
  // more photographic distribution than flat white noise.
  vec2 cell = floor(gl_FragCoord.xy / u_pixel);
  float g = (hash(cell + u_grainSeed) + hash(cell.yx - u_grainSeed * 1.7)) * 0.5;
  col += (g - 0.5) * u_grain * 0.2;
  // Always a hair of dither, so the smooth ramps never band.
  col += (hash(cell * 1.31 + u_grainSeed) - 0.5) * 0.004;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;function at(){return typeof process<"u"&&!1}function Ut(e,a,o){return Math.min(o,Math.max(a,e))}function Re(e,a,o,t){return typeof e!="number"||!Number.isFinite(e)?a:Ut(e,o,t)}function Qe(e){let a=e.replace("#","").trim(),o=a.length===3?a.split("").map(x=>x+x).join(""):a.padEnd(6,"0").slice(0,6),t=Number.parseInt(o,16),r=Number.isNaN(t)?[.5,.5,.5]:[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255],[f,b,n]=r.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4),l=Math.cbrt(.4122214708*f+.5363325363*b+.0514459929*n),g=Math.cbrt(.2119034982*f+.6806995451*b+.1073969566*n),u=Math.cbrt(.0883024619*f+.2817188376*b+.6299787005*n);return[.2104542553*l+.793617785*g-.0040720468*u,1.9779984951*l-2.428592205*g+.4505937099*u,.0259040371*l+.7827717662*g-.808675766*u]}function Ht(){if(typeof document>"u")return!1;let e=document.documentElement;if(e.classList.contains("dark"))return!0;if(e.classList.contains("light"))return!1;let a=e.getAttribute("data-theme");return a==="dark"?!0:a==="light"?!1:window.matchMedia("(prefers-color-scheme: dark)").matches}function Je(e){return e==="dark"?!0:e==="light"?!1:Ht()}function Ze(e,a,o){let t=e.createShader(a);return t?(e.shaderSource(t,o),e.compileShader(t),e.getShaderParameter(t,e.COMPILE_STATUS)?t:(at()&&console.warn(`ShaderGradient: shader failed to compile
`,e.getShaderInfoLog(t)),e.deleteShader(t),null)):null}function it(e,a={}){let o={interactive:!0,theme:"auto",...a},t={x:.5,y:.5},r={x:.5,y:.5},f=0,b=0,n=Je(o.theme??"auto");o.onThemeChange?.(n);let l=e.getContext("webgl",{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance"});if(!l)return null;let g=null,u=null,x=null,S=null,w,R,M,$,U,ie,J,oe,Z,_,Y=[],se=()=>{if(g=Ze(l,l.VERTEX_SHADER,Ot),u=Ze(l,l.FRAGMENT_SHADER,Bt),!g||!u)return g&&l.deleteShader(g),u&&l.deleteShader(u),!1;if(x=l.createProgram(),!x)return l.deleteShader(g),l.deleteShader(u),!1;if(l.attachShader(x,g),l.attachShader(x,u),l.linkProgram(x),!l.getProgramParameter(x,l.LINK_STATUS))return at()&&console.warn(`ShaderGradient: program failed to link
`,l.getProgramInfoLog(x)),l.deleteProgram(x),l.deleteShader(g),l.deleteShader(u),!1;l.useProgram(x),S=l.createBuffer(),l.bindBuffer(l.ARRAY_BUFFER,S),l.bufferData(l.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),l.STATIC_DRAW);let m=l.getAttribLocation(x,"a_position");l.enableVertexAttribArray(m),l.vertexAttribPointer(m,2,l.FLOAT,!1,0,0),l.viewport(0,0,e.width,e.height);let G=x,y=N=>l.getUniformLocation(G,N);return w=y("u_resolution"),R=y("u_time"),M=y("u_blur"),$=y("u_intensity"),U=y("u_grain"),ie=y("u_grainSeed"),J=y("u_pixel"),oe=y("u_pointer"),Z=y("u_mouse"),Y=[y("u_c0"),y("u_c1"),y("u_c2"),y("u_c3")],_=y("u_base"),!0};if(!se())return null;let T=1,A=()=>{let m=e.parentElement;if(!m)return!1;let G=m.clientWidth,y=m.clientHeight;if(G<=0||y<=0)return!1;T=Math.min(window.devicePixelRatio||1,1);let N=Math.max(1,Math.floor(G*T)),d=Math.max(1,Math.floor(y*T));return e.style.width=`${G}px`,e.style.height=`${y}px`,v(),N===e.width&&d===e.height?!1:(e.width=N,e.height=d,l.viewport(0,0,e.width,e.height),!0)},P="",K=()=>{let m=o.colors?.length?o.colors:n?tt:et,G=`${m.join()}|${n}`;G!==P&&(P=G,Y.forEach((y,N)=>{l.uniform3fv(y,Qe(m[N%m.length]))}),l.uniform3fv(_,Qe(n?ot:nt)))},H=window.matchMedia("(prefers-reduced-motion: reduce)"),le=!0,B=0,k=!1,F=!1,C=0,ee=0,ue=()=>le&&!H.matches&&document.visibilityState!=="hidden";function v(){B||k||F||(C=performance.now(),B=requestAnimationFrame(E))}let E=m=>{if(B=0,F)return;let G=Math.min(.05,Math.max(0,(m-C)/1e3));C=m;let y=ue();y&&(ee+=G),t.x+=(r.x-t.x)*.05,t.y+=(r.y-t.y)*.05,f+=(b-f)*.04,K();let N=Re(o.speed,.14,0,4);l.uniform2f(w,e.width,e.height),l.uniform1f(R,ee*N*4),l.uniform1f(M,Re(o.blur,.7,0,1)),l.uniform1f($,Re(o.intensity,.95,0,1)),l.uniform1f(U,Re(o.grain,.35,0,1)),l.uniform1f(ie,Math.floor(ee*24)%997*13.7),l.uniform1f(J,T),l.uniform1f(oe,o.interactive===!1?0:f),l.uniform2f(Z,t.x,t.y),l.drawArrays(l.TRIANGLES,0,6),y&&(B=requestAnimationFrame(E))},q=()=>{k||F||(cancelAnimationFrame(B),B=0,C=performance.now(),E(C))},z=m=>{m.preventDefault(),F=!0,cancelAnimationFrame(B),B=0,g=u=x=S=null},X=()=>{k||!se()||(F=!1,P="",v())};e.addEventListener("webglcontextlost",z),e.addEventListener("webglcontextrestored",X);let V=new ResizeObserver(()=>{A()&&q()});e.parentElement&&V.observe(e.parentElement);let Q=new IntersectionObserver(([m])=>{le=m?.isIntersecting??!0,v()});Q.observe(e);let te=()=>v();document.addEventListener("visibilitychange",te);let de=()=>v();H.addEventListener("change",de);let re=()=>{let m=Je(o.theme??"auto");m!==n&&(n=m,o.onThemeChange?.(n),v())},ae=new MutationObserver(re);ae.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme","style"]});let ce=window.matchMedia("(prefers-color-scheme: dark)");ce.addEventListener("change",re);let me=m=>{if(o.interactive===!1)return;let G=e.getBoundingClientRect();if(G.width<=0||G.height<=0)return;let y=(m.clientX-G.left)/G.width,N=1-(m.clientY-G.top)/G.height,d=y>=0&&y<=1&&N>=0&&N<=1;b=d?1:0,d&&(r.x=y,r.y=N)};return window.addEventListener("pointermove",me,{passive:!0}),A(),v(),{setOptions(m){o={...o,...m},re(),v()},destroy(){k=!0,cancelAnimationFrame(B),B=0,V.disconnect(),Q.disconnect(),ae.disconnect(),document.removeEventListener("visibilitychange",te),H.removeEventListener("change",de),ce.removeEventListener("change",re),window.removeEventListener("pointermove",me),e.removeEventListener("webglcontextlost",z),e.removeEventListener("webglcontextrestored",X),l.deleteProgram(x),l.deleteShader(g),l.deleteShader(u),l.deleteBuffer(S);let m=l.getExtension("WEBGL_lose_context");queueMicrotask(()=>{!e.isConnected&&!l.isContextLost()&&m?.loseContext()})}}}var Gt=["#FF6B4A","#2DD4BF","#FBBF24","#60A5FA","#F472B6","#A3E635","#94A3B8"],zt=["#E0472A","#0E9484","#C98A00","#2A66D1","#D2347F","#5E8F0B","#5B6B80"];function Nt(){if(typeof document>"u")return!1;let e=document.documentElement;if(e.classList.contains("dark"))return!0;if(e.classList.contains("light"))return!1;let a=e.getAttribute("data-theme");return a==="dark"?!0:a==="light"?!1:window.matchMedia("(prefers-color-scheme: dark)").matches}function Be(e="auto"){return e==="dark"?!0:e==="light"?!1:Nt()}function Wt(e){if(typeof document>"u")return()=>{};let a=new MutationObserver(e);a.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme","style"]});let o=window.matchMedia("(prefers-color-scheme: dark)");return o.addEventListener("change",e),()=>{a.disconnect(),o.removeEventListener("change",e)}}var pe=1e3,qt=70,$t=32,Yt=.5,Xt=2.4*60,Vt=1/60;function Se(e,a){return e&&e.length>0?e:a?Gt:zt}function jt(e){return typeof e!="number"||!Number.isFinite(e)?1:Math.max(0,e)}function st(e,a){let o=[];for(let t=0;t<e;t++){let r=Math.random()*pe;o.push({x:(Math.random()-.5)*pe,y:(Math.random()-.5)*pe,z:r,pz:r,color:a[t%a.length]})}return o}function lt(e,a={}){let o={starCount:420,displacement:1,container:null,theme:"auto",...a},t=e.getContext("2d",{alpha:!0});if(!t)return null;let r=Be(o.theme),f=st(o.starCount??420,Se(o.colors,r)),b=()=>{let v=Se(o.colors,r);for(let E=0;E<f.length;E++)f[E].color=v[E%v.length]},n={w:0,h:0},l=.28,g=0,u=.28,x=-1,S=!1,w=0,R=!1,M=!0,$=performance.now(),U=0,ie=performance.now(),J=null,oe=()=>{let v=e.parentElement;if(!v)return!1;let E=Math.min(window.devicePixelRatio||1,2),q=v.clientWidth,z=v.clientHeight;n.w=q,n.h=z;let X=Math.floor(q*E),V=Math.floor(z*E);return e.width===X&&e.height===V?!1:(e.width=X,e.height=V,e.style.width=`${q}px`,e.style.height=`${z}px`,t.setTransform(E,0,0,E,0,0),H(),!0)},Z=window.matchMedia("(prefers-reduced-motion: reduce)"),_=()=>{S=Z.matches,S&&(u=.06,x=-1),H()},Y=()=>o.container?o.container.scrollTop:window.scrollY,se=v=>{if(S){u=.06,x=-1;return}Math.abs(v)>2&&(x=v>0?1:-1),u=.22+Math.min(8,Math.abs(v)/80)},T=()=>{let v=performance.now(),E=Y(),q=v-ie,z=q>0?(E-U)/q*1e3:0;U=E,ie=v,se(z)},A=()=>{J&&(J.removeEventListener("scroll",T),J=null)},P=()=>{let v=o.container??window;J!==v&&(A(),J=v,U=Y(),ie=performance.now(),J.addEventListener("scroll",T,{passive:!0}))};P();let K=()=>M&&!S&&document.visibilityState!=="hidden";function H(){w||R||($=performance.now(),w=requestAnimationFrame(B))}function le(){R||(cancelAnimationFrame(w),w=0,$=performance.now(),B($))}let B=v=>{if(w=0,R)return;let E=K(),q=E?Math.min(.05,Math.max(0,(v-$)/1e3)):0;$=v,v-ie>40&&!S&&se(0);let z=(qt*(u-l)-$t*g)/Yt;g+=z*q,l+=g*q;let{w:X,h:V}=n;if(X===0||V===0){E&&(w=requestAnimationFrame(B));return}let Q=X/2,te=V/2,de=S?0:l,re=Math.max(X,V)*.5,ae=Se(o.colors,r),ce=de*Xt*jt(o.displacement);t.clearRect(0,0,X,V);for(let me=0;me<f.length;me++){let m=f[me];m.z-=x*ce*q,m.z<=1?(m.z=pe,m.pz=pe,m.x=(Math.random()-.5)*pe,m.y=(Math.random()-.5)*pe,m.color=ae[Math.floor(Math.random()*ae.length)]):m.z>=pe?(m.z=1.5,m.pz=1.5,m.x=(Math.random()-.5)*pe,m.y=(Math.random()-.5)*pe,m.color=ae[Math.floor(Math.random()*ae.length)]):m.pz=Math.min(pe,Math.max(1.01,m.z+x*ce*Vt));let G=re/m.z,y=Q+m.x*G,N=te+m.y*G,d=re/m.pz,p=Q+m.x*d,I=te+m.y*d;if(y<-50&&p<-50||y>X+50&&p>X+50||N<-50&&I<-50||N>V+50&&I>V+50)continue;let i=1-m.z/pe,s=Math.max(r?.8:1,i*(1.8+de*.12)),c=r?.35+i*.65:.55+i*.45;t.beginPath(),t.moveTo(p,I),t.lineTo(y,N),t.strokeStyle=m.color,t.globalAlpha=c,t.lineWidth=s,t.lineCap="round",t.stroke(),i>.45&&(t.beginPath(),t.arc(y,N,s*.9,0,Math.PI*2),t.fillStyle=m.color,t.fill())}t.globalAlpha=1,E&&(w=requestAnimationFrame(B))};oe();let k=new ResizeObserver(()=>{oe()&&le()});e.parentElement&&k.observe(e.parentElement);let F=new IntersectionObserver(([v])=>{M=v?.isIntersecting??!0,H()});F.observe(e);let C=()=>H();document.addEventListener("visibilitychange",C),_(),Z.addEventListener("change",_);let ue=Wt(()=>{let v=Be(o.theme);v!==r&&(r=v,b(),H())});return H(),{setOptions(v){let E=o.starCount??420,q=Se(o.colors,r).join(",");o={...o,...v},r=Be(o.theme);let z=o.starCount??420,X=Se(o.colors,r).join(",");z!==E?f=st(z,Se(o.colors,r)):X!==q&&b(),P(),H()},destroy(){R=!0,cancelAnimationFrame(w),w=0,k.disconnect(),F.disconnect(),A(),document.removeEventListener("visibilitychange",C),Z.removeEventListener("change",_),ue()}}}var Kt=["#18181B","#F4F4F5"],Qt=["#09090B","#D4D4D8"];var Jt=[[0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],[12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],[3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],[15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21]];function Zt(){if(typeof document>"u")return!1;let e=document.documentElement;if(e.classList.contains("dark"))return!0;if(e.classList.contains("light"))return!1;let a=e.getAttribute("data-theme");return a==="dark"?!0:a==="light"?!1:window.matchMedia("(prefers-color-scheme: dark)").matches}function Ue(e){return e==="dark"?!0:e==="light"?!1:Zt()}function He(e){let a=e.replace("#","").trim(),o=a.length===3?a.split("").map(r=>r+r).join(""):a.padEnd(6,"0").slice(0,6),t=Number.parseInt(o,16);return Number.isNaN(t)?[0,0,0]:[t>>16&255,t>>8&255,t&255]}function ct(e){let a=Math.round(e??4);return Number.isFinite(a)?Math.min(12,Math.max(1,a)):4}function ut(e){return e*e*(3-2*e)}function mt(e){return-(Math.cos(Math.PI*e)-1)/2}function en(e,a,o){let t=e/a;return{cell:Math.max(1,Math.round(Math.max(1,o)**(1-t))),tones:2+Math.round(t*10),color:t}}function dt(e,a,o,t,r){let f=r==="contain"?Math.min(o/e,t/a):Math.max(o/e,t/a),b=e*f,n=a*f;return{x:(o-b)/2,y:(t-n)/2,w:b,h:n}}function tn(e,a,o,t,r,f,b){let n=Math.max(1,Math.ceil(a/r.cell)),l=Math.max(1,Math.ceil(o/r.cell)),g=document.createElement("canvas");g.width=n,g.height=l;let u=g.getContext("2d",{willReadFrequently:!0});if(!u)return null;let x=dt(e.naturalWidth,e.naturalHeight,a,o,t);u.imageSmoothingEnabled=!0,u.imageSmoothingQuality="high",u.drawImage(e,x.x/r.cell,x.y/r.cell,x.w/r.cell,x.h/r.cell);let S;try{S=u.getImageData(0,0,n,l)}catch{return null}let w=S.data,R=r.tones-1,M=r.color,$=1-M,[U,ie,J]=f,oe=b[0]-U,Z=b[1]-ie,_=b[2]-J;for(let Y=0;Y<l;Y++){let se=Jt[Y&7];for(let T=0;T<n;T++){let A=(Y*n+T)*4;if(w[A+3]===0)continue;let P=(se[T&7]+.5)/64-.5,K=w[A],H=w[A+1],le=w[A+2],B=(.2126*K+.7152*H+.0722*le)/255,k=Math.round(B*R+P)/R;k=k<0?0:k>1?1:k;let F=K,C=H,ee=le;M>0&&(F=Math.round(K/255*R+P)/R,C=Math.round(H/255*R+P)/R,ee=Math.round(le/255*R+P)/R,F=(F<0?0:F>1?1:F)*255,C=(C<0?0:C>1?1:C)*255,ee=(ee<0?0:ee>1?1:ee)*255),w[A]=(U+oe*k)*$+F*M,w[A+1]=(ie+Z*k)*$+C*M,w[A+2]=(J+_*k)*$+ee*M,w[A+3]=255}}return u.putImageData(S,0,0),g}var ke=0,_e=1,Ge=2,De=3,Ie=4;function ft(e,a,o){let t={passes:4,duration:1400,pause:280,angle:45,alternate:!0,pixelSize:6,blur:6,fit:"cover",autoPlay:!0,loop:!1,loopDelay:2400,theme:"auto",...o},r=a.getContext("2d");if(!r)return null;let f=!0,b=0,n=0,l=0,g=0,u=0,x=1,S=!1,w=Ue(t.theme??"auto"),R=!1,M=null,$="",U=[],ie=[],J=0,oe=0,Z=new Map,_=null,Y=0,se=!1,T=ke,A=0,P=0,K=!1,H=!1,le=()=>ct(t.passes),B=i=>{H!==i&&(H=i,t.onScanningChange?.(i))},k=()=>{let i=t.colors??(w?Qt:Kt);return[He(i[0]),He(i[1])]},F=()=>{if(window.clearTimeout(n),n=0,!M||g<=0||u<=0)return;let i=le(),[s,c]=k(),h=t.fit??"cover",L=t.pixelSize??6,ne=[],W=[];se=!1;for(let O=0;O<i;O++){let D=en(O,i,L),fe=tn(M,g,u,h,D,s,c);if(!fe){se=!0;break}ne.push(fe),W.push(D.cell)}U=se?[null]:[...ne,null],ie=se?[1]:[...W,1],J=g,oe=u,Z.clear(),ue(),A>U.length-1&&(A=U.length-1)},C=(i,s=r)=>{let c=U[i];if(c===void 0)return;if(c===null){if(!M)return;let L=dt(M.naturalWidth,M.naturalHeight,g,u,t.fit??"cover");s.imageSmoothingEnabled=!0,s.imageSmoothingQuality="high",s.drawImage(M,L.x,L.y,L.w,L.h);return}let h=ie[i]??1;s.imageSmoothingEnabled=!1,s.drawImage(c,0,0,c.width*h*(g/J),c.height*h*(u/oe))},ee=i=>{if(Z.has(i))return Z.get(i);let s=document.createElement("canvas");s.width=Math.max(1,Math.round(g)),s.height=Math.max(1,Math.round(u));let c=s.getContext("2d"),h=null;return c&&typeof c.filter=="string"&&(C(i,c),c.filter=`blur(${t.blur??6}px)`,C(i,c),c.filter="none",h=s),Z.set(i,h),h},ue=()=>{if(window.clearTimeout(Y),(t.blur??6)<=0||S)return;let i=s=>{!f||s>=U.length||(ee(s),Y=window.setTimeout(()=>i(s+1),0))};Y=window.setTimeout(()=>i(0),0)},v=(i,s,c,h)=>{if((t.blur??6)<=0)return;let L=ee(A),ne=ee(A+1);if(!L||!ne)return;_||(_=document.createElement("canvas"));let W=Math.max(1,Math.round(g)),O=Math.max(1,Math.round(u));(_.width!==W||_.height!==O)&&(_.width=W,_.height=O);let D=_.getContext("2d");if(!D)return;D.setTransform(1,0,0,1,0,0),D.globalCompositeOperation="source-over",D.clearRect(0,0,W,O),D.drawImage(L,0,0),D.save(),D.translate(g/2,u/2),D.rotate(i),D.beginPath(),D.rect(-c-2,-h,s+c+2,h*2),D.clip(),D.setTransform(1,0,0,1,0,0),D.drawImage(ne,0,0),D.restore(),D.save(),D.translate(g/2,u/2),D.rotate(i);let fe=164,j=128/fe,he=D.createLinearGradient(s-128,0,s+36,0);for(let ge=0;ge<=12;ge++){let ve=ge/12,Mt=ve*j,_t=j+ve*(1-j);he.addColorStop(Mt,`rgba(0,0,0,${ut(ve)})`),he.addColorStop(_t,`rgba(0,0,0,${ut(1-ve)})`)}D.globalCompositeOperation="destination-in",D.fillStyle=he,D.fillRect(-c-fe-4,-h,(c+fe+4)*2,h*2),D.restore(),r.drawImage(_,0,0,g,u)},E=(i,s)=>{let c=t.lineColor,h=r.createLinearGradient(i-56,0,i,0);if(c){let[L,ne,W]=He(c);h.addColorStop(0,`rgba(${L},${ne},${W},0)`),h.addColorStop(1,`rgba(${L},${ne},${W},0.28)`)}else h.addColorStop(0,"rgba(255,255,255,0)"),h.addColorStop(1,"rgba(255,255,255,0.22)");r.globalCompositeOperation=c?"source-over":"soft-light",r.fillStyle=h,r.fillRect(i-56,-s,56,s*2),r.globalCompositeOperation=c?"source-over":"difference",r.fillStyle=c??"#FFFFFF",r.fillRect(i-1.5/2,-s,1.5,s*2),r.globalCompositeOperation="source-over"},q=i=>{if(r.setTransform(x,0,0,x,0,0),r.clearRect(0,0,g,u),!M||U.length===0)return;if(T===Ie){let ge=Math.min(1,(i-P)/520);C(U.length-1),r.globalAlpha=mt(ge),C(0),r.globalAlpha=1;return}if(C(A),T!==_e)return;let s=mt(Math.min(1,(i-P)/Math.max(1,t.duration??1400))),c=t.alternate!==!1&&A%2===1,h=((t.angle??45)+(c?180:0))*Math.PI/180,L=Math.abs(Math.cos(h)),ne=Math.abs(Math.sin(h)),W=(L*g+ne*u)/2,O=(ne*g+L*u)/2+2,D=(t.blur??6)>0,fe=-W-1.5-(D?36:0),j=W+1.5+(D?128:0),he=fe+(j-fe)*s;r.save(),r.translate(g/2,u/2),r.rotate(h),r.beginPath(),r.rect(-W-2,-O,he+W+2,O*2),r.clip(),r.setTransform(x,0,0,x,0,0),C(A+1),r.restore(),v(h,he,W,O),r.save(),r.translate(g/2,u/2),r.rotate(h),E(he,O),r.restore()},z=()=>{window.clearTimeout(l),!(!t.loop||S||U.length<2)&&(l=window.setTimeout(()=>{!f||T!==De||(T=Ie,P=performance.now(),B(!0),Q())},Math.max(0,t.loopDelay??2400)))},X=()=>{T=De,A=U.length-1,B(!1),t.onComplete?.(),z()},V=i=>{if(b=0,!f)return;let s=U.length-1;T===_e?i-P>=Math.max(1,t.duration??1400)&&(A+=1,t.onPass?.(A,s),A>=s?X():(T=Ge,P=i)):T===Ge?i-P>=Math.max(0,t.pause??280)&&(T=_e,P=i):T===Ie&&i-P>=520&&(T=ke,A=0,de(i)),q(i),(T===_e||T===Ge||T===Ie)&&(b=requestAnimationFrame(V))},Q=()=>{!b&&f&&(b=requestAnimationFrame(V))},te=()=>{b||q(performance.now())},de=(i=performance.now())=>{K=!1;let s=U.length-1;if(s<=0||S){A=Math.max(0,s),T=De,te(),s>=0&&t.onComplete?.();return}A===0&&t.onStart?.(),T=_e,P=i,B(!0),Q()},re=()=>{if(!M||U.length===0||!R){K=!0;return}de()},ae=i=>{window.clearTimeout(l),cancelAnimationFrame(b),b=0,T=ke,A=0,B(!1),te(),i&&re()},ce=()=>{x=Math.min(window.devicePixelRatio||1,2);let i=e.clientWidth,s=e.clientHeight;if(i<=0||s<=0)return!1;let c=i!==g||s!==u;g=i,u=s;let h=Math.max(1,Math.floor(i*x)),L=Math.max(1,Math.floor(s*x));return(h!==a.width||L!==a.height)&&(a.width=h,a.height=L),a.style.width=`${i}px`,a.style.height=`${s}px`,c},me=i=>{if($=i,U=[],M=null,ae(!1),!i)return;let s=new Image;s.crossOrigin="anonymous",s.decoding="async",s.onload=()=>{!f||$!==i||(M=s,t.onLoad?.(s.naturalWidth,s.naturalHeight),ce(),F(),te(),(t.autoPlay!==!1||K)&&re())},s.src=i};ce();let m=new ResizeObserver(()=>{!ce()||!M||(U.length===0&&F(),te(),window.clearTimeout(n),n=window.setTimeout(()=>{F(),te(),K&&re()},120))});m.observe(e);let G=new IntersectionObserver(i=>{R=i.some(s=>s.isIntersecting),R&&K&&re()},{threshold:.35});G.observe(e);let y=window.matchMedia("(prefers-reduced-motion: reduce)"),N=()=>{S=y.matches};N(),y.addEventListener("change",N);let d=()=>{let i=Ue(t.theme??"auto");i!==w&&(w=i,t.colors||(F(),te()))},p=new MutationObserver(d);p.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme","style"]});let I=window.matchMedia("(prefers-color-scheme: dark)");return I.addEventListener("change",d),K=t.autoPlay!==!1,me(t.src),{setOptions(i){let s=t;if(t={...t,...i},t.src!==$){K=t.autoPlay!==!1,me(t.src);return}let c=ct(s.passes)!==le(),h=c||s.pixelSize!==t.pixelSize||s.fit!==t.fit||s.colors?.[0]!==t.colors?.[0]||s.colors?.[1]!==t.colors?.[1];if(s.theme!==t.theme&&(w=Ue(t.theme??"auto")),h||s.theme!==t.theme?F():s.blur!==t.blur&&(Z.clear(),ue()),c){ae(t.autoPlay!==!1);return}s.loop!==t.loop&&T===De&&z(),s.autoPlay===!1&&t.autoPlay!==!1&&T===ke&&re(),te()},replay(){ae(!0)},destroy(){f=!1,cancelAnimationFrame(b),window.clearTimeout(n),window.clearTimeout(l),window.clearTimeout(Y),m.disconnect(),G.disconnect(),p.disconnect(),y.removeEventListener("change",N),I.removeEventListener("change",d),t.onScanningChange?.(!1)}}}var nn=["#FF1AE6","#FF2E5E","#FF8A1A","#FFC81F","#E2E6EC","#8DB6E6","#2F74DC","#1459E3","#1C2566"];var ht="stretchy-footer:play";var on=.008333333333333333;function rn(e,a,o=!1){if(a<=1)return 1;let t=Math.abs(e/(a-1)*2-1);return 1-(1-.55)*(o?1-t:t)}function an(e,a){return a<=0||e<=0?0:a*(1-1/(e*.9/a+1))}function ze(e,a,o){return Math.min(o,Math.max(a,e))}function we(e,a,o,t){return typeof e!="number"||!Number.isFinite(e)?a:ze(e,o,t)}function sn(e){return e.deltaMode===1?e.deltaY*16:e.deltaMode===2?e.deltaY*window.innerHeight:e.deltaY}function pt(e,a,o){let t=e instanceof Element?e:null;for(;t&&t!==a&&t!==document.documentElement;){if(t.scrollHeight>t.clientHeight+1){let r=getComputedStyle(t).overflowY;if((r==="auto"||r==="scroll")&&(o>0?t.scrollHeight-t.clientHeight-t.scrollTop:t.scrollTop)>1)return!0}t=t.parentElement}return!1}var Te=256;function ln(e){let a=document.createElement("canvas");a.width=1,a.height=Te;let o=a.getContext("2d");if(!o)return a;let t=o.createLinearGradient(0,0,0,Te);e.forEach((f,b)=>{let n=e.length>1?b/(e.length-1):1;t.addColorStop(.12*.8+(1-.12*.8)*n,f)}),o.fillStyle=t,o.fillRect(0,0,1,Te);let r=o.createLinearGradient(0,0,0,Te*.12);return r.addColorStop(0,"rgba(0,0,0,0)"),r.addColorStop(1,"rgba(0,0,0,1)"),o.globalCompositeOperation="destination-in",o.fillStyle=r,o.fillRect(0,0,1,Te),a}function cn(){let e=document.createElement("canvas");e.width=128,e.height=64;let a=e.getContext("2d");if(!a)return e;let o=a.createRadialGradient(64,64,0,64,64,64);return o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=o,a.fillRect(0,0,128,64),e}function gt(e,a,o,t){let r=(-a*(e.x-e.target)-o*e.v)/.35;e.v+=r*t,e.x+=e.v*t}var bt=e=>Math.abs(e.x-e.target)<.15&&Math.abs(e.v)<.15;function vt(e,a={}){let{canvas:o,scroller:t}=e,r=o.getContext("2d");if(!r)return null;let f={...a},b=()=>we(f.maxStretch,280,0,4e3),n=()=>we(f.blur,16,0,64),l=()=>we(f.glow,0,0,1),g=()=>we(f.stiffness,380,10,4e3),u=()=>we(f.damping,32,0,400),x=()=>Math.round(we(f.columns,9,3,96)),S=0,w=null,R={x:0,v:0,target:0},M=[],$=document.createElement("canvas"),U=cn(),ie=()=>{let d=x(),p=R.target;M=Array.from({length:d},(I,i)=>{let s=rn(i,d,f.flip);return{x:R.x*s,v:0,target:p*s,share:s}})},J=()=>{$=ln(f.colors?.length?f.colors:nn)},oe={w:0,pad:0,scale:1},Z=()=>{let d=o.parentElement,p=n(),I=b(),i=Math.ceil(p*2),s=p>=6?.5:Math.min(window.devicePixelRatio||1,2);oe.w=(d?.clientWidth??0)+i*2,oe.pad=i,oe.scale=s,o.width=Math.max(1,Math.ceil(oe.w*s)),o.height=Math.max(1,Math.ceil((I+i)*s)),Object.assign(o.style,{position:"absolute",left:`${-i}px`,bottom:`${-i}px`,width:`${oe.w}px`,height:`${I+i}px`,filter:p>0?`blur(${p}px)`:"",pointerEvents:"none"}),A()},_=null,Y="",se=()=>{let d=e.content;return d?typeof d!="string"?d:_?.isConnected&&_.matches(d)?_:(t instanceof HTMLElement?t:document).querySelector(d)??document.querySelector(d):null},T=d=>{let p=se();p!==_&&(_&&(_.style.transform=Y),_=p,Y=p?.style.transform??""),_&&(d>.2?(_.style.transform=`translate3d(0, ${-d}px, 0)`,_.style.willChange="transform"):(_.style.transform=Y,_.style.willChange=""))};function A(){let d=Math.max(0,R.x);T(d);let p=b(),I=d>.2||M.some(j=>j.x>.2);if(o.style.visibility=I?"visible":"hidden",!I)return;let{w:i,pad:s,scale:c}=oe,h=p*c,L=o.height;r.setTransform(1,0,0,1,0,0),r.clearRect(0,0,o.width,o.height),r.globalAlpha=ze(d/Math.max(1,p*.08),0,1);let ne=f.rotate===180;ne&&r.setTransform(-1,0,0,-1,o.width,2*h-d*c);let W=M.length,O=(i-s*2)*c,D=j=>j<=0?0:j>=W?o.width:Math.round(s*c+O*j/W);for(let j=0;j<W;j++){let he=Math.max(0,M[j].x)*c;if(he<.5)continue;let ge=D(j),ve=D(j+1);r.drawImage($,ge,h-he,ve-ge,he),!ne&&r.drawImage($,0,Te-1,1,1,ge,h,ve-ge,L-h)}let fe=l();if(fe>0){let j=O*.49,he=d*.35*c;r.globalAlpha*=fe,r.drawImage(U,i*c*.5-j,h-he,j*2,he)}r.globalAlpha=1,r.setTransform(1,0,0,1,0,0)}let P=0,K=0,H=()=>{let d=b(),p=w??an(S,d);R.target=p;for(let I of M)I.target=p*I.share;P||(K=performance.now(),P=requestAnimationFrame(le))};function le(d){P=0;let p=Math.min(.05,Math.max(0,(d-K)/1e3));K=d;let I=g(),i=u(),s=Math.max(1,Math.ceil(p/on));for(let h=0;h<s;h++){gt(R,I,i,p/s);for(let L of M){let ne=I*(.6+.4*L.share);gt(L,ne,i*.5*Math.sqrt(ne/I),p/s)}}let c=bt(R)&&M.every(bt);if(c){R.x=R.target,R.v=0;for(let h of M)h.x=h.target,h.v=0}A(),c||(P=requestAnimationFrame(le))}let B=window.matchMedia("(prefers-reduced-motion: reduce)"),k=B.matches,F=0,C=0,ee=0,ue=0,v=0,E=!1,q=0,z=t instanceof HTMLElement?t:document.documentElement,X=()=>z.scrollTop+z.clientHeight>=z.scrollHeight-2,V=()=>{window.clearTimeout(F),F=0,!(S<=0)&&(S=0,E=!0,H())},Q=()=>{w!==null&&(window.clearTimeout(C),w=null,H())},te=d=>{if(k||d.ctrlKey)return;let p=sn(d);if(p===0||Math.abs(d.deltaX)>Math.abs(d.deltaY))return;Q();let I=performance.now(),i=I-ee;if(ee=I,S>0){if(d.preventDefault(),v=p>0&&Math.abs(p)<Math.abs(ue)?v+1:0,ue=p,v>=6){V();return}S=Math.max(0,S+p),H(),window.clearTimeout(F),S>0&&(F=window.setTimeout(V,110));return}if(E){if(i<180)return;E=!1}p>0&&X()&&!pt(d.target,z,p)&&(d.preventDefault(),S=p,ue=p,v=0,H(),F=window.setTimeout(V,110))},de=d=>{let p=d.touches[0];p&&(Q(),E=!1,q=p.clientY)},re=d=>{let p=d.touches[0];if(!p||k)return;let I=q-p.clientY;q=p.clientY,(S>0||I>0&&X()&&!pt(d.target,z,I))&&(d.cancelable&&d.preventDefault(),S=Math.max(0,S+I),H())},ae=()=>V(),ce=d=>{let p=d.detail??{};(p.target??null)===(f.demoId??null)&&N.play(p)},me=()=>{k=B.matches,k&&V()},m=t,G=z.style.overscrollBehaviorY;z.style.overscrollBehaviorY="none",m.addEventListener("wheel",te,{passive:!1}),m.addEventListener("touchstart",de,{passive:!0}),m.addEventListener("touchmove",re,{passive:!1}),m.addEventListener("touchend",ae),m.addEventListener("touchcancel",ae),window.addEventListener(ht,ce),B.addEventListener("change",me);let y=new ResizeObserver(Z);o.parentElement&&y.observe(o.parentElement),J(),ie(),Z();let N={setOptions(d){let p=f.colors,I=b(),i=n(),s=!!f.flip;f={...f,...d},f.colors!==p&&J(),(x()!==M.length||!!f.flip!==s)&&ie(),(b()!==I||n()!==i)&&Z(),w!==null&&(w=Math.min(w,b())),H()},play({amount:d=.82,holdMs:p=700}={}){window.clearTimeout(F),window.clearTimeout(C),S=0,w=b()*ze(d,0,1),H(),C=window.setTimeout(Q,p)},destroy(){cancelAnimationFrame(P),P=0,window.clearTimeout(F),window.clearTimeout(C),z.style.overscrollBehaviorY=G,m.removeEventListener("wheel",te),m.removeEventListener("touchstart",de),m.removeEventListener("touchmove",re),m.removeEventListener("touchend",ae),m.removeEventListener("touchcancel",ae),window.removeEventListener(ht,ce),B.removeEventListener("change",me),y.disconnect(),_&&(_.style.transform=Y,_.style.willChange="")}};return N}var un=["shader-sky","shader-gradient","radiant-lines","none"],xt=new URLSearchParams(location.search).get("effect"),be=un.includes(xt)?xt:"shader-sky",ye=!1,xe=null,Ce=null,Me=null,Ee=matchMedia("(prefers-reduced-motion: reduce)"),yt=matchMedia("(prefers-color-scheme: dark)"),Fe=document.querySelector("#hero-effect"),Pe=document.querySelector("#scan-effect"),Lt=document.querySelector("#footer-effect"),We=document.querySelector("#motion-toggle"),qe=document.querySelector("#scan-replay"),$e=document.querySelector("#footer-play"),Et=document.querySelector("#effect-status"),Ae=document.querySelector("#scan-status"),St=document.querySelector("#footer-status"),wt=document.querySelectorAll("[data-effect]"),mn={"shader-sky":"Shader Sky","shader-gradient":"Shader Gradient","radiant-lines":"Radiant Lines",none:"Efektsiz foto\u011Fraf"};function Tt(){xe?.destroy(),Ce?.destroy(),Me?.destroy(),xe=Ce=Me=null,Fe.replaceChildren(),Pe.replaceChildren(),Lt.replaceChildren()}function Ne(e){let a=document.createElement("canvas");return a.setAttribute("aria-hidden","true"),e.append(a),a}function Le(){Tt();let a=(document.documentElement.dataset.theme?document.documentElement.dataset.theme==="dark":yt.matches)?"dark":"light",o=getComputedStyle(document.documentElement),t=n=>o.getPropertyValue(n).trim(),r=[t("--accent"),t("--surface"),t("--paper"),t("--button")],f=ye||Ee.matches,b=f||document.hidden;if(wt.forEach(n=>n.setAttribute("aria-pressed",String(n.dataset.effect===be))),We.disabled=Ee.matches,We.replaceChildren(document.createTextNode(Ee.matches?"Hareket azaltma a\xE7\u0131k":ye?"Hareketi a\xE7":"Hareketi durdur")),qe.disabled=b,$e.disabled=b,Fe.dataset.mode=be,Fe.dataset.renderState=b?"static":"active",Ae.textContent=b?"Foto\u011Fraf statik g\xF6steriliyor.":"Foto\u011Fraf haz\u0131rlan\u0131yor.",St.textContent=f?"Hareket kapal\u0131yken footer sabit kal\u0131r.":"Sayfan\u0131n sonunda biraz daha kayd\u0131rabilirsin.",b){Et.textContent=Ee.matches?"Sistem tercihi nedeniyle efektler statik g\xF6steriliyor.":ye?"Hareket durduruldu. Statik foto\u011Fraflar g\xF6steriliyor.":"Sekme g\xF6r\xFCn\xFCr oldu\u011Funda deneme devam eder.";return}if(be!=="none"){let n=Ne(Fe);be==="shader-sky"?xe=Ke(n,{theme:a,speed:.07,coverage:.4,amount:.4,lightning:!1}):be==="shader-gradient"?xe=it(n,{theme:a,colors:r,speed:.08,intensity:.7,grain:.12,interactive:!0}):xe=lt(n,{theme:a,colors:[r[0],t("--muted"),r[3]],starCount:180,displacement:.6}),xe||(n.remove(),Fe.dataset.renderState="fallback")}Et.textContent=be==="none"?"Efektsiz Antalya foto\u011Fraf\u0131. G\xF6rsel ve eylemleri kar\u015F\u0131la\u015Ft\u0131r.":xe?mn[be]+" \xE7al\u0131\u015F\u0131yor. \u0130stersen hareketi durdurabilirsin.":"Bu taray\u0131c\u0131da efekt ba\u015Flat\u0131lamad\u0131; Antalya foto\u011Fraf\u0131 g\xF6steriliyor.",Ce=ft(Pe,Ne(Pe),{src:"../../assets/images/kaleici.jpg",theme:a,colors:[t("--ink"),t("--paper")],passes:2,duration:900,pause:120,loop:!1,onStart:()=>{Ae.textContent="Tarama ba\u015Flad\u0131."},onPass:(n,l)=>{Ae.textContent=`${n} / ${l} ge\xE7i\u015F tamamland\u0131.`},onComplete:()=>{Ae.textContent="Tarama tamamland\u0131. Normal foto\u011Fraf g\xF6steriliyor."}}),Ce||(Pe.replaceChildren(),Ae.textContent="Efekt ba\u015Flat\u0131lamad\u0131; normal foto\u011Fraf g\xF6steriliyor.",qe.disabled=!0),Me=vt({canvas:Ne(Lt),scroller:window,content:"[data-stretchy-page]"},{colors:[r[0],r[1],r[3]],maxStretch:180,blur:12,columns:7,demoId:"akdenizos"}),$e.disabled=!Me}wt.forEach(e=>e.addEventListener("click",()=>{be=e.dataset.effect;let a=new URL(location.href);a.searchParams.set("effect",be),history.replaceState(null,"",a),Le()}));We.addEventListener("click",()=>{ye=!ye,Le()});qe.addEventListener("click",()=>{!Ee.matches&&!ye&&Ce?.replay()});$e.addEventListener("click",()=>{Ee.matches||ye||!Me||(window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}),Me.play({amount:.8,holdMs:650}),St.textContent="Footer bir kez esniyor ve yerine d\xF6n\xFCyor.")});var dn=new MutationObserver(Le);dn.observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme"]});yt.addEventListener("change",Le);Ee.addEventListener("change",Le);document.addEventListener("visibilitychange",Le);window.addEventListener("pagehide",Tt);Le();
