import { AdditiveBlending, BufferGeometry, Clock, Color, MeshBasicMaterial, Object3D, Points, Vector2 } from 'three'
import { getSkinData } from './Rigged'
import { GPUComputationRenderer } from 'three-stdlib'

export class Runner extends Object3D {
  constructor({ gl, skinnedMesh }) {
    super()

    let geoCount = skinnedMesh.geometry.attributes.position.count * 0.9
    this.gl = gl
    this.ww = Math.floor(Math.pow(geoCount, 0.5))
    this.hh = Math.floor(Math.pow(geoCount, 0.5))

    this.skinnedMesh = skinnedMesh

    this.skinData = getSkinData({ randomSampling: true, ww: this.ww, hh: this.hh, skinnedMesh: skinnedMesh })

    //
    this.tasks = []
    this.work = (st, dt) => {
      this.tasks.forEach((it) => {
        it(st, dt)
      })
    }

    this.onLoop = (fn) => {
      this.tasks.push(fn)
    }

    this.gpu = new GPUComputationRenderer(this.ww, this.hh, gl)
    this.pos0 = this.gpu.createTexture()
    this.move0 = this.gpu.createTexture()
    {
      let array = this.pos0.image.data

      let ii = 0
      for (let y = 0; y < this.hh; y++) {
        for (let x = 0; x < this.ww; x++) {
          array[ii + 0] = 0.0
          array[ii + 1] = 0.0
          array[ii + 2] = 0.0
          array[ii + 3] = Math.random()
          ii += 4.0
        }
      }
      this.pos0.needsUpdate = true
    }

    {
      let array = this.move0.image.data

      let ii = 0
      for (let y = 0; y < this.hh; y++) {
        for (let x = 0; x < this.ww; x++) {
          array[ii + 0] = 0.0
          array[ii + 1] = 0.0
          array[ii + 2] = 0.0
          array[ii + 3] = Math.random()
          ii += 4.0
        }
      }
      this.move0.needsUpdate = true
    }

    this.posVar = this.gpu.addVariable('texturePosition', this.fragmentShaderPos(), this.pos0)
    this.moveVar = this.gpu.addVariable('textureMove', this.fragmentShaderMove(), this.move0)

    let clock1 = new Clock()
    let clock2 = new Clock()
    let sync = (targetVar, clock) => {
      /** @type {SkinnedMesh} */
      let sMesh = this.skinData.skinnedMesh

      // sMesh.skeleton.calculateInverses()
      // sMesh.skeleton.computeBoneTexture()
      // sMesh.skeleton.update()

      targetVar.material.uniforms.u_resolution = { value: new Vector2().fromArray([this.ww, this.hh]) }
      targetVar.material.uniforms.time = { value: clock.getElapsedTime() }
      targetVar.material.uniforms.delta = { value: clock.getDelta() < 0.001 ? 1 / 60 : clock.getDelta() }
      // console.log(targetVar.material.uniforms.delta.value)

      targetVar.material.uniforms.o_layout = { value: this.skinData.o_layout }
      targetVar.material.uniforms.o_position = { value: this.skinData.o_position }
      // targetVar.material.uniforms.o_normal = { value: this.skinData.o_normal }
      // targetVar.material.uniforms.o_uv = { value: this.skinData.o_uv }

      targetVar.material.uniforms.o_skinIndex = { value: this.skinData.o_skinIndex }
      targetVar.material.uniforms.o_skinWeight = { value: this.skinData.o_skinWeight }
      targetVar.material.uniforms.o_o3dMatrix = { value: sMesh.matrix }

      if (sMesh.parent) {
        targetVar.material.uniforms.o_parentMatrix = { value: sMesh.parent.matrix }
      }

      targetVar.material.uniforms.o_bindMatrix = { value: sMesh.bindMatrix }
      targetVar.material.uniforms.o_bindMatrixInverse = { value: sMesh.bindMatrixInverse }
      targetVar.material.uniforms.o_boneTexture = { value: sMesh.skeleton.boneTexture }
      targetVar.material.uniforms.o_boneTextureSize = { value: sMesh.skeleton.boneTextureSize }

      targetVar.material.uniforms.u_mixerProgress = { value: this.u_mixerProgress || 0 }
    }

    this.onLoop(() => {
      sync(this.moveVar, clock1)
      sync(this.posVar, clock2)
    })

    this.gpu.setVariableDependencies(this.posVar, [this.posVar, this.moveVar])
    this.gpu.setVariableDependencies(this.moveVar, [this.moveVar, this.posVar])

    let err = this.gpu.init()
    if (err) {
      console.error(err)
      throw new Error(err)
    }

    this.onLoop(() => {
      this.gpu.compute()
    })

    this.getMoveTexture = () => {
      return this.gpu.getCurrentRenderTarget(this.moveVar).texture
    }
    this.getPositionTexture = () => {
      return this.gpu.getCurrentRenderTarget(this.posVar).texture
    }

    this.add(
      new Display({
        parent: this,
        getMoveTexture: () => {
          return this.gpu.getCurrentRenderTarget(this.moveVar).texture
        },
        getPositionTexture: () => {
          return this.gpu.getCurrentRenderTarget(this.posVar).texture
        },
        getColor: () => {
          return new Color('#ffffff')
        },
      }),
    )
  }
  fragmentShaderPos() {
    return require('./shader/compute.pos.fragment.glsl').default
  }
  fragmentShaderMove() {
    return require('./shader/compute.move.fragment.glsl').default
  }
}

