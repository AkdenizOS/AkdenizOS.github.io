var he=["#2478C8","#8ECBF2","#F7FBFF","#C5D8EC"],Ae=["#9AA3AD","#C8CED4","#5C6570","#3F4750"],Ge={backgroundColor:"#5BA3DC",backgroundImage:["linear-gradient(180deg, #2478C8 0%, #5BA3DC 48%, #8ECBF2 100%)","radial-gradient(28% 18% at 22% 68%, #F7FBFF 0%, transparent 70%)","radial-gradient(24% 16% at 74% 42%, #F7FBFF 0%, transparent 68%)","radial-gradient(20% 14% at 88% 76%, #C5D8EC 0%, transparent 70%)"].join(", ")},De={backgroundColor:"#A8B0B8",backgroundImage:["linear-gradient(180deg, #9AA3AD 0%, #B0B7BF 46%, #C8CED4 100%)","radial-gradient(32% 22% at 24% 62%, #5C6570 0%, transparent 70%)","radial-gradient(26% 18% at 76% 34%, #3F4750 0%, transparent 68%)","radial-gradient(22% 16% at 58% 80%, #5C6570 0%, transparent 70%)"].join(", ")};var ke=`
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,Ce=`
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
`,Me=72e4,G=256;function ve(){return typeof process<"u"&&!1}function Ue(t){let l=t.replace("#","").trim(),n=l.length===3?l.split("").map(r=>r+r).join(""):l.padEnd(6,"0").slice(0,6),a=Number.parseInt(n,16);return Number.isNaN(a)?[.14,.47,.78]:[(a>>16&255)/255,(a>>8&255)/255,(a&255)/255]}function Re(){let t=G,l=new Uint8Array(t*t*4),n=573,a=()=>{n=n+1831565813|0;let r=Math.imul(n^n>>>15,1|n);return r=r+Math.imul(r^r>>>7,61|r)^r,((r^r>>>14)>>>0)/4294967296};for(let r=0;r<t*t;r++)l[r*4]=Math.floor(a()*256);for(let r=0;r<t;r++)for(let m=0;m<t;m++){let v=(r-239&t-1)*t+(m-37&t-1),e=(r*t+m)*4;l[e+1]=l[v*4],l[e+2]=0,l[e+3]=255}return l}function Fe(){if(typeof document>"u")return!1;let t=document.documentElement;if(t.classList.contains("dark"))return!0;if(t.classList.contains("light"))return!1;let l=t.getAttribute("data-theme");return l==="dark"?!0:l==="light"?!1:window.matchMedia("(prefers-color-scheme: dark)").matches}function ge(t){return t==="dark"?!0:t==="light"?!1:Fe()}function pe(t,l,n){let a=t.createShader(l);return a?(t.shaderSource(a,n),t.compileShader(a),t.getShaderParameter(a,t.COMPILE_STATUS)?a:(ve()&&console.warn(`ShaderSky: shader failed to compile
`,t.getShaderInfoLog(a)),t.deleteShader(a),null)):null}function xe(t,l={}){let n={speed:.1,coverage:.5,intensity:.9,amount:.5,scale:.4,variation:.7,interactive:!1,lightning:!1,glass:!1,glassSize:7,theme:"auto",...l},a={x:.5,y:.5},r={x:.5,y:.5},m=!1,v=ge(n.theme??"auto");n.onThemeChange?.(v);let e=t.getContext("webgl",{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance"});if(!e)return null;let g=null,p=null,i=null,A=null,k=null,B=null,I=null,z=null,W=null,O=null,q=null,H=null,N=null,X=null,j=null,$=null,V=null,K=null,Y=null,J=null,Z=null,Q=null,ee=null,te=()=>{if(g=pe(e,e.VERTEX_SHADER,ke),p=pe(e,e.FRAGMENT_SHADER,Ce),!g||!p)return g&&e.deleteShader(g),p&&e.deleteShader(p),!1;if(i=e.createProgram(),!i)return e.deleteShader(g),e.deleteShader(p),!1;if(e.attachShader(i,g),e.attachShader(i,p),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))return ve()&&console.warn(`ShaderSky: program failed to link
`,e.getProgramInfoLog(i)),e.deleteProgram(i),e.deleteShader(g),e.deleteShader(p),!1;e.useProgram(i),A=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,A),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW);let o=e.getAttribLocation(i,"a_position");return e.enableVertexAttribArray(o),e.vertexAttribPointer(o,2,e.FLOAT,!1,0,0),k=e.createTexture(),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,k),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,G,G,0,e.RGBA,e.UNSIGNED_BYTE,Re()),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),e.uniform1i(e.getUniformLocation(i,"u_noise"),0),B=e.getUniformLocation(i,"u_resolution"),I=e.getUniformLocation(i,"u_time"),z=e.getUniformLocation(i,"u_speed"),W=e.getUniformLocation(i,"u_coverage"),O=e.getUniformLocation(i,"u_intensity"),q=e.getUniformLocation(i,"u_amount"),H=e.getUniformLocation(i,"u_scale"),N=e.getUniformLocation(i,"u_variation"),X=e.getUniformLocation(i,"u_glass"),j=e.getUniformLocation(i,"u_glassSize"),$=e.getUniformLocation(i,"u_c1"),V=e.getUniformLocation(i,"u_c2"),K=e.getUniformLocation(i,"u_c3"),Y=e.getUniformLocation(i,"u_c4"),J=e.getUniformLocation(i,"u_gradient"),Z=e.getUniformLocation(i,"u_mouse"),Q=e.getUniformLocation(i,"u_flash"),ee=e.getUniformLocation(i,"u_flashPos"),!0};if(!te())return null;let d=0,_=!1,L=!1,ne=!0,y=0,C=0,c={at:0,next:0,x:0,y:0},oe=o=>o<0?0:Math.exp(-o*14),be=o=>{if(!n.lightning||m)return c.next=0,0;if(c.next===0&&(c.next=o+1500+Math.random()*2500),o>=c.next&&(c.at=o,c.next=o+4e3+Math.random()*6e3,c.x=(Math.random()-.5)*.9,c.y=.55+Math.random()*.35),c.at===0)return 0;let f=(o-c.at)/1e3;return Math.min(1,oe(f)+.65*oe(f-.16))},M=()=>ne&&document.visibilityState!=="hidden",Se=()=>M()&&!m;function h(){d||_||L||(y=performance.now(),d=requestAnimationFrame(F))}let S=1,re=()=>{let o=t.parentElement;if(!o)return!1;let f=o.clientWidth,u=o.clientHeight;if(f<=0||u<=0)return!1;let P=Math.min(window.devicePixelRatio||1,2);S=Math.min(P,Math.sqrt(Me/(f*u)));let b=Math.max(1,Math.floor(f*S)),s=Math.max(1,Math.floor(u*S));return t.style.width=`${f}px`,t.style.height=`${u}px`,h(),b===t.width&&s===t.height?!1:(t.width=b,t.height=s,L||e.viewport(0,0,t.width,t.height),!0)},U=window.matchMedia("(prefers-reduced-motion: reduce)"),R=()=>{m=U.matches,h()};U.addEventListener("change",R);let E=()=>{let o=ge(n.theme??"auto");o!==v&&(v=o,n.onThemeChange?.(v),h())},ie=new MutationObserver(E);ie.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-theme","style"]});let ae=window.matchMedia("(prefers-color-scheme: dark)");ae.addEventListener("change",E);let le=o=>{if(!n.interactive)return;let f=t.parentElement;if(!f)return;let u=f.getBoundingClientRect();u.width<=0||u.height<=0||(r.x=(o.clientX-u.left)/u.width,r.y=1-(o.clientY-u.top)/u.height,M()&&h())};window.addEventListener("pointermove",le,{passive:!0});let F=o=>{if(d=0,_||L)return;let f=Math.min(.25,Math.max(0,(o-y)/1e3));y=o;let u=Se();u&&(C+=f);let P=C,b=n.colors??(v?Ae:he),s=[0,1,2,3].map(de=>Ue(b[de%b.length]??he[de]));a.x+=(r.x-a.x)*.03,a.y+=(r.y-a.y)*.03;let Te=n.interactive&&Math.abs(r.x-a.x)+Math.abs(r.y-a.y)>.001,we=Math.max(2,n.glassSize??7)*S;e.uniform2f(B,t.width,t.height),e.uniform1f(I,P),e.uniform1f(z,m?0:n.speed??.1),e.uniform1f(W,Math.min(1,Math.max(0,n.coverage??.5))),e.uniform1f(O,Math.min(1,Math.max(0,n.intensity??.9))),e.uniform1f(q,Math.min(1,Math.max(0,n.amount??.5))),e.uniform1f(H,Math.min(1,Math.max(0,n.scale??.4))),e.uniform1f(N,Math.min(1,Math.max(0,n.variation??.7))),e.uniform1f(J,n.gradient?1:0),e.uniform1f(X,n.glass?1:0),e.uniform1f(j,we),e.uniform3f($,s[0][0],s[0][1],s[0][2]),e.uniform3f(V,s[1][0],s[1][1],s[1][2]),e.uniform3f(K,s[2][0],s[2][1],s[2][2]),e.uniform3f(Y,s[3][0],s[3][1],s[3][2]),e.uniform2f(Z,n.interactive?a.x:.5,n.interactive?a.y:.5),e.uniform1f(Q,be(C*1e3)),e.uniform2f(ee,c.x,c.y),e.drawArrays(e.TRIANGLES,0,6),(u||Te&&M())&&(d=requestAnimationFrame(F))},Ee=()=>{_||L||(cancelAnimationFrame(d),d=0,y=performance.now(),F(y))};re();let se=new ResizeObserver(()=>{re()&&Ee()});t.parentElement&&se.observe(t.parentElement),R();let ue=new IntersectionObserver(([o])=>{ne=o?.isIntersecting??!0,h()});ue.observe(t);let ce=()=>h();document.addEventListener("visibilitychange",ce);let fe=o=>{o.preventDefault(),L=!0,cancelAnimationFrame(d),d=0},me=()=>{_||!te()||(L=!1,e.viewport(0,0,t.width,t.height),h())};return t.addEventListener("webglcontextlost",fe),t.addEventListener("webglcontextrestored",me),h(),{setOptions(o){n={...n,...o},E(),h()},destroy(){_=!0,cancelAnimationFrame(d),d=0,se.disconnect(),ue.disconnect(),ie.disconnect(),document.removeEventListener("visibilitychange",ce),U.removeEventListener("change",R),ae.removeEventListener("change",E),window.removeEventListener("pointermove",le),t.removeEventListener("webglcontextlost",fe),t.removeEventListener("webglcontextrestored",me),e.deleteProgram(i),e.deleteShader(g),e.deleteShader(p),e.deleteBuffer(A),e.deleteTexture(k);let o=e.getExtension("WEBGL_lose_context");queueMicrotask(()=>{!t.isConnected&&!e.isContextLost()&&o?.loseContext()})}}}var x=document.querySelector("#landing-sky"),D=document.querySelector(".hero-photo img"),Le=matchMedia("(prefers-reduced-motion: reduce)"),T=null;function _e(){T?.destroy(),T=null,x.replaceChildren(),x.removeAttribute("data-ready")}function ye(){let t=D.getBoundingClientRect(),l=Math.max(t.width/1400,t.height/1867),n=parseFloat(getComputedStyle(D).objectPosition.split(" ")[1])/100,a=(1867*l-t.height)*n,r=Math.max(0,Math.min(t.height,900*l-a)),m=Math.max(0,780*l-a);x.style.setProperty("--sky-height",`${r}px`),x.style.setProperty("--sky-fade-start",`${Math.min(m,r)}px`)}var Pe=new ResizeObserver(ye);Pe.observe(D);ye();function w(){if(_e(),Le.matches||document.hidden)return;let t=document.createElement("canvas");t.setAttribute("aria-hidden","true"),x.append(t),T=xe(t,{speed:.07,coverage:.4,amount:.4,lightning:!1,interactive:!0,gradient:!0}),T?requestAnimationFrame(()=>x.setAttribute("data-ready","")):x.replaceChildren()}Le.addEventListener("change",w);document.addEventListener("visibilitychange",w);window.addEventListener("pagehide",_e);window.addEventListener("pageshow",w);w();
