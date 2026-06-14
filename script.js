// ============================================
//  AVES VOANDO — Main Script
// ============================================

(function () {
    'use strict';

    // --- DOM Elements ---
    const canvas = document.getElementById('bird-canvas');
    const ctx = canvas.getContext('2d');
    const sky = document.getElementById('sky');
    const celestialBody = document.getElementById('celestial-body');
    const timeSlider = document.getElementById('time-slider');
    const birdSlider = document.getElementById('bird-slider');
    const birdCountLabel = document.getElementById('bird-count');
    const cloudsFar = document.getElementById('clouds-far');
    const cloudsMid = document.getElementById('clouds-mid');
    const cloudsNear = document.getElementById('clouds-near');

    // --- State ---
    let birds = [];
    let targetBirdCount = 25;
    let timeOfDay = 0.35; // 0 = midnight, 0.5 = noon, 1 = midnight
    let stars = [];
    let mouseX = -1;
    let mouseY = -1;

    // ============================================
    //  SKY GRADIENT PRESETS
    // ============================================

    const skyPresets = [
        // 0.0 - Deep Night
        { stops: ['#0a0a1a', '#0d0d2b', '#111140', '#0d0d2b', '#0a0a1a'], sun: { color: '#c0c8e0', glow: 'rgba(150,170,220,0.2)', y: 0.85, size: 60, isMoon: true } },
        // 0.15 - Pre-dawn
        { stops: ['#0f1030', '#1a1a50', '#2d2060', '#4a2040', '#6b3050'], sun: { color: '#ff9060', glow: 'rgba(255,120,60,0.15)', y: 0.9, size: 70, isMoon: false } },
        // 0.25 - Dawn
        { stops: ['#1a1a40', '#2d2b6b', '#4a3f8a', '#e07850', '#fce38a'], sun: { color: '#ffcc60', glow: 'rgba(255,180,80,0.3)', y: 0.7, size: 100, isMoon: false } },
        // 0.35 - Golden Hour
        { stops: ['#2a2070', '#5040a0', '#d06050', '#f5a040', '#fce38a'], sun: { color: '#ffd97d', glow: 'rgba(255,200,80,0.4)', y: 0.55, size: 120, isMoon: false } },
        // 0.5 - Noon
        { stops: ['#1a6faa', '#2890c8', '#40afe0', '#70ccf0', '#a0e0ff'], sun: { color: '#fffff0', glow: 'rgba(255,255,220,0.4)', y: 0.2, size: 90, isMoon: false } },
        // 0.65 - Afternoon
        { stops: ['#1a5a90', '#3088b8', '#50a8d0', '#80c8e8', '#b0e0f5'], sun: { color: '#fff8e0', glow: 'rgba(255,240,180,0.35)', y: 0.35, size: 95, isMoon: false } },
        // 0.75 - Sunset
        { stops: ['#1a1040', '#3a2070', '#a04060', '#e07040', '#ffc860'], sun: { color: '#ff8040', glow: 'rgba(255,100,40,0.4)', y: 0.7, size: 130, isMoon: false } },
        // 0.85 - Dusk
        { stops: ['#0d0d25', '#1a1545', '#302060', '#502848', '#703040'], sun: { color: '#e06040', glow: 'rgba(200,60,40,0.2)', y: 0.88, size: 80, isMoon: false } },
        // 1.0 - Night
        { stops: ['#0a0a1a', '#0d0d2b', '#111140', '#0d0d2b', '#0a0a1a'], sun: { color: '#c0c8e0', glow: 'rgba(150,170,220,0.2)', y: 0.85, size: 60, isMoon: true } },
    ];

    const presetPositions = [0, 0.15, 0.25, 0.35, 0.5, 0.65, 0.75, 0.85, 1.0];

    // ============================================
    //  UTILITY FUNCTIONS
    // ============================================

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function lerpColor(c1, c2, t) {
        // Parse hex colors
        const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
        const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
        const r = Math.round(lerp(r1, r2, t));
        const g = Math.round(lerp(g1, g2, t));
        const b = Math.round(lerp(b1, b2, t));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // ============================================
    //  SKY RENDERING
    // ============================================

    function getInterpolatedSky(t) {
        // Find surrounding presets
        let i = 0;
        for (let j = 0; j < presetPositions.length - 1; j++) {
            if (t >= presetPositions[j] && t <= presetPositions[j + 1]) {
                i = j;
                break;
            }
        }

        const range = presetPositions[i + 1] - presetPositions[i];
        const localT = (t - presetPositions[i]) / range;

        const p1 = skyPresets[i];
        const p2 = skyPresets[i + 1];

        const stops = p1.stops.map((c, idx) => lerpColor(c, p2.stops[idx], localT));

        const sun = {
            color: lerpColor(p1.sun.color, p2.sun.color, localT),
            glow: p1.sun.glow, // simplified
            y: lerp(p1.sun.y, p2.sun.y, localT),
            size: lerp(p1.sun.size, p2.sun.size, localT),
            isMoon: localT < 0.5 ? p1.sun.isMoon : p2.sun.isMoon,
        };

        return { stops, sun };
    }

    function updateSky() {
        const data = getInterpolatedSky(timeOfDay);

        // Update gradient
        const gradient = `linear-gradient(180deg, ${data.stops[0]} 0%, ${data.stops[1]} 25%, ${data.stops[2]} 50%, ${data.stops[3]} 75%, ${data.stops[4]} 100%)`;
        sky.style.background = gradient;

        // Update celestial body
        const sunX = 50 + Math.sin((timeOfDay - 0.5) * Math.PI) * 20;
        celestialBody.style.left = sunX + '%';
        celestialBody.style.top = (data.sun.y * 100) + '%';
        celestialBody.style.width = data.sun.size + 'px';
        celestialBody.style.height = data.sun.size + 'px';

        if (data.sun.isMoon) {
            celestialBody.style.background = `radial-gradient(circle, #e8e8f0 0%, #c0c8e0 60%, #8090b0 100%)`;
            celestialBody.style.boxShadow = `0 0 40px 15px rgba(180,200,240,0.3), 0 0 80px 40px rgba(150,170,220,0.12)`;
        } else {
            celestialBody.style.background = `radial-gradient(circle, #fffff0 0%, ${data.sun.color} 50%, rgba(255,150,60,0.6) 100%)`;
            celestialBody.style.boxShadow = `0 0 ${data.sun.size * 0.5}px ${data.sun.size * 0.2}px ${data.sun.glow}, 0 0 ${data.sun.size}px ${data.sun.size * 0.4}px rgba(255,160,50,0.12)`;
        }

        // Update stars visibility
        const nightIntensity = Math.max(0, 1 - Math.abs(timeOfDay - 0.5) * 4);
        // Stars are visible when nightIntensity is low (i.e. close to 0 or 1)
        const starOpacity = timeOfDay < 0.2 || timeOfDay > 0.8 ? 1 : timeOfDay < 0.3 ? 1 - (timeOfDay - 0.2) * 10 : timeOfDay > 0.7 ? (timeOfDay - 0.7) * 10 : 0;

        stars.forEach(star => {
            star.style.opacity = starOpacity * parseFloat(star.dataset.baseOpacity);
        });

        // Update cloud colors based on time
        const cloudOpacity = timeOfDay > 0.2 && timeOfDay < 0.8 ? 0.25 : 0.1;
        document.querySelectorAll('.cloud').forEach(cloud => {
            const isWarm = timeOfDay > 0.2 && timeOfDay < 0.4 || timeOfDay > 0.7 && timeOfDay < 0.85;
            cloud.style.background = isWarm
                ? `rgba(255, 200, 150, ${cloudOpacity})`
                : timeOfDay < 0.2 || timeOfDay > 0.85
                    ? `rgba(100, 120, 180, ${cloudOpacity * 0.6})`
                    : `rgba(255, 255, 255, ${cloudOpacity})`;
        });
    }

    // ============================================
    //  CLOUDS
    // ============================================

    function createClouds() {
        const layers = [
            { el: cloudsFar, count: 4, minW: 200, maxW: 400, minH: 30, maxH: 60, minDur: 120, maxDur: 200, yRange: [5, 35] },
            { el: cloudsMid, count: 5, minW: 150, maxW: 300, minH: 25, maxH: 50, minDur: 80, maxDur: 140, yRange: [10, 45] },
            { el: cloudsNear, count: 3, minW: 180, maxW: 350, minH: 30, maxH: 55, minDur: 50, maxDur: 90, yRange: [15, 50] },
        ];

        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const cloud = document.createElement('div');
                cloud.className = 'cloud';
                const w = randomRange(layer.minW, layer.maxW);
                const h = randomRange(layer.minH, layer.maxH);
                const y = randomRange(layer.yRange[0], layer.yRange[1]);
                const dur = randomRange(layer.minDur, layer.maxDur);
                const delay = randomRange(-dur, 0);

                cloud.style.width = w + 'px';
                cloud.style.height = h + 'px';
                cloud.style.top = y + '%';
                cloud.style.animationDuration = dur + 's';
                cloud.style.animationDelay = delay + 's';

                layer.el.appendChild(cloud);
            }
        });
    }

    // ============================================
    //  STARS
    // ============================================

    function createStars() {
        const count = 80;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 60 + '%';
            star.style.animationDelay = Math.random() * 5 + 's';
            star.style.animationDuration = (2 + Math.random() * 3) + 's';
            const baseOp = 0.3 + Math.random() * 0.7;
            star.dataset.baseOpacity = baseOp;
            const size = Math.random() < 0.1 ? 3 : Math.random() < 0.3 ? 2 : 1.5;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            sky.appendChild(star);
            stars.push(star);
        }
    }

    // ============================================
    //  BIRD SIMULATION
    // ============================================

    class Bird {
        constructor() {
            this.reset(true);
        }

        reset(randomX = false) {
            // Bird properties
            this.size = randomRange(8, 28); // wingspan
            this.depth = this.size / 28; // 0-1 depth factor (bigger = closer)

            // Position
            if (randomX) {
                this.x = randomRange(-100, canvas.width + 100);
            } else {
                // Enter from left or right edge
                this.x = Math.random() < 0.5 ? -this.size * 4 : canvas.width + this.size * 4;
            }
            this.y = randomRange(canvas.height * 0.05, canvas.height * 0.75);

            // Velocity
            const speedBase = randomRange(1.2, 3.5) * (0.5 + this.depth * 0.5);
            this.vx = (Math.random() < 0.5 ? 1 : -1) * speedBase;
            this.vy = randomRange(-0.3, 0.3);

            // Wing animation
            this.wingPhase = Math.random() * Math.PI * 2;
            this.wingSpeed = randomRange(3, 7);
            this.wingAmplitude = randomRange(0.6, 1.0);

            // Soaring
            this.soarTimer = 0;
            this.soarDuration = 0;
            this.isSoaring = false;

            // Drift
            this.driftPhase = Math.random() * Math.PI * 2;
            this.driftSpeed = randomRange(0.3, 0.8);
            this.driftAmplitude = randomRange(15, 40);

            // Color
            this.darkness = randomRange(0.1, 0.5);

            // Flock influence
            this.flockX = 0;
            this.flockY = 0;

            this.alive = true;
        }

        update(dt) {
            // Natural wave drift
            this.driftPhase += this.driftSpeed * dt;
            const driftY = Math.sin(this.driftPhase) * this.driftAmplitude * dt;

            // Soaring logic
            if (!this.isSoaring && Math.random() < 0.002) {
                this.isSoaring = true;
                this.soarDuration = randomRange(1, 3);
                this.soarTimer = 0;
            }

            if (this.isSoaring) {
                this.soarTimer += dt;
                if (this.soarTimer > this.soarDuration) {
                    this.isSoaring = false;
                }
            }

            // Wing animation
            if (!this.isSoaring) {
                this.wingPhase += this.wingSpeed * dt;
            }

            // Mouse avoidance
            if (mouseX >= 0 && mouseY >= 0) {
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const avoidRadius = 150;
                if (dist < avoidRadius && dist > 0) {
                    const force = (1 - dist / avoidRadius) * 2;
                    this.vx += (dx / dist) * force * dt * 60;
                    this.vy += (dy / dist) * force * dt * 60;
                }
            }

            // Slight flock steering (subtle)
            this.vx += this.flockX * 0.01 * dt;
            this.vy += this.flockY * 0.01 * dt;

            // Speed clamping
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const maxSpeed = 5;
            if (speed > maxSpeed) {
                this.vx = (this.vx / speed) * maxSpeed;
                this.vy = (this.vy / speed) * maxSpeed;
            }

            // Vertical tendency towards center
            const centerY = canvas.height * 0.4;
            this.vy += (centerY - this.y) * 0.0002;

            // Apply movement
            this.x += this.vx * dt * 60;
            this.y += (this.vy + driftY) * dt * 60;

            // Boundary check
            const margin = this.size * 6;
            if (this.x < -margin || this.x > canvas.width + margin ||
                this.y < -margin || this.y > canvas.height + margin) {
                this.reset(false);
            }
        }

        draw(ctx, timeOfDay) {
            const wingAngle = this.isSoaring
                ? Math.sin(this.wingPhase) * 0.1 + 0.2
                : Math.sin(this.wingPhase) * this.wingAmplitude;

            // Color based on time of day
            let r, g, b, alpha;
            if (timeOfDay > 0.3 && timeOfDay < 0.7) {
                // Daytime - dark silhouettes
                r = Math.round(30 + this.darkness * 40);
                g = Math.round(25 + this.darkness * 35);
                b = Math.round(35 + this.darkness * 45);
                alpha = 0.7 + this.depth * 0.3;
            } else {
                // Sunset/night - warm silhouettes
                r = Math.round(20 + this.darkness * 60);
                g = Math.round(15 + this.darkness * 30);
                b = Math.round(25 + this.darkness * 35);
                alpha = 0.6 + this.depth * 0.3;
            }

            ctx.save();
            ctx.translate(this.x, this.y);

            // Tilt in direction of movement
            const tilt = Math.atan2(this.vy, this.vx) * 0.15;
            ctx.rotate(tilt);

            // Flip if going left
            if (this.vx < 0) {
                ctx.scale(-1, 1);
            }

            const ws = this.size; // wingspan
            const bodyLen = ws * 0.4;

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
            ctx.lineWidth = Math.max(1.2, this.size * 0.08);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Body
            ctx.beginPath();
            ctx.moveTo(-bodyLen * 0.5, 0);
            ctx.quadraticCurveTo(0, -bodyLen * 0.1, bodyLen * 0.6, 0);
            ctx.stroke();

            // Left wing
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const lwTip = wingAngle * ws * 0.5;
            ctx.quadraticCurveTo(
                -ws * 0.25, -lwTip * 0.6,
                -ws * 0.5, -lwTip
            );
            // Wing feather tips
            ctx.quadraticCurveTo(
                -ws * 0.55, -lwTip * 0.8,
                -ws * 0.45, -lwTip * 0.3
            );
            ctx.stroke();

            // Right wing
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const rwTip = wingAngle * ws * 0.5;
            ctx.quadraticCurveTo(
                ws * 0.25, -rwTip * 0.6,
                ws * 0.5, -rwTip
            );
            ctx.quadraticCurveTo(
                ws * 0.55, -rwTip * 0.8,
                ws * 0.45, -rwTip * 0.3
            );
            ctx.stroke();

            // Tail
            ctx.beginPath();
            ctx.moveTo(-bodyLen * 0.5, 0);
            ctx.lineTo(-bodyLen * 0.7, bodyLen * 0.15);
            ctx.moveTo(-bodyLen * 0.5, 0);
            ctx.lineTo(-bodyLen * 0.7, -bodyLen * 0.1);
            ctx.stroke();

            ctx.restore();
        }
    }

    // Simple flock behavior
    function updateFlocking() {
        const flockRadius = 200;

        for (let i = 0; i < birds.length; i++) {
            let avgVx = 0, avgVy = 0;
            let count = 0;

            for (let j = 0; j < birds.length; j++) {
                if (i === j) continue;
                const dx = birds[j].x - birds[i].x;
                const dy = birds[j].y - birds[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < flockRadius) {
                    avgVx += birds[j].vx;
                    avgVy += birds[j].vy;
                    count++;

                    // Separation
                    if (dist < 40) {
                        birds[i].flockX -= dx * 0.05;
                        birds[i].flockY -= dy * 0.05;
                    }
                }
            }

            if (count > 0) {
                // Alignment
                birds[i].flockX += (avgVx / count - birds[i].vx) * 0.3;
                birds[i].flockY += (avgVy / count - birds[i].vy) * 0.3;
            }
        }
    }

    // ============================================
    //  CANVAS RESIZE
    // ============================================

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ============================================
    //  ANIMATION LOOP
    // ============================================

    let lastTime = performance.now();
    let flockTimer = 0;

    function animate(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta
        lastTime = now;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update bird count
        while (birds.length < targetBirdCount) {
            birds.push(new Bird());
        }
        while (birds.length > targetBirdCount) {
            birds.pop();
        }

        // Flock update every few frames
        flockTimer += dt;
        if (flockTimer > 0.2) {
            updateFlocking();
            flockTimer = 0;
        }

        // Sort by depth (smaller birds drawn first = farther away)
        birds.sort((a, b) => a.size - b.size);

        // Update and draw birds
        for (const bird of birds) {
            bird.update(dt);
            bird.draw(ctx, timeOfDay);
        }

        requestAnimationFrame(animate);
    }

    // ============================================
    //  EVENT LISTENERS
    // ============================================

    window.addEventListener('resize', resizeCanvas);

    timeSlider.addEventListener('input', (e) => {
        timeOfDay = e.target.value / 100;
        updateSky();
    });

    birdSlider.addEventListener('input', (e) => {
        targetBirdCount = parseInt(e.target.value);
        birdCountLabel.textContent = targetBirdCount;
    });

    // Mouse tracking for bird avoidance
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouseX = -1;
        mouseY = -1;
    });

    // Touch support
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    });

    window.addEventListener('touchend', () => {
        mouseX = -1;
        mouseY = -1;
    });

    // ============================================
    //  INITIALIZATION
    // ============================================

    function init() {
        resizeCanvas();
        createClouds();
        createStars();
        updateSky();

        // Create initial birds
        for (let i = 0; i < targetBirdCount; i++) {
            birds.push(new Bird());
        }

        // Start animation
        requestAnimationFrame(animate);
    }

    init();
})();
