/* =========================
   1. DATA & 3D MATH
========================= */

// Helper to generate mesh data for Plotly
const generateMesh = (type) => {
    let x = [], y = [], z = [];
    const steps = 30; // Resolution
    
    if (type === 'ellipsoid') {
        // Parametric: x=sinu cosv, y=sinu sinv, z=cosu
        for (let i = 0; i <= steps; i++) {
            let u = (i / steps) * Math.PI;
            for (let j = 0; j <= steps; j++) {
                let v = (j / steps) * 2 * Math.PI;
                x.push(Math.sin(u) * Math.cos(v));
                y.push(Math.sin(u) * Math.sin(v));
                z.push(Math.cos(u));
            }
        }
        return { x, y, z, type: 'mesh3d', color: '#4a90e2', opacity:0.8 };
    }

    if (type === 'cone') {
        for (let i = 0; i <= steps; i++) {
            let u = (i / steps) * 2 * Math.PI; // angle
            for (let j = 0; j <= steps; j++) {
                let v = (j / steps) * 2 - 1; // height -1 to 1
                x.push(v * Math.cos(u));
                y.push(v * Math.sin(u));
                z.push(v); // z = r
            }
        }
        return { x, y, z, type: 'mesh3d', color: '#e67e22', opacity:0.8 };
    }

    // Default Surface Grid generator for functions z=f(x,y)
    let z_data = [];
    let range = 20; 
    let step = 1; 
    
    for (let i = -range; i <= range; i+=step) {
        let row = [];
        let r_x = i/10; // scale down
        for (let j = -range; j <= range; j+=step) {
            let r_y = j/10;
            let val = 0;
            
            if (type === 'elliptic-paraboloid') val = r_x**2 + r_y**2;
            else if (type === 'hyperbolic-paraboloid') val = r_x**2 - r_y**2;
            else if (type === 'parabolic-cylinder') val = r_x**2;
            
            // Limit Z height for visualization
            if(val > 4) val = 4; 
            if(val < -4) val = -4;
            row.push(val);
        }
        z_data.push(row);
    }
    return { z: z_data, type: 'surface', showscale: false };
};

