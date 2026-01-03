// ===================================
// ФАЙЛ: tests/__mocks__/three-addons.js
// Mock для Three.js addons
// ===================================

export class GLTFLoader {
  load(path, onLoad, onProgress, onError) {
    setTimeout(() => {
      onLoad({
        scene: {
          clone: () => ({
            traverse: jest.fn(),
            position: { set: jest.fn(), x: 0, y: 0, z: 0 },
            rotation: { set: jest.fn(), y: 0 },
            scale: { setScalar: jest.fn() },
            visible: true,
            children: []
          })
        }
      });
    }, 10);
  }
}

export const ARButton = {
  createButton: jest.fn((renderer, options) => {
    const button = document.createElement('button');
    button.textContent = 'AR';
    return button;
  })
};