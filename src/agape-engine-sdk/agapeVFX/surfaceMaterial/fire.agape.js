import { useThree } from '@react-three/fiber'
import { useCallback, useMemo } from 'react'
import { Color, MeshPhysicalMaterial, TextureLoader, Vector2 } from 'three150'

export const typeName = 'fire'
export const displayName = 'Fire Material 1'

export const cache = new Map()
export const preload = async () => {
  if (!cache.has('noiseTexture')) {
    let noise = await new TextureLoader().loadAsync(`/texture/noise.jpg`)
    cache.set('noiseTexture', noise)
  }
}

export const undoFX = async ({ item, renderer, onLoop }) => {
  //
  let fnc = item.undoProcedure
  if (fnc) {
    fnc()
  }
}

export const applyFX = async ({ item, renderer, onLoop }) => {
  let materialProps = getMaterialProps({})
  let uniformProps = getUniformProps({})
  let newMat = getMaterialCore({ uniformProps, materialProps, renderer, onLoop })
  //

  if (!item.orig) {
    item.orig = item.material.clone()
  }

  item.undoProcedure = () => {
    item.material = item.orig.clone()
  }

  item.material = newMat
  item.needsUpdate = true
}

export const getUniformProps = ({}) => {
  return {
    time: { value: 0.0, autoLink: 'time' },
    noiseTexture: { value: cache.get('noiseTexture') },
    resolution: { value: new Vector2(), autoLink: 'resolution' },
  }
}

export const getMaterialProps = ({}) => {
  return {
    //
    color: new Color(0xff0000),
  }
}

export const getMaterialCore = ({ materialProps = {}, uniformProps = {}, renderer, onLoop }) => {
  const mat = new MeshPhysicalMaterial({
    ...materialProps,
  })

  mat.onBeforeCompile = (shader) => {
    {
      shader.uniforms = {
        ...shader.uniforms,
        ...uniformProps,
      }
    }

    {
      for (let key in shader.uniforms) {
        let props = shader.uniforms[key]
        let autoLink = props?.autoLink

        if (autoLink === 'time') {
          onLoop(() => {
            props.value = performance.now() / 1000
          })
        }

        if (autoLink === 'resolution') {
          props.value = props.value || new Vector2()
          onLoop(() => {
            props.value.x = renderer.domElement.width
            props.value.y = renderer.domElement.height
          })
        }
      }
    }
    //

    {
      shader.vertexShader = shader.vertexShader.replace(
        //
        `void main() {`,
        `varying vec2 myUV;
          void main() {
          myUV = uv;
        `,
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        //
        `void main() {`,
        `varying vec2 myUV;
          uniform sampler2D noiseTexture;
          float noise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            vec2 uv = (i.xy + vec2(37.0, 17.0) * i.z) + f.xy;
            vec2 rg = texture2D(noiseTexture, (uv + 0.5) / 256.0, -100.0).yx;
            return mix(rg.x, rg.y, f.z);
          }

uniform vec2 resolution;
uniform float time;
#define timeScale 			time * 0.5
#define fireMovement 		vec2(-0.01, -0.5)
#define distortionMovement	vec2(-0.01, -0.3)
#define normalStrength		40.0
#define distortionStrength	0.1
vec2 hash( vec2 p ) {
	p = vec2( dot(p,vec2(127.1,311.7)),
  dot(p,vec2(269.5,183.3)) );

	return -1.0 + 2.0*fract(sin(p) * 43758.5453123);
}
float noise( in vec2 p ) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2 i = floor( p + (p.x+p.y) * K1 );

    vec2 a = p - i + (i.x+i.y) * K2;
    vec2 o = step(a.yx,a.xy);
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;

    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );

	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));

    return dot( n, vec3(70.0) );
}
float fbm ( in vec2 p ) {
    float f = 0.0;
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f  = 0.5000*noise(p); p = m*p;
    f += 0.2500*noise(p); p = m*p;
    f += 0.1250*noise(p); p = m*p;
    f += 0.0625*noise(p); p = m*p;
    f = 0.5 + 0.5 * f;
    return f;
}
vec3 bumpMap(vec2 uv) {
    vec2 s = 1. / resolution.xy;
    float p =  fbm(uv);
    float h1 = fbm(uv + s * vec2(1., 0));
    float v1 = fbm(uv + s * vec2(0, 1.));

   	vec2 xy = (p - vec2(h1, v1)) * normalStrength;
    return vec3(xy + .5, 1.);
}
vec4 getFireColor() {
    vec2 uv = vec2(myUV.x,1.0 -  myUV.y);
    vec3 normal = bumpMap(uv * vec2(1.0, 0.3) + distortionMovement * timeScale);
    vec2 displacement = clamp((normal.xy - .5) * distortionStrength, -1., 1.);
    uv += displacement;

    vec2 uvT = (uv * vec2(1.0, 0.5)) + fireMovement * timeScale;
    float n = pow(fbm(8.0 * uvT), 1.0);

    float gradient = pow(1.0 - uv.y, 2.0) * 5.;
    float finalNoise = n * gradient;

    vec3 color = finalNoise * vec3(2.*n, 2.*n*n*n, n*n*n*n);

    return vec4(vec3(finalNoise), 1.);
}



        void main() {
        `,
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <color_fragment>`,
        `
#if defined( USE_COLOR_ALPHA )

	diffuseColor *= vColor;

#elif defined( USE_COLOR )

	diffuseColor.rgb *= vColor;

#endif

diffuseColor.rgb *= getFireColor().rgb;
        `,
      )

      console.log(shader.fragmentShader)
      //  = /* glsl */ ``
    }
    //
  }

  return mat
}