const concepts = [
    { id: "elliptic-cylinder", name: "Elliptic Cylinder", eqn: "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Elliptic_cylinder.png/240px-Elliptic_cylinder.png", plotType: "parabolic-cylinder" }, // Approx
    { id: "parabolic-cylinder", name: "Parabolic Cylinder", eqn: "y = ax^2", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Parabolic_cylinder.png/240px-Parabolic_cylinder.png", plotType: "parabolic-cylinder" },
    { id: "hyperbolic-cylinder", name: "Hyperbolic Cylinder", eqn: "\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Hyperbolic_cylinder.png/240px-Hyperbolic_cylinder.png", plotType: "parabolic-cylinder" }, // Approx
    { id: "elliptic-paraboloid", name: "Elliptic Paraboloid", eqn: "z = \\frac{x^2}{a^2} + \\frac{y^2}{b^2}", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Elliptic_paraboloid.png/240px-Elliptic_paraboloid.png", plotType: "elliptic-paraboloid" },
    { id: "hyperbolic-paraboloid", name: "Hyperbolic Paraboloid", eqn: "z = \\frac{x^2}{a^2} - \\frac{y^2}{b^2}", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Hyperbolic_paraboloid.png/240px-Hyperbolic_paraboloid.png", plotType: "hyperbolic-paraboloid" },
    { id: "ellipsoid", name: "Ellipsoid", eqn: "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} + \\frac{z^2}{c^2} = 1", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ellipsoid.png/240px-Ellipsoid.png", plotType: "ellipsoid" },
    { id: "hyperboloid-1", name: "Hyperboloid (1 Sheet)", eqn: "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} - \\frac{z^2}{c^2} = 1", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Hyperboloid_of_one_sheet.png/240px-Hyperboloid_of_one_sheet.png", plotType: "cone" }, // Approx visual
    { id: "hyperboloid-2", name: "Hyperboloid (2 Sheets)", eqn: "-\\frac{x^2}{a^2} - \\frac{y^2}{b^2} + \\frac{z^2}{c^2} = 1", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Hyperboloid_of_two_sheets.png/240px-Hyperboloid_of_two_sheets.png", plotType: "cone" }, // Approx
    { id: "cone", name: "Cone", eqn: "\\frac{z^2}{c^2} = \\frac{x^2}{a^2} + \\frac{y^2}{b^2}", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Cone_%28geometry%29.png/240px-Cone_%28geometry%29.png", plotType: "cone" }
];

/* =========================
   2. APP STATE & LOGIC
========================= */

const app = {
    // State
    queue: [],
    currentCard: null,
    isFlipped: false,
    matchSelection: null,
    timerInt: null,
    
    init() {
        this.setupTheme();
        document.getElementById('themeToggle').onclick = () => this.toggleTheme();
        this.loadScore();
    },

    // --- Helper: Rendering ---
    renderMath() {
        renderMathInElement(document.body, {delimiters: [{left: "\\(", right: "\\)", display: false}]});
    },
    
    hideAllViews() {
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        clearInterval(this.timerInt);
    },

    // --- MODE: LEARN (SRS) ---
    startLearn() {
        this.hideAllViews();
        document.getElementById('learnView').classList.remove('hidden');
        
        // Initialize Queue with all concepts
        this.queue = [...concepts].sort(() => Math.random() - 0.5);
        this.updateLearnProgress();
        this.nextLearnCard();
    },

    updateLearnProgress() {
        const total = concepts.length;
        const remaining = this.queue.length;
        const done = total - remaining; // Rough approx for linear progress
        const pct = (done / total) * 100;
        document.getElementById('learnProgress').style.width = pct + "%";
        document.getElementById('queueStatus').textContent = `Cards in queue: ${remaining}`;
    },

    nextLearnCard() {
        if (this.queue.length === 0) {
            document.getElementById('learnCard').innerHTML = `<h2>🎉 All Done!</h2><p>You've reviewed all surfaces.</p><button onclick="app.startLearn()" class="action-btn">Restart</button>`;
            document.getElementById('flipBtn').classList.add('hidden');
            document.getElementById('rateBtns').classList.add('hidden');
            confetti();
            return;
        }

        this.currentCard = this.queue[0]; // Peek front
        this.isFlipped = false;
        
        // Front of card
        const html = `
            <h2>${this.currentCard.name}</h2>
            <div class="math-eqn">\\( ${this.currentCard.eqn} \\)</div>
            <p><i>Visualize the shape...</i></p>
        `;
        
        document.getElementById('learnCard').innerHTML = html;
        document.getElementById('flipBtn').classList.remove('hidden');
        document.getElementById('flipBtn').textContent = "Show Answer";
        document.getElementById('rateBtns').classList.add('hidden');
        this.renderMath();
    },

    flipCard() {
        if (this.isFlipped) return;
        this.isFlipped = true;
        
        // Add Plot Container
        const card = document.getElementById('learnCard');
        const plotId = `plot-${Math.random().toString(36).substr(2,9)}`;
        
        const html = `
            <h2>${this.currentCard.name}</h2>
            <div class="plot-container" id="${plotId}"></div>
            <div class="math-eqn">\\( ${this.currentCard.eqn} \\)</div>
        `;
        
        card.innerHTML = html;
        this.renderMath();
        
        // Render 3D Plot
        const data = generateMesh(this.currentCard.plotType);
        const layout = {
            margin: {t:0, b:0, l:0, r:0},
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            scene: {
                xaxis:{visible:false}, yaxis:{visible:false}, zaxis:{visible:false},
                camera: { eye: {x:1.5, y:1.5, z:1.5} }
            }
        };
        Plotly.newPlot(plotId, [data], layout, {displayModeBar: false});

        document.getElementById('flipBtn').classList.add('hidden');
        document.getElementById('rateBtns').classList.remove('hidden');
    },

    rateCard(success) {
        const card = this.queue.shift(); // Remove current
        
        if (success) {
            // Done with this card
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } else {
            // Spaced Repetition: Put back in queue, but delayed
            // If queue is small, put at end. If large, put at index 3.
            const insertIdx = Math.min(this.queue.length, 3);
            this.queue.splice(insertIdx, 0, card);
        }
        
        this.updateLearnProgress();
        this.nextLearnCard();
    },

    // --- MODE: MATCH GAME ---
    startMatch() {
        this.hideAllViews();
        document.getElementById('matchView').classList.remove('hidden');
        
        const grid = document.getElementById('matchGrid');
        grid.innerHTML = "";
        this.matchSelection = null;
        
        // Create pairs (Name <-> Image)
        // Note: Using static images here for performance (20+ WebGL contexts is too heavy)
        let items = [];
        concepts.forEach(c => {
            items.push({ id: c.id, type: 'text', val: c.name });
            items.push({ id: c.id, type: 'img', val: c.img }); // Use Image for match
        });
        
        // Shuffle and Render
        items.sort(() => Math.random() - 0.5);
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'card';
            if (item.type === 'text') el.innerHTML = `<b>${item.val}</b>`;
            else el.innerHTML = `<img src="${item.val}" alt="surface">`;
            
            el.onclick = () => this.handleMatchClick(el, item);
            grid.appendChild(el);
        });
        
        this.startTimer();
    },

    handleMatchClick(el, item) {
        if (el.classList.contains('correct') || el === this.matchSelection?.el) return;
        
        el.classList.add('selected');

        if (!this.matchSelection) {
            this.matchSelection = { el, item };
            return;
        }

        // Check Match
        const match = (this.matchSelection.item.id === item.id);
        
        if (match) {
            el.classList.remove('selected');
            this.matchSelection.el.classList.remove('selected');
            el.classList.add('correct');
            this.matchSelection.el.classList.add('correct');
            this.matchSelection = null;
            
            // Check Win
            if (document.querySelectorAll('.correct').length === concepts.length * 2) {
                this.endGame();
            }
        } else {
            el.classList.add('wrong');
            this.matchSelection.el.classList.add('wrong');
            setTimeout(() => {
                el.classList.remove('selected', 'wrong');
                this.matchSelection.el.classList.remove('selected', 'wrong');
                this.matchSelection = null;
            }, 600);
        }
    },

    startTimer() {
        let t = 0;
        const disp = document.getElementById('timer');
        this.timerInt = setInterval(() => {
            t++;
            disp.textContent = `Time: ${t}s`;
        }, 1000);
    },
    
    endGame() {
        clearInterval(this.timerInt);
        confetti();
        const timeText = document.getElementById('timer').textContent;
        alert(`You finished in ${timeText}!`);
        // Save Score Logic could go here
    },

    // --- MODE: TEST ---
    startTest() {
        this.hideAllViews();
        document.getElementById('testView').classList.remove('hidden');
        this.nextTestQuestion();
    },

    nextTestQuestion() {
        // Random Question
        const q = concepts[Math.floor(Math.random() * concepts.length)];
        
        // Prompt (Equation)
        const promptEl = document.getElementById('testPrompt');
        promptEl.innerHTML = `<h3>Identify this equation:</h3><div class="math-eqn">\\( ${q.eqn} \\)</div>`;
        this.renderMath();

        // Options
        const opts = [q];
        while(opts.length < 4) {
            const r = concepts[Math.floor(Math.random() * concepts.length)];
            if (!opts.includes(r)) opts.push(r);
        }
        opts.sort(() => Math.random() - 0.5);

        const grid = document.getElementById('testOptions');
        grid.innerHTML = "";
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt.name;
            btn.onclick = () => {
                if (opt.id === q.id) {
                    confetti({ spread: 40, origin: { y: 0.9 } });
                    alert("Correct!");
                    this.nextTestQuestion();
                } else {
                    btn.style.background = "#e74c3c";
                    btn.style.color = "white";
                    setTimeout(() => alert("Wrong! That is " + q.name), 100);
                }
            };
            grid.appendChild(btn);
        });
    },

    // --- UTILS ---
    setupTheme() {
        if (localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
        }
    },
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    },
    loadScore() {
        // Simple placeholder for score loading
        const score = localStorage.getItem('calc3_best_time');
        if(score) {
            document.getElementById('scoreDisplay').textContent = `Best: ${score}s`;
            document.getElementById('scoreDisplay').classList.remove('hidden');
        }
    }
};

// Start
app.init();
