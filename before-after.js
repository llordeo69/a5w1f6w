/**
 * Before-After Slider Embeddable Widget
 * Usage: <script src="https://sitecam.io/embed/before-after-embed.js" data-comparison-id="COMPARISON_ID" data-scale="75%"></script>
 */
(function() {
    'use strict';
    
    // Configuration - placeholders will be replaced by PHP
    const WIDGET_CONFIG = {
        baseUrl: 'https://sitecam.io',
        apiUrl: 'https://ghwuiljwfbtccgnxzibn.supabase.co',
        apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdod3VpbGp3ZmJ0Y2Nnbnh6aWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1ODgwNjYsImV4cCI6MjA2NDE2NDA2Nn0.miyizZTE1bOD3Aux9WEBONQo44ev_iWVwFqo1wwApck',
        version: '1.0.0'
    };
    
    // Find the script tag that loaded this file
    const currentScript = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
    
    // Get the comparison ID from data attribute
    const comparisonId = currentScript.getAttribute('data-comparison-id');
    const width = currentScript.getAttribute('data-width') || '100%';
    const height = currentScript.getAttribute('data-height') || 'auto';
    const scale = currentScript.getAttribute('data-scale') || '100%'; // NEW: Scale attribute
    const maxWidth = currentScript.getAttribute('data-max-width'); // NEW: Max width attribute
    const showCredit = currentScript.getAttribute('data-show-credit') !== 'false'; // Default true
    console.log('Embed widget showCredit:', showCredit, 'data-show-credit attribute:', currentScript.getAttribute('data-show-credit'));
    
    if (!comparisonId) {
        console.error('Before-After Widget: Missing data-comparison-id attribute');
        return;
    }
    
    // Parse scale value
    let scaleValue = 1;
    if (scale.includes('%')) {
        scaleValue = parseFloat(scale) / 100;
    } else {
        scaleValue = parseFloat(scale);
    }
    
    // Ensure scale is within reasonable bounds
    scaleValue = Math.max(0.2, Math.min(2, scaleValue));
    
    // Create unique widget ID
    const widgetId = 'bas-widget-' + Math.random().toString(36).substr(2, 9);
    
    // Calculate scaled dimensions
    const baseMaxWidth = maxWidth ? parseInt(maxWidth) : 1000; // Use data-max-width or default to 1000
    const scaledMaxWidth = baseMaxWidth * scaleValue;
    const scaledWidth = width === '100%' ? `${scaleValue * 100}%` : width;
    
    // Calculate shadow offset for bottom margin
    const shadowBlur = Math.round(6 * scaleValue);
    const shadowOffset = Math.round(2 * scaleValue);
    const bottomMargin = Math.max(shadowBlur + shadowOffset, scaleValue < 1 ? (1 - scaleValue) * -100 : 0);
    
    // Create widget container
    const container = document.createElement('div');
    container.id = widgetId;
    container.className = 'bas-embed-widget';
    container.style.cssText = `
        width: ${scaledWidth};
        height: ${height};
        max-width: ${scaledMaxWidth}px;
        margin: 0 auto ${bottomMargin}px auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border-radius: 0;
        overflow: hidden;
        box-shadow: 0 ${shadowOffset}px ${shadowBlur}px rgba(0,0,0,0.07);
        background: #fff;
        position: relative;
        transform: scale(${scaleValue});
        transform-origin: center top;
    `;
    
    // Insert container after the script tag
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
    
    // Load comparison data and render
    loadAndRenderComparison();
    
    async function loadAndRenderComparison() {
        try {
            showLoading();
            
            // Fetch comparison data
            const comparison = await fetchComparison(comparisonId);
            if (!comparison) {
                showError('Slider not found');
                return;
            }
            
            // Render the widget
            renderWidget(comparison);
            
            // Track view
            trackView(comparisonId);
            
        } catch (error) {
            console.error('Widget error:', error);
            showError('Failed to load comparison');
        }
    }
    
    async function fetchComparison(id) {
        try {
            // Try share_id first
            let response = await fetch(`${WIDGET_CONFIG.apiUrl}/rest/v1/comparisons?share_id=eq.${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': WIDGET_CONFIG.apiKey
                }
            });
            
            if (!response.ok) throw new Error('API request failed');
            
            let data = await response.json();
            
            // If not found by share_id, try UUID
            if (!data || data.length === 0) {
                response = await fetch(`${WIDGET_CONFIG.apiUrl}/rest/v1/comparisons?id=eq.${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': WIDGET_CONFIG.apiKey
                    }
                });
                
                if (!response.ok) throw new Error('API request failed');
                data = await response.json();
            }
            
            return data && data.length > 0 ? data[0] : null;
            
        } catch (error) {
            console.error('Error fetching comparison:', error);
            return null;
        }
    }
    
    function renderWidget(comparison) {
        const aspectRatio = comparison.canvas_height / comparison.canvas_width;
        const sliderPosition = 50; // Always start at 50% (middle)
        
        // Scale font sizes and padding based on scale value
        const headerPadding = Math.round(15 * scaleValue);
        const labelPadding = Math.round(6 * scaleValue);
        const labelFontSize = Math.round(12 * scaleValue);
        const footerPadding = Math.round(6 * scaleValue);
        const footerFontSize = Math.round(13 * scaleValue);
        const sliderButtonSize = Math.round(20 * scaleValue);
        const sliderWidth = Math.round(4 * scaleValue);
        
        container.innerHTML = `
            <div class="bas-embed-slider" style="position: relative; width: 100%; padding-bottom: ${aspectRatio * 100}%; background: #f5f5f5; overflow: hidden;">
                <img class="bas-before-img" src="${comparison.before_image_url}" alt="Before" 
                     style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                     
                <img class="bas-after-img" src="${comparison.after_image_url}" alt="After" 
                     style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; clip-path: inset(0 0 0 ${sliderPosition}%);">
                     
                <div class="bas-slider-handle" style="position: absolute; top: 0; bottom: 0; width: ${sliderWidth}px; background: white; left: ${sliderPosition}%; transform: translateX(-50%); cursor: ew-resize; box-shadow: 0 0 ${Math.round(10 * scaleValue)}px rgba(0,0,0,0.3); z-index: 10;">
                    <div class="bas-slider-button" style="position: absolute; top: 50%; left: 50%; width: ${sliderButtonSize}px; height: ${sliderButtonSize}px; background: white; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 ${Math.round(10 * scaleValue)}px rgba(0,0,0,0.3); cursor: ew-resize;"></div>
                </div>
                
                <div class="bas-label bas-before-label" style="position: absolute; bottom: ${headerPadding}px; left: ${headerPadding}px; padding: ${labelPadding}px ${labelPadding * 2}px; background: rgba(0,0,0,0.7); color: white; border-radius: ${Math.round(4 * scaleValue)}px; font-size: ${labelFontSize}px; font-weight: bold; z-index: 5;">BEFORE</div>
                <div class="bas-label bas-after-label" style="position: absolute; bottom: ${headerPadding}px; right: ${headerPadding}px; padding: ${labelPadding}px ${labelPadding * 2}px; background: rgba(0,0,0,0.7); color: white; border-radius: ${Math.round(4 * scaleValue)}px; font-size: ${labelFontSize}px; font-weight: bold; z-index: 5;">AFTER</div>
            </div>
            
            <div class="bas-embed-footer" style="${showCredit ? `padding: ${footerPadding}px ${headerPadding + 8}px; background: white; border-top: 1px solid #eee; text-align: center;` : 'display: none;'}">
                <a href="https://sitecam.io/free-construction-before-after-photo-maker/?utm_source=widget&utm_medium=backlink&utm_campaign=before_after_tool" 
                   target="_blank" 
                   rel="noopener"
                   style="display: inline-flex; align-items: center; gap: ${Math.round(6 * scaleValue)}px; color: rgb(145, 145, 145); text-decoration: none; font-size: ${footerFontSize}px; font-weight: 200; transition: color 0.2s;"
                   onmouseover="this.style.color='rgb(100, 100, 100)'" 
                   onmouseout="this.style.color='rgb(145, 145, 145)'"
                   onclick="trackSiteCamClick('${comparisonId}')">
                    Made with SiteCam
                </a>
            </div>
        `;
        
        // Add slider functionality
        addSliderInteraction();
    }
    
    function addSliderInteraction() {
        const sliderContainer = container.querySelector('.bas-embed-slider');
        const sliderHandle = container.querySelector('.bas-slider-handle');
        const afterImg = container.querySelector('.bas-after-img');
        
        if (!sliderContainer || !sliderHandle || !afterImg) return;
        
        let isDragging = false;
        
        function startDrag(e) {
            isDragging = true;
            e.preventDefault();
            document.body.style.userSelect = 'none';
        }
        
        function stopDrag() {
            isDragging = false;
            document.body.style.userSelect = '';
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const rect = sliderContainer.getBoundingClientRect();
            let x;
            
            if (e.type === 'mousemove') {
                x = e.clientX;
            } else if (e.touches && e.touches[0]) {
                x = e.touches[0].clientX;
            } else {
                return;
            }
            
            const position = ((x - rect.left) / rect.width) * 100;
            const clampedPosition = Math.max(0, Math.min(100, position));
            
            sliderHandle.style.left = clampedPosition + '%';
            afterImg.style.clipPath = `inset(0 0 0 ${clampedPosition}%)`;
            
            // Update label opacity based on slider position
            updateLabelVisibility(clampedPosition);
        }
        
        // Mouse events
        sliderHandle.addEventListener('mousedown', startDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mousemove', drag);
        
        // Touch events
        sliderHandle.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        
        // Add keyboard support for accessibility
        sliderHandle.setAttribute('tabindex', '0');
        sliderHandle.setAttribute('role', 'slider');
        sliderHandle.setAttribute('aria-valuemin', '0');
        sliderHandle.setAttribute('aria-valuemax', '100');
        sliderHandle.setAttribute('aria-valuenow', '50');
        sliderHandle.setAttribute('aria-label', 'Adjust before/after comparison');
        
        sliderHandle.addEventListener('keydown', function(e) {
            let currentPosition = parseFloat(sliderHandle.style.left) || 50;
            let newPosition = currentPosition;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowDown':
                    newPosition = Math.max(0, currentPosition - 5);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'ArrowUp':
                    newPosition = Math.min(100, currentPosition + 5);
                    e.preventDefault();
                    break;
                case 'Home':
                    newPosition = 0;
                    e.preventDefault();
                    break;
                case 'End':
                    newPosition = 100;
                    e.preventDefault();
                    break;
            }
            
            if (newPosition !== currentPosition) {
                sliderHandle.style.left = newPosition + '%';
                afterImg.style.clipPath = `inset(0 0 0 ${newPosition}%)`;
                sliderHandle.setAttribute('aria-valuenow', Math.round(newPosition));
                // Update label opacity for keyboard navigation
                updateLabelVisibility(newPosition);
            }
        });
    }
    
    function updateLabelVisibility(position) {
        const beforeLabel = container.querySelector('.bas-before-label');
        const afterLabel = container.querySelector('.bas-after-label');
        
        if (!beforeLabel || !afterLabel) return;
        
        // Calculate opacity based on position
        // BEFORE label: fully visible at 100%, fade out as slider moves left, hidden at 20%
        let beforeOpacity = 1;
        if (position <= 20) {
            beforeOpacity = 0;
        } else if (position <= 40) {
            beforeOpacity = (position - 20) / 20; // Fade from 20% to 40%
        }
        
        // AFTER label: fully visible at 0%, fade out as slider moves right, hidden at 80%
        let afterOpacity = 1;
        if (position >= 80) {
            afterOpacity = 0;
        } else if (position >= 60) {
            afterOpacity = (80 - position) / 20; // Fade from 60% to 80%
        }
        
        // Apply opacity with smooth transition
        beforeLabel.style.opacity = beforeOpacity;
        beforeLabel.style.transition = 'opacity 0.2s ease';
        afterLabel.style.opacity = afterOpacity;
        afterLabel.style.transition = 'opacity 0.2s ease';
    }
    
    function showLoading() {
        const loadingSpinnerSize = Math.round(20 * scaleValue);
        const loadingFontSize = Math.round(14 * scaleValue);
        const loadingPadding = Math.round(40 * scaleValue);
        
        container.innerHTML = `
            <div style="padding: ${loadingPadding}px; text-align: center; color: #666;">
                <div style="display: inline-block; width: ${loadingSpinnerSize}px; height: ${loadingSpinnerSize}px; border: ${Math.round(3 * scaleValue)}px solid #f3f3f3; border-top: ${Math.round(3 * scaleValue)}px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: ${Math.round(15 * scaleValue)}px; font-size: ${loadingFontSize}px;">Loading...</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }
    
    function showError(message) {
        const errorPadding = Math.round(40 * scaleValue);
        const errorFontSize = Math.round(14 * scaleValue);
        
        container.innerHTML = `
            <div style="padding: ${errorPadding}px; text-align: center; color: #dc3545; font-size: ${errorFontSize}px;">
                <div style="margin-bottom: ${Math.round(10 * scaleValue)}px; font-size: ${Math.round(24 * scaleValue)}px;">⚠️</div>
                <div>${escapeHtml(message)}</div>
            </div>
        `;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Simple Google Analytics tracking for backlink clicks (optional)
    window.trackSiteCamClick = function(comparisonId) {
        try {
            // Track via Google Analytics 4 if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'sitecam_backlink_click', {
                    event_category: 'engagement',
                    event_label: 'widget_' + comparisonId,
                    transport_type: 'beacon'
                });
            }
            
            // Track via Google Analytics Universal if available
            if (typeof ga !== 'undefined') {
                ga('send', 'event', 'engagement', 'sitecam_backlink_click', 'widget_' + comparisonId);
            }
        } catch (e) {
            // Silent fail
        }
    };
    
    function trackView(comparisonId) {
        // Track widget views via Google Analytics only
        try {
            // Track via Google Analytics 4 if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'sitecam_widget_view', {
                    event_category: 'engagement',
                    event_label: 'widget_' + comparisonId,
                    transport_type: 'beacon'
                });
            }
            
            // Track via Google Analytics Universal if available
            if (typeof ga !== 'undefined') {
                ga('send', 'event', 'engagement', 'sitecam_widget_view', 'widget_' + comparisonId);
            }
        } catch (e) {
            // Silent fail
        }
    }
    
})();
