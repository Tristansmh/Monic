// New file for player control functions to avoid adding to app.js
export function initPlayerControls() {
    // Add loop functionality
    setupLoopControls();
    
    // Setup video hiding functionality
    setupVideoHiding();
    
    // Make global access to toggle functions
    window.toggleLoop = toggleLoopMode;
    window.toggleVideoVisibility = toggleVideoVisibility;
}

// Loop variables
let isLoopEnabled = false;

// Video visibility variables
let isVideoHidden = true; // Start with video hidden

function setupLoopControls() {
    // Create loop button
    const loopButton = document.createElement('button');
    loopButton.className = 'control-button';
    loopButton.id = 'loop-button';
    loopButton.title = 'Loop';
    loopButton.innerHTML = '<i class="fas fa-redo"></i>';
    
    // Add loop button after next button
    const nextButton = document.getElementById('next-button');
    nextButton.parentNode.insertBefore(loopButton, nextButton.nextSibling);
    
    // Add event listener
    loopButton.addEventListener('click', toggleLoopMode);
}

function toggleLoopMode() {
    isLoopEnabled = !isLoopEnabled;
    const loopButton = document.getElementById('loop-button');
    
    if (isLoopEnabled) {
        loopButton.classList.add('active');
        loopButton.style.color = '#7B2CBF';
    } else {
        loopButton.classList.remove('active');
        loopButton.style.color = '';
    }
    
    // Update YouTube player loop status
    if (window.player && window.player.setLoop) {
        window.player.setLoop(isLoopEnabled);
    }
}

function setupVideoHiding() {
    // Create video visibility toggle button
    const videoButton = document.createElement('button');
    videoButton.className = 'control-button';
    videoButton.id = 'video-toggle';
    videoButton.title = 'Toggle Video';
    videoButton.innerHTML = '<i class="fas fa-video-slash"></i>';
    
    // Add button to player controls
    const volumeControl = document.querySelector('.volume-control');
    volumeControl.parentNode.insertBefore(videoButton, volumeControl);
    
    // Add event listener
    videoButton.addEventListener('click', toggleVideoVisibility);
    
    // Set initial state (hide video by default)
    hideVideoOnLoad();
}

function hideVideoOnLoad() {
    // Set isVideoHidden to true initially
    isVideoHidden = false; // We'll toggle it to true in toggleVideoVisibility
    
    // Hide video immediately, without waiting
    toggleVideoVisibility(null, true); // Force hide
    
    // Add a backup to ensure it's hidden even if player loads late
    setTimeout(() => {
        if (window.player && window.playerReady) {
            toggleVideoVisibility(null, true); // Force hide again
        } else {
            // Try again in a moment
            setTimeout(hideVideoOnLoad, 500);
        }
    }, 500);
}

function toggleVideoVisibility(event, forceHide = false) {
    isVideoHidden = forceHide || !isVideoHidden;
    const videoButton = document.getElementById('video-toggle');
    const playerContainer = document.getElementById('player-container');
    const playerElement = document.getElementById('player');
    
    if (isVideoHidden) {
        // Hide video but keep audio
        videoButton.innerHTML = '<i class="fas fa-video-slash"></i>';
        
        // Adjust styles to hide video
        playerContainer.style.height = '0';
        playerContainer.style.overflow = 'hidden';
        playerContainer.style.marginTop = '0';
        playerContainer.style.border = 'none';
        playerContainer.style.boxShadow = 'none';
        
        // Ensure player still appears in DOM for audio to work
        // But scaled to 0 size so it's effectively invisible
        playerElement.style.height = '1px';
        playerElement.style.width = '1px';
        playerElement.style.opacity = '0';
        playerElement.style.position = 'absolute';
        
        // Fix for infinite scrolling issue
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.querySelector('.content-area').style.overflow = 'auto';
        document.querySelector('.content-area').style.height = 'calc(100vh - 154px)'; // Account for header and player bar
        document.querySelector('.main-content').style.overflow = 'hidden';
    } else {
        // Show video
        videoButton.innerHTML = '<i class="fas fa-video"></i>';
        
        // Restore video styles
        playerContainer.style.height = 'auto';
        playerContainer.style.overflow = 'hidden';
        playerContainer.style.marginTop = '24px';
        playerContainer.style.border = '';
        playerContainer.style.boxShadow = '';
        
        // Restore player
        playerElement.style.height = '100%';
        playerElement.style.width = '100%';
        playerElement.style.opacity = '1';
        playerElement.style.position = 'relative';
        
        // Restore normal scrolling
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.querySelector('.content-area').style.overflow = 'auto';
        document.querySelector('.content-area').style.height = 'auto';
        document.querySelector('.main-content').style.overflow = 'auto';
    }
}