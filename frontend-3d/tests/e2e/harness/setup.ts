/**
 * Headless DOM, Canvas, and AnimationFrame stubs for Headless Node.js Execution.
 * Ensures Three.js mathematical structures, scene graphs, and DOM event listeners
 * function seamlessly during testing without external browser drivers.
 */

if (typeof (globalThis as any).window === 'undefined') {
  const listeners: Record<string, Function[]> = {};

  const createMockElement = (tag: string = 'div'): any => {
    const el: any = {
      tagName: tag.toUpperCase(),
      nodeName: tag.toUpperCase(),
      id: '',
      className: '',
      style: {
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'absolute',
      },
      classList: {
        classes: new Set<string>(),
        add(...names: string[]) {
          names.forEach((n) => this.classes.add(n));
        },
        remove(...names: string[]) {
          names.forEach((n) => this.classes.delete(n));
        },
        contains(name: string) {
          return this.classes.has(name);
        },
        toggle(name: string) {
          if (this.classes.has(name)) {
            this.classes.delete(name);
            return false;
          } else {
            this.classes.add(name);
            return true;
          }
        },
      },
      innerHTML: '',
      textContent: '',
      children: [] as any[],
      childNodes: [] as any[],
      parentElement: null,
      parentNode: null,
      appendChild(child: any) {
        this.children.push(child);
        this.childNodes.push(child);
        child.parentElement = this;
        child.parentNode = this;
        return child;
      },
      removeChild(child: any) {
        const idx = this.children.indexOf(child);
        if (idx >= 0) this.children.splice(idx, 1);
        const cIdx = this.childNodes.indexOf(child);
        if (cIdx >= 0) this.childNodes.splice(cIdx, 1);
        child.parentElement = null;
        child.parentNode = null;
        return child;
      },
      querySelector: (sel: string) => null,
      querySelectorAll: (sel: string) => [],
      addEventListener: (evt: string, fn: Function) => {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt].push(fn);
      },
      removeEventListener: (evt: string, fn: Function) => {
        if (listeners[evt]) {
          listeners[evt] = listeners[evt].filter((f) => f !== fn);
        }
      },
      dispatchEvent: (evt: any) => {
        const type = typeof evt === 'string' ? evt : evt.type;
        if (listeners[type]) {
          listeners[type].forEach((fn) => fn(evt));
        }
        return true;
      },
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        right: 1920,
        bottom: 1080,
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
      }),
      clientWidth: 1920,
      clientHeight: 1080,
      offsetWidth: 1920,
      offsetHeight: 1080,
      getContext: (contextId: string, options?: any) => {
        if (contextId === 'webgl' || contextId === 'webgl2') {
          return {
            canvas: el,
            drawingBufferWidth: 1920,
            drawingBufferHeight: 1080,
            getExtension: (name: string) => null,
            getParameter: (pname: number) => 0,
            getShaderPrecisionFormat: () => ({ precision: 1, rangeMin: 1, rangeMax: 1 }),
            createShader: () => ({}),
            shaderSource: () => {},
            compileShader: () => {},
            getShaderParameter: () => true,
            createProgram: () => ({}),
            attachShader: () => {},
            linkProgram: () => {},
            getProgramParameter: () => true,
            useProgram: () => {},
            createBuffer: () => ({}),
            bindBuffer: () => {},
            bufferData: () => {},
            enable: () => {},
            disable: () => {},
            clear: () => {},
            clearColor: () => {},
            viewport: () => {},
            drawArrays: () => {},
            drawElements: () => {},
            createTexture: () => ({}),
            bindTexture: () => {},
            texParameteri: () => {},
            texImage2D: () => {},
          };
        }
        if (contextId === '2d') {
          return {
            canvas: el,
            fillRect: () => {},
            clearRect: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray(4) }),
            putImageData: () => {},
            createImageData: () => ({ data: new Uint8ClampedArray(4) }),
            setTransform: () => {},
            drawImage: () => {},
            save: () => {},
            fillText: () => {},
            restore: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            stroke: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            arc: () => {},
            fill: () => {},
          };
        }
        return null;
      },
    };
    return el;
  };

  const body = createMockElement('body');
  const sceneContainer = createMockElement('div');
  sceneContainer.id = 'scene-container';
  const hudOverlay = createMockElement('div');
  hudOverlay.id = 'hud-overlay';
  const modalRoot = createMockElement('div');
  modalRoot.id = 'modal-root';
  body.appendChild(sceneContainer);
  body.appendChild(hudOverlay);
  body.appendChild(modalRoot);

  const mockDocument: any = {
    createElement: (tag: string) => createMockElement(tag),
    getElementById: (id: string) => {
      if (id === 'scene-container') return sceneContainer;
      if (id === 'hud-overlay') return hudOverlay;
      if (id === 'modal-root') return modalRoot;
      const el = createMockElement('div');
      el.id = id;
      return el;
    },
    querySelector: (sel: string) => {
      if (sel === '#scene-container') return sceneContainer;
      if (sel === '#hud-overlay') return hudOverlay;
      if (sel === '#modal-root') return modalRoot;
      return null;
    },
    querySelectorAll: (sel: string) => [],
    body,
    head: createMockElement('head'),
    documentElement: createMockElement('html'),
    addEventListener: (evt: string, fn: Function) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    removeEventListener: (evt: string, fn: Function) => {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter((f) => f !== fn);
      }
    },
    dispatchEvent: (evt: any) => true,
  };

  (globalThis as any).document = mockDocument;
  (globalThis as any).window = globalThis;
  (globalThis as any).window.document = mockDocument;
  (globalThis as any).window.innerWidth = 1920;
  (globalThis as any).window.innerHeight = 1080;
  (globalThis as any).window.devicePixelRatio = 1;

  try {
    if (!('navigator' in globalThis)) {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'Node.js Headless E2E Test Runner' },
        configurable: true,
        writable: true,
      });
    }
  } catch {
    // Ignore if navigator is non-configurable getter in Node 24
  }

  try {
    if (!('location' in globalThis)) {
      Object.defineProperty(globalThis, 'location', {
        value: { href: 'http://localhost:3001/' },
        configurable: true,
        writable: true,
      });
    }
  } catch {
    // Ignore if location is non-configurable
  }

  (globalThis as any).requestAnimationFrame = (callback: (time: number) => void) => {
    return setTimeout(() => callback(Date.now()), 16);
  };
  (globalThis as any).cancelAnimationFrame = (id: any) => {
    clearTimeout(id);
  };

  if (typeof (globalThis as any).CustomEvent === 'undefined') {
    (globalThis as any).CustomEvent = class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, params: any = {}) {
        this.type = type;
        this.detail = params.detail;
      }
    };
  }
}

export {};
