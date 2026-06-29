document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initScrollNavbar();
    initScrollReveal();
    initHero3DCanvas();
    initLeakCalculator();
    initDemoConsole();
    initWizard();
});

// 1. Custom Cursor with Easing / Spring physics
function initCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    const dot = document.querySelector('.custom-cursor-dot');
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Immediate dot update
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });
    
    // Easing loop for the outer ring
    function updateCursor() {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        
        cursorX += dx * 0.15; // Easing factor
        cursorY += dy * 0.15;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        requestAnimationFrame(updateCursor);
    }
    updateCursor();
    
    // Add hover effects for clickable items
    const hoverElements = document.querySelectorAll('a, button, input, [role="button"], .sim-slider, .wizard-option');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
        });
    });
}

// 2. Scroll Header state change
function initScrollNavbar() {
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// 3. Scroll Reveal via IntersectionObserver
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });
    
    reveals.forEach(el => observer.observe(el));
}

// 4. Hero Section 3D particle orbit canvas
function initHero3DCanvas() {
    const canvas = document.getElementById('motion-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    window.addEventListener('resize', () => {
        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        }
    });
    
    const particles = [];
    const particleCount = 70;
    
    // Generate particles in a spherical coordinates format
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            theta: Math.random() * Math.PI * 2,
            phi: Math.acos((Math.random() * 2) - 1),
            distance: 120 + Math.random() * 60,
            speed: 0.005 + Math.random() * 0.01,
            size: 1 + Math.random() * 2.5,
            color: Math.random() > 0.5 ? '#00f2fe' : '#7000ff'
        });
    }
    
    let angleY = 0;
    let angleX = 0.5;
    
    function drawParticles() {
        ctx.clearRect(0, 0, width, height);
        
        // Center coordinates
        const cx = width / 2;
        const cy = height / 2;
        
        // Slowly update rotation angle
        angleY += 0.003;
        
        // Sort particles by depth Z for simple 3D occlusion feel
        const projected = particles.map(p => {
            // Update phi/theta orbit
            p.theta += p.speed;
            
            // Convert spherical coordinates to 3D Cartesian coordinates
            let x = p.distance * Math.sin(p.phi) * Math.cos(p.theta);
            let y = p.distance * Math.sin(p.phi) * Math.sin(p.theta);
            let z = p.distance * Math.cos(p.phi);
            
            // Rotate around Y axis
            let cosY = Math.cos(angleY);
            let sinY = Math.sin(angleY);
            let x1 = x * cosY - z * sinY;
            let z1 = x * sinY + z * cosY;
            
            // Rotate around X axis slightly
            let cosX = Math.cos(angleX);
            let sinX = Math.sin(angleX);
            let y2 = y * cosX - z1 * sinX;
            let z2 = y * sinX + z1 * cosX;
            
            // Perspective project
            const scale = 250 / (250 + z2);
            const px = cx + x1 * scale;
            const py = cy + y2 * scale;
            
            return { x: px, y: py, size: p.size * scale, z: z2, color: p.color };
        });
        
        // Sort back-to-front
        projected.sort((a, b) => b.z - a.z);
        
        // Render links between close particles to make it look like a neural net
        ctx.strokeStyle = 'rgba(112, 0, 255, 0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
                const dist = Math.hypot(projected[i].x - projected[j].x, projected[i].y - projected[j].y);
                if (dist < 80) {
                    ctx.beginPath();
                    ctx.moveTo(projected[i].x, projected[i].y);
                    ctx.lineTo(projected[j].x, projected[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // Render particle circles
        projected.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect
            if (p.z < 0) { // Closer particles glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = p.color === '#00f2fe' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(112, 0, 255, 0.15)';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
        
        // Core glow sphere
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 100);
        grad.addColorStop(0, 'rgba(112, 0, 255, 0.2)');
        grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, Math.PI * 2);
        ctx.fill();
        
        requestAnimationFrame(drawParticles);
    }
    drawParticles();
}

// 5. Interactive Leak & Call cost calculator
function initLeakCalculator() {
    const volumeSlider = document.getElementById('volume-slider');
    const valueSlider = document.getElementById('value-slider');
    
    const volumeVal = document.getElementById('volume-val');
    const valueVal = document.getElementById('value-val');
    
    const lostRev = document.getElementById('lost-revenue');
    const recoveredRev = document.getElementById('recovered-revenue');
    
    const canvas = document.getElementById('sim-leak-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    window.addEventListener('resize', () => {
        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        }
    });
    
    let particles = [];
    let leakRate = 0.3; // Default 30% missed calls
    
    function updateCalculations() {
        const volume = parseInt(volumeSlider.value);
        const value = parseInt(valueSlider.value);
        
        volumeVal.textContent = volume.toLocaleString();
        valueVal.textContent = '$' + value.toLocaleString();
        
        // Logic: 30% of calls are missed. Every missed call loses 30% to competitor.
        // Total annual lost revenue = Volume * 0.3 (missed) * 0.3 (loss rate) * Value * 12 months
        const missedCallsPerMonth = volume * 0.30;
        const lostJobsPerMonth = missedCallsPerMonth * 0.40; // 40% of missed calls buy elsewhere
        const annualLost = lostJobsPerMonth * value * 12;
        
        // AI Recovers 95% of those missed calls
        const annualRecovered = annualLost * 0.95;
        
        lostRev.textContent = '$' + Math.round(annualLost).toLocaleString();
        recoveredRev.textContent = '$' + Math.round(annualRecovered).toLocaleString();
        
        // Adjust visual particle flow based on volume
        leakRate = Math.min(0.1 + (volume / 1000) * 0.8, 0.9);
    }
    
    volumeSlider.addEventListener('input', updateCalculations);
    valueSlider.addEventListener('input', updateCalculations);
    
    updateCalculations();
    
    // Leak canvas simulation loop
    function animateLeak() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw pipe boundary lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2 - 20);
        ctx.lineTo(width * 0.5, height / 2 - 20);
        ctx.lineTo(width * 0.6, height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, height / 2 + 20);
        ctx.lineTo(width * 0.45, height / 2 + 20);
        ctx.lineTo(width * 0.45, height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(width * 0.5, height / 2 - 20);
        ctx.lineTo(width, height / 2 - 20);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(width * 0.45 + 50, height / 2 + 20);
        ctx.lineTo(width, height / 2 + 20);
        ctx.stroke();
        
        // Spawn particle flow
        if (Math.random() < leakRate) {
            particles.push({
                x: 0,
                y: height / 2 + (Math.random() * 30 - 15),
                vx: 2 + Math.random() * 2,
                vy: 0,
                size: 2 + Math.random() * 3,
                leaked: Math.random() < 0.35, // 35% leak out
                color: '#00f2fe'
            });
        }
        
        particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Leaking logic
            if (p.x > width * 0.43 && p.x < width * 0.53 && p.leaked) {
                p.vy += 0.15; // Gravity pull down
                p.color = '#ff7300';
            }
            
            // Render
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Remove off-screen particles
            if (p.x > width || p.y > height) {
                particles.splice(idx, 1);
            }
        });
        
        requestAnimationFrame(animateLeak);
    }
    animateLeak();
}

