// New file for animations
// This is a separate file to avoid adding to app.js which is at max length

// Tilt effect for cards with 3D perspective
export function initTiltEffect() {
    const cards = document.querySelectorAll('.video-card, .library-playlist-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', handleTilt);
        card.addEventListener('mouseleave', resetTilt);
    });
    
    // Observe DOM for new cards
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && 
                       (node.classList.contains('video-card') || 
                        node.classList.contains('library-playlist-card'))) {
                        node.addEventListener('mousemove', handleTilt);
                        node.addEventListener('mouseleave', resetTilt);
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
}

function handleTilt(e) {
    const card = this;
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    const centerX = cardRect.left + cardWidth / 2;
    const centerY = cardRect.top + cardHeight / 2;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const rotateX = (centerY - mouseY) / 10;
    const rotateY = (mouseX - centerX) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
}

function resetTilt() {
    this.style.transform = '';
}

// Add subtle animation to player bar
export function initPlayerAnimations() {
    const nowPlayingBar = document.querySelector('.now-playing-bar');
    const progressBar = document.querySelector('.progress');
    
    if (progressBar) {
        // Add subtle pulse animation when playing
        setInterval(() => {
            if (window.playerState && window.playerState.isPlaying) {
                nowPlayingBar.style.boxShadow = '0 -5px 25px rgba(123, 44, 191, 0.4)';
                setTimeout(() => {
                    nowPlayingBar.style.boxShadow = '0 -5px 20px rgba(0, 0, 0, 0.3)';
                }, 500);
            }
        }, 2000);
    }
}

// Button hover effect
export function initButtonEffects() {
    const buttons = document.querySelectorAll('button, .control-button, .video-card, .library-playlist-card');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', addButtonEffect);
        button.addEventListener('mouseleave', removeButtonEffect);
    });
}

function addButtonEffect() {
    this.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
}

function removeButtonEffect() {
    this.style.transition = 'all 0.3s ease';
}