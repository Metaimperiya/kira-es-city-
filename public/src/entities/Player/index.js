import * as THREE from 'three';

export class Player {
    constructor(scene, isLocalPlayer = false) {
        this.scene = scene;
        this.isLocalPlayer = isLocalPlayer;
        
        // Создаем контейнер для игрока
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);

        // Количество частиц и массивы
        this.N = 28000;
        this.initParticles();
    }

    // Вспомогательный метод для текстур символов
    makeTexture(char) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.font = 'Bold 44px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        ctx.fillText(char, 32, 32);
        return new THREE.CanvasTexture(c);
    }

    // Маски лица
    inFace(x, y, z) {
        if (Math.hypot(x + 14, y - 97, z - 30) < 7) return true;
        if (Math.hypot(x - 14, y - 97, z - 30) < 7) return true;
        if (Math.hypot(x + 10, y - 80, z - 30) < 4) return true;
        if (Math.hypot(x - 10, y - 80, z - 30) < 4) return true;
        if (Math.hypot(x, y - 82, z - 30) < 4) return true;
        if (Math.hypot(x, y - 90, z - 34) < 3) return true;
        return false;
    }

    initParticles() {
        const glyphs = '01XYZSYS_ERR⌘⚡☠∆ΞΨΩµ§#@&%*+=-:;<>█▓▒░'.split('');
        const textures = glyphs.map(g => this.makeTexture(g));

        this.geo = new THREE.BufferGeometry();
        this.pos = new Float32Array(this.N * 3);
        this.base = new Float32Array(this.N * 3);
        this.col = new Float32Array(this.N * 3);
        this.flags = new Uint8Array(this.N);

        const colSkin = new THREE.Color(0x0055ff);
        const colBone = new THREE.Color(0x00ffff);
        const colBrain = new THREE.Color(0xff0088);

        for (let i = 0; i < this.N; i++) {
            let x = 0, y = 0, z = 0;
            let flag = 0;
            const rnd = Math.random();

            if (rnd < 0.35) {
                flag = 0;
                const part = Math.random();
                if (part < 0.2) {
                    const u = Math.random() * Math.PI * 2;
                    const v = Math.acos(2 * Math.random() - 1);
                    const r = 25 + Math.random() * 4;
                    x = r * Math.sin(v) * Math.cos(u);
                    y = 105 + r * Math.sin(v) * Math.sin(u) * 1.1;
                    z = r * Math.cos(v);

                    if (this.inFace(x, y, z)) {
                        const u2 = Math.random() * Math.PI * 2;
                        const v2 = Math.acos(2 * Math.random() - 1);
                        const r2 = 27 + Math.random() * 3;
                        x = r2 * Math.sin(v2) * Math.cos(u2);
                        y = 105 + r2 * Math.sin(v2) * Math.sin(u2) * 1.1;
                        z = r2 * Math.cos(v2);
                    }
                    this.col[i * 3] = colSkin.r;
                    this.col[i * 3 + 1] = colSkin.g;
                    this.col[i * 3 + 2] = colSkin.b;

                } else if (part < 0.5) {
                    const h = Math.random();
                    const w = (1 - h * 0.2) * (26 + Math.random() * 4);
                    const a = Math.random() * Math.PI * 2;
                    const r = Math.random() * w;
                    x = Math.cos(a) * r;
                    y = 10 + h * 75;
                    z = Math.sin(a) * (r * 0.6);
                    this.col[i * 3] = colSkin.r;
                    this.col[i * 3 + 1] = colSkin.g;
                    this.col[i * 3 + 2] = colSkin.b;

                } else if (part < 0.7) {
                    const side = Math.random() > 0.5 ? 1 : -1;
                    const p = Math.random();
                    x = side * (32 + p * 5 + Math.random() * 4);
                    y = 75 - p * 65 + Math.random() * 6;
                    z = (Math.random() - 0.5) * 12;
                    this.col[i * 3] = colSkin.r;
                    this.col[i * 3 + 1] = colSkin.g;
                    this.col[i * 3 + 2] = colSkin.b;

                } else {
                    const side = Math.random() > 0.5 ? 1 : -1;
                    const p = Math.random();
                    const knee = Math.sin(p * Math.PI) * 12;
                    x = side * (14 + p * 8 + Math.random() * 4);
                    y = 10 - p * 90 + Math.random() * 6;
                    z = knee + (Math.random() - 0.5) * 10;
                    if (p > 0.78) {
                        z += 16 + Math.random() * 6;
                        x += side * (3 + Math.random() * 4);
                    }
                    this.col[i * 3] = colSkin.r;
                    this.col[i * 3 + 1] = colSkin.g;
                    this.col[i * 3 + 2] = colSkin.b;
                }
            } else {
                // Кости/Скелет/Мозг
                flag = 1;
                x = (Math.random() - 0.5) * 10;
                y = Math.random() * 100;
                z = (Math.random() - 0.5) * 10;
                this.col[i * 3] = colBone.r;
                this.col[i * 3 + 1] = colBone.g;
                this.col[i * 3 + 2] = colBone.b;
            }

            this.pos[i * 3] = x;
            this.pos[i * 3 + 1] = y - 10;
            this.pos[i * 3 + 2] = z;
            this.base[i * 3] = x;
            this.base[i * 3 + 1] = y - 10;
            this.base[i * 3 + 2] = z;
            this.flags[i] = flag;
        }

        this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
        this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));

        const mat = new THREE.PointsMaterial({
            size: 1.5, // Подогнал размер точек под масштаб обычных сцен
            map: textures[0],
            transparent: true,
            opacity: 0.85,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });

        this.cloud = new THREE.Points(this.geo, mat);
        
        // Уменьшим общие габариты персонажа (оригинальные координаты ~200 единиц)
        this.cloud.scale.set(0.02, 0.02, 0.02); 
        this.mesh.add(this.cloud);
    }

    // Вызывать этот метод в игровом цикле (requestAnimationFrame)
    update(time) {
        const p = this.geo.attributes.position;
        for (let i = 0; i < this.N; i++) {
            const bx = this.base[i * 3],
                  by = this.base[i * 3 + 1],
                  bz = this.base[i * 3 + 2];
            const nx = Math.sin(time * 1.7 + by * 0.04) * 1.2 + Math.sin(time * 0.9 + bx * 0.03) * 0.8;
            const ny = Math.cos(time * 1.4 + bx * 0.04) * 1.2 + Math.sin(time * 1.1 + bz * 0.03) * 0.8;
            const nz = Math.sin(time * 1.6 + bz * 0.04) * 1.2 + Math.cos(time * 0.8 + by * 0.03) * 0.8;
            
            p.setXYZ(i, bx + nx, by + ny, bz + nz);
        }
        p.needsUpdate = true;
    }

    // Метод для перекочевывания игрока по координатам
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}
