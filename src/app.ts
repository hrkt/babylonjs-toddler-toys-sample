import MainScene from './main-scene'
window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    let mainScene = new MainScene('renderCanvas')

    // Create the scene.
    mainScene.createScene()

    // Start render loop.
    mainScene.doRender()

    document.getElementById('restartBtn').addEventListener('click', () => {
      console.log("reset event fired.")
      mainScene.reset()
    })
  })