// 6. Interactive Demo Console tabs and inner actions
function initDemoConsole() {
    const tabs = document.querySelectorAll('.console-tab');
    const panels = document.querySelectorAll('.console-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById(target).classList.add('active');
            
            // Trigger specific animations per panel when clicked
            if (target === 'panel-sms') {
                runSMSMockupAnimation();
            }
        });
    });
    
    // Voice Player Simulation
    const playBtn = document.getElementById('voice-play-btn');
    const visualizer = document.getElementById('voice-visualizer');
    const transcript = document.getElementById('voice-transcript');
    
    if (playBtn && visualizer) {
        const vCtx = visualizer.getContext('2d');
        let vWidth = visualizer.width = visualizer.offsetWidth;
        let vHeight = visualizer.height = visualizer.offsetHeight;
        let isPlaying = false;
        let vAnimFrame;
        
        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                playBtn.classList.add('playing');
                simulateVoiceTranscript();
                animateVisualizer();
            } else {
                playBtn.classList.remove('playing');
                cancelAnimationFrame(vAnimFrame);
                vCtx.clearRect(0, 0, vWidth, vHeight);
            }
        });
        
        function animateVisualizer() {
            vCtx.clearRect(0, 0, vWidth, vHeight);
            vCtx.fillStyle = '#00f2fe';
            
            const barWidth = 4;
            const barGap = 2;
            const barCount = Math.floor(vWidth / (barWidth + barGap));
            
            for (let i = 0; i < barCount; i++) {
                // Wave formula
                const h = Math.abs(Math.sin(i * 0.15 + Date.now() * 0.01)) * (vHeight * 0.8) * (0.3 + Math.random() * 0.7);
                vCtx.fillRect(i * (barWidth + barGap), vHeight / 2 - h / 2, barWidth, h);
            }
            
            vAnimFrame = requestAnimationFrame(animateVisualizer);
        }
        
        const lines = [
            { speaker: 'agent', text: 'Thank you for calling Peak Dental. This is Sarah, your AI scheduling assistant. How can I help you today?' },
            { speaker: 'caller', text: 'Hi, I need to book a root canal appointment. My tooth is killing me.' },
            { speaker: 'agent', text: 'I am so sorry to hear you are in pain. Let me check the schedule immediately. Do you have a preferred doctor, or would you like the first available slot?' },
            { speaker: 'caller', text: 'First available please, hopefully tomorrow morning.' },
            { speaker: 'agent', text: 'Perfect. We have a 9:30 AM slot open tomorrow with Dr. Henderson. Will that work for you?' },
            { speaker: 'caller', text: 'Yes, that works. Sign me up.' },
            { speaker: 'agent', text: 'Great! I have reserved that slot. I just sent a confirmation text message to your phone. We look forward to seeing you.' }
        ];
        
        function simulateVoiceTranscript() {
            transcript.innerHTML = '';
            let lineIdx = 0;
            
            function showNextLine() {
                if (!isPlaying) return;
                if (lineIdx < lines.length) {
                    const l = lines[lineIdx];
                    const div = document.createElement('div');
                    div.className = 'transcript-line';
                    div.innerHTML = `<span class="line-speaker ${l.speaker}">${l.speaker === 'agent' ? 'AI Sarah' : 'Caller'}:</span><span class="line-text">${l.text}</span>`;
                    transcript.appendChild(div);
                    transcript.scrollTop = transcript.scrollHeight;
                    lineIdx++;
                    setTimeout(showNextLine, 2500); // 2.5s per response
                } else {
                    isPlaying = false;
                    playBtn.classList.remove('playing');
                    cancelAnimationFrame(vAnimFrame);
                    vCtx.clearRect(0, 0, vWidth, vHeight);
                }
            }
            showNextLine();
        }
    }
    
    // Chat Widget Simulation
    const chatSend = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input-el');
    const chatMsgContainer = document.getElementById('chat-msg-container');
    const prepopulated = document.querySelectorAll('.chat-prompt-btn');
    
    if (chatSend && chatInput) {
        chatSend.addEventListener('click', handleChatSubmit);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSubmit();
        });
        
        prepopulated.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.textContent.trim();
                sendUserMessage(text);
                btn.style.display = 'none'; // Hide prompt once used
            });
        });
        
        function handleChatSubmit() {
            const text = chatInput.value.trim();
            if (text === '') return;
            sendUserMessage(text);
            chatInput.value = '';
        }
        
        function sendUserMessage(text) {
            const userMsg = document.createElement('div');
            userMsg.className = 'chat-bubble user';
            userMsg.textContent = text;
            chatMsgContainer.appendChild(userMsg);
            chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;
            
            // Simulate bot thinking
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'chat-bubble bot';
                botMsg.textContent = '...';
                chatMsgContainer.appendChild(botMsg);
                chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;
                
                setTimeout(() => {
                    botMsg.textContent = getBotResponse(text);
                    chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;
                }, 1000);
            }, 500);
        }
        
        function getBotResponse(query) {
            query = query.toLowerCase();
            if (query.includes('how much') || query.includes('pricing') || query.includes('cost')) {
                return "Our AI Employees start at $497/mo for the Starter suite, up to $1,997/mo for full enterprise customization. You can calculate your specific ROI using our calculator above!";
            } else if (query.includes('book') || query.includes('appointment') || query.includes('schedule')) {
                return "Absolutely! Click the 'Book My Call' button on the bottom of the page to find a time on our calendar.";
            } else if (query.includes('what is') || query.includes('how does it work')) {
                return "We build custom voice & chat AI staff that integrate directly with your calendar and CRM. They answer calls, resolve support queries, and recover missed leads immediately.";
            }
            return "That's a great question. We customize all prompts and logic based on your specific business. Let's schedule a call to talk about how we can build this for you!";
        }
    }
}

