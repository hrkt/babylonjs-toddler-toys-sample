import * as BABYLON from 'babylonjs'
import * as CANNON from 'cannon'

window['CANNON'] = CANNON

export default class MainScene {
  private _canvas: HTMLCanvasElement
  private _engine: BABYLON.Engine
  private _scene: BABYLON.Scene

  private _camera: BABYLON.FreeCamera
  private _light: BABYLON.Light
  private _balls: BABYLON.Mesh[]
  private _materials: BABYLON.Material[]
  private _treeMaterial: BABYLON.Material
  private _assetsManager: BABYLON.AssetsManager
  private _textures: BABYLON.Texture[]

  // you can change some positions here.
  private BALL_DEFAULT_X_POSITION = -4
  private BALL_DEFAULT_Y_POSITION = 20
  private BALL_DEFAULT_RESTART_Y_POSITION = 30
  private BALL_DEFAULT_Y_POSITION_INTERVAL = 10
  private DEFAULT_BALLS = 10
  private DEFAULT_GRAVITY_Y = -9.81
  private DEFAULT_SLOPE_DURATION_Y = 5
  private DEFAULT_SLOPE_ANGLE = Math.PI / 2 / 12

  constructor(canvasElement: string) {
    this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement
    this._engine = new BABYLON.Engine(this._canvas, true)
    this._scene = new BABYLON.Scene(this._engine)
    this._assetsManager = new BABYLON.AssetsManager(this._scene)
    this._textures = []
    this.loadAssets()
  }

  loadAssets() {
    const textures = [
      {name: "tree", src: "img/tree.jpg"}
    ]
    textures.map(t => this._assetsManager.addTextureTask(t.name, t.src))
    .map(task => task.onSuccess = (result) => {
        this._textures[result.name] = result.texture
        console.log("load task finished: " + result.name)

      })
    this._assetsManager.onFinish = () => {
      console.log("asset manager: load finished.")
    }
    this._assetsManager.load()
  }


  reset() {
    console.log('reset fired in main-scene')
    this._engine.stopRenderLoop()
    this.resetBalls()
    this._engine.runRenderLoop(() => {
      this._scene.render()
    })
  }

  setupCamera() {
    // this._camera = new BABYLON.FreeCamera(
    //   'camera1',
    //   new BABYLON.Vector3(0, 10, -40),
    //   this._scene
    // )
    this._camera = new BABYLON.TouchCamera(
      'camera1',
      new BABYLON.Vector3(0, 10, -40),
      this._scene
    )
    this._camera.setTarget(new BABYLON.Vector3(0, 10, 0))
    this._camera.attachControl(this._canvas, false)
  }

  preparePlasticMaterials() {
    const redMat = new BABYLON.StandardMaterial('redMat', this._scene)
    redMat.emissiveColor = new BABYLON.Color3(1, 0, 0)
    const greenMat = new BABYLON.StandardMaterial('greenMat', this._scene)
    greenMat.emissiveColor = new BABYLON.Color3(0, 1, 0)
    const blueMat = new BABYLON.StandardMaterial('blueMat', this._scene)
    blueMat.emissiveColor = new BABYLON.Color3(0, 0, 1)
    const whiteMat = new BABYLON.StandardMaterial('whiteMat', this._scene)
    whiteMat.emissiveColor = new BABYLON.Color3(1, 1, 1)

    this._materials = [redMat, greenMat, blueMat, whiteMat]
  }

  resetBalls() {
    if(null != this._balls) {
      for(let i = this._balls.length - 1; i >= 0; i--) {
        this._balls[i].dispose()
      }
    }

    this._balls = []
    for (let i = 0; i < this.DEFAULT_BALLS; i++) {
      let sphere = BABYLON.MeshBuilder.CreateSphere(
        'sphere1',
        { segments: 16, diameter: 1 },
        this._scene
      )
      sphere.physicsImpostor = new BABYLON.PhysicsImpostor(
        sphere,
        BABYLON.PhysicsImpostor.SphereImpostor,
        { mass: 1, friction: 0, restitution: 0.2 },
        this._scene
      )
      sphere.material = this._materials[i % this._materials.length]

      sphere.setAbsolutePosition(new BABYLON.Vector3(
        this.BALL_DEFAULT_X_POSITION, this.BALL_DEFAULT_Y_POSITION, 0))
      sphere.position.y = sphere.position.y + i * this.BALL_DEFAULT_Y_POSITION_INTERVAL
      this._balls.push(sphere)

      this._scene.onAfterRenderObservable.add(() => {
        for(let i = 0; i < this._balls.length; i++) {
          const b = this._balls[i]
          if(b.position.y < -10) {
            b.position.x = this.BALL_DEFAULT_X_POSITION
            b.position.y = this.BALL_DEFAULT_RESTART_Y_POSITION
            b.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0))
          }
        }
      })
    }
  }

  initializeSceneObject() {
    const gravity = new BABYLON.Vector3(0.0, this.DEFAULT_GRAVITY_Y, 0.0)
    this._scene.gravity = gravity
    this._scene.enablePhysics(gravity, new BABYLON.CannonJSPlugin())
    this._scene.ambientColor = new BABYLON.Color3(1, 1, 1)
    this._scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.2, 1.0)
  }

  setupSkybox() {
    const envTexture = new BABYLON.CubeTexture("img/TropicalSunnyDay", this._scene)
    this._scene.createDefaultSkybox(envTexture, true, 600)
  }

  setupLights() {
    this._light = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, 1, 0),
      this._scene
    )
  }

  prpareTreeMaterial() {
    console.log("load tree material")
    const treeMaterial = new BABYLON.StandardMaterial('myMaterial', this._scene)
    treeMaterial.diffuseTexture = new BABYLON.Texture("./img/tree.jpg", this._scene)
    this._treeMaterial = treeMaterial
  }

  setupSlopes() {
    for (let i = 0; i < 5; i++) {
      const slope1 = BABYLON.MeshBuilder.CreateBox(
        'slope1',
        { width: 20, height: 0.5, depth: 5 },
        this._scene
      )

      const posX = i % 2 == 0 ? -10 : 10
      slope1.setAbsolutePosition(new BABYLON.Vector3(
        posX, this.DEFAULT_SLOPE_DURATION_Y * i + 5, 0))

      const axis = new BABYLON.Vector3(0, 0, 1)
      const angle = i % 2 == 0 ? -this.DEFAULT_SLOPE_ANGLE : this.DEFAULT_SLOPE_ANGLE
      const quaternion = BABYLON.Quaternion.RotationAxis(axis, angle)
      slope1.rotationQuaternion = quaternion
      slope1.physicsImpostor = new BABYLON.PhysicsImpostor(
        slope1,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.1 }
      )
      slope1.material = this._treeMaterial
    }
  }

  setupGround() {
    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground1',
      { width: 20, height: 20, subdivisions: 2 },
      this._scene
    )
    const groundImposer = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5, restitution: 0.9 }
    )
    ground.physicsImpostor = groundImposer
    ground.material = this._treeMaterial
  }

  createScene() {
    this.initializeSceneObject()
    this.setupCamera()
    this.preparePlasticMaterials()
    this.prpareTreeMaterial()

    this.setupSkybox()
    this.setupLights()

    this.resetBalls()

    this.setupSlopes()
    this.setupGround()
  }

  doRender(): void {
    this.reset()

    window.addEventListener('resize', () => {
      this._engine.resize()
    })
  }
}