class Display extends Object3D {
  constructor({
    parent,
    getPositionTexture = () => null,
    getMoveTexture = () => null,
    getColor = () => new Color('#ff0000'),
  }) {
    super()

    /** @type {Runner} */
    this.parent = parent
    this.onLoop = (v) => {
      parent.onLoop(v)
    }

    let geometry = new BufferGeometry()
    geometry.setAttribute('position', this.parent.skinData.o_layout.attr)
    geometry.setAttribute('uv', this.parent.skinData.o_layout.attr)

    let shader = new MeshBasicMaterial({
      color: getColor(),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    shader.onBeforeCompile = (shader) => {
      shader.uniforms.dt = { value: 0 }
      shader.uniforms.time = { value: 0 }
      shader.uniforms.u_pos = { value: null }
      shader.uniforms.u_move = { value: null }
      let clock = new Clock()
      this.onLoop(() => {
        shader.uniforms.dt = { value: clock.getDelta() }
        shader.uniforms.time = { value: clock.getElapsedTime() }
        shader.uniforms.u_pos.value = getPositionTexture()
        shader.uniforms.u_move.value = getMoveTexture()
      })

      shader.vertexShader = shader.vertexShader.replace(
        `void main() {`,
        `
        uniform sampler2D u_move;
        varying vec2 vMyUV;
        void main() {`,
      )

      shader.vertexShader = shader.vertexShader.replace(
        `#include <beginnormal_vertex>`,
        `
        vec3 objectNormal = vec3( normal );
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif
      `,
      )

      shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        `
        vec2 myUV = uv.xy;
        vMyUV = myUV;
        vec4 tPosData = texture2D( u_move, uv.xy );
        vec3 transformed = vec3( tPosData.rgb );

        #ifdef USE_ALPHAHASH
          vPosition = vec3( tPosData.rgb );
        #endif
        
      `,
      )

      shader.vertexShader = shader.vertexShader.replace(
        `}`,
        `
          gl_PointSize = 25.0;
        }`,
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `void main() {`,
        `
        // A simple way to create color variation in a cheap way (yes, trigonometrics ARE cheap
        // in the GPU, don't try to be smart and use a triangle wave instead).
        // See https://iquilezles.org/articles/palettes for more information

        uniform float time;
        uniform sampler2D u_move;
        uniform sampler2D u_pos;
        varying vec2 vMyUV;
        vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
          return a + b*cos( 6.28318*(c*t+d) );
        }
        vec3 cosPalette(  float t,  vec3 a,  vec3 b,  vec3 c, vec3 d ){
            return a + b*cos( 6.28318*(c*t+d) );
        }
        void main() {`,
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        /* glsl */ ` 
          #include <dithering_fragment>

          vec4 o_move = texture2D( u_move, vMyUV.xy );
          vec4 o_pos = texture2D( u_pos, vMyUV.xy );

          vec3 velocity = vec3(o_pos.rgb - o_move.rgb) / -25.0;
          vec3 xyz = normalize(velocity);
          float force = (length(xyz.xy) + length(xyz.yz) + length(xyz.zx)) / 3.0;

          float t = o_move.a + o_pos.a + rand(vMyUV.xy);
          // vec3 myColor = 1.0 * pal(time + o_pos.a + o_move.a + abs(o_move.x * 0.005 * -cos(3.0 * time)), vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,0.0,0.5),vec3(0.8,0.90,0.30));
          vec3 myColor = cosPalette(t,vec3(0.63, 0.55, 0.210),vec3(0.5,0.2,0.33),vec3(0.18,0.5,0.6),vec3(0.65, 0.06,0.16));

          if (rand(vMyUV.xy) <= 0.015) {
            myColor += 35.0 * (myColor);
          }

          gl_FragColor.a = 1.0 * (0.5 - length(gl_PointCoord.xy - 0.5));
          gl_FragColor.a = pow(gl_FragColor.a, 2.5);
          gl_FragColor.rgb = myColor;

          if (length(gl_PointCoord.xy - 0.5) > 0.5) {
            discard;
          }
        `,
      )
    }

    this.pts = new Points(geometry, shader)
    this.pts.frustumCulled = false
    this.add(this.pts)

    this.pts.quaternion.copy(this.parent.skinnedMesh.quaternion)
    this.pts.scale.copy(this.parent.skinnedMesh.scale)
    this.pts.position.copy(this.parent.skinnedMesh.position)
    this.pts.rotation.x = Math.PI * 0.5
  }
}