// SMS Thread Auto Animation
let smsInterval;
function runSMSMockupAnimation() {
    const bubbles = document.querySelectorAll('.sms-bubble');
    bubbles.forEach(b => b.classList.remove('active'));
    clearInterval(smsInterval);
    
    let idx = 0;
    function showNextSMS() {
        if (idx < bubbles.length) {
            bubbles[idx].classList.add('active');
            idx++;
        } else {
            clearInterval(smsInterval);
        }
    }
    
    // Initial delay
    setTimeout(showNextSMS, 400);
    smsInterval = setInterval(showNextSMS, 2000);
}

// 7. Onboarding / Assessment Wizard Step Handler
function initWizard() {
    const steps = document.querySelectorAll('.wizard-step');
    const prevBtn = document.getElementById('wizard-prev');
    const nextBtn = document.getElementById('wizard-next');
    const progressBar = document.getElementById('wizard-progress-bar');
    
    let currentStep = 0;
    let wizardData = {
        bottleneck: '',
        volume: '',
        name: '',
        phone: '',
        email: '',
        business: ''
    };
    
    // Bottleneck options listener
    const options = document.querySelectorAll('.wizard-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const category = opt.dataset.category;
            const value = opt.dataset.value;
            
            // Deselect siblings
            const siblings = opt.parentNode.querySelectorAll('.wizard-option');
            siblings.forEach(s => s.classList.remove('selected'));
            
            opt.classList.add('selected');
            wizardData[category] = value;
            
            // Auto advance on card clicks for step 0 and 1
            setTimeout(nextStep, 300);
        });
    });
    
    nextBtn.addEventListener('click', nextStep);
    prevBtn.addEventListener('click', prevStep);
    
    function updateWizard() {
        steps.forEach((s, idx) => {
            if (idx === currentStep) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
        
        // Progress bar percentage
        const pct = ((currentStep + 1) / steps.length) * 100;
        progressBar.style.width = pct + '%';
        
        // Nav button visibility
        if (currentStep === 0) {
            prevBtn.style.visibility = 'hidden';
        } else if (currentStep === steps.length - 1) { // Success screen
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.visibility = 'visible';
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
            nextBtn.textContent = 'Next Step';
        }
    }
    
    function nextStep() {
        // Validation check
        if (currentStep === 2) {
            // Check form details
            const name = document.getElementById('wiz-name').value.trim();
            const phone = document.getElementById('wiz-phone').value.trim();
            const email = document.getElementById('wiz-email').value.trim();
            const biz = document.getElementById('wiz-biz').value.trim();
            
            if (!name || !phone || !email || !biz) {
                alert('Please fill out all fields to get your mockup.');
                return;
            }
            wizardData.name = name;
            wizardData.phone = phone;
            wizardData.email = email;
            wizardData.business = biz;
        }
        
        if (currentStep < steps.length - 1) {
            currentStep++;
            updateWizard();
            
            // Populate success screen details
            if (currentStep === 3) {
                document.getElementById('success-headline').innerHTML = `Compiling AI Mockup for <span style="color: #00f2fe;">${wizardData.business}</span>...`;
            }
        }
    }
    
    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            updateWizard();
        }
    }
    
    updateWizard();
}
