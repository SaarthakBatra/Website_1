const DEBUG = true;

// Force Desktop Mode - Override mobile behaviors
class ForceDesktopMode {
    constructor() {
        this.init();
    }
    
    init() {
        // Override viewport meta tag programmatically
        this.setDesktopViewport();
        
        // Force desktop user agent (optional)
        this.preventMobileDetection();
        
        // Override touch behaviors to simulate desktop
        this.simulateDesktopInteractions();
        
        if(DEBUG) console.log('✓ ForceDesktopMode: Desktop layout forced on mobile');
    }
    
    setDesktopViewport() {
        // Set minimum width to force desktop layout
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.setAttribute('content', 'width=1200, initial-scale=0.5, maximum-scale=1.0, user-scalable=yes');
        }
    }
    
    preventMobileDetection() {
        // Override common mobile detection methods
        Object.defineProperty(navigator, 'userAgent', {
            get: function() { return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'; }
        });
        
        // Override touch detection
        Object.defineProperty(navigator, 'maxTouchPoints', {
            get: function() { return 0; }
        });
    }
    
    simulateDesktopInteractions() {
        // Convert touch events to mouse events
        document.addEventListener('touchstart', this.touchToMouse, { passive: false });
        document.addEventListener('touchmove', this.touchToMouse, { passive: false });
        document.addEventListener('touchend', this.touchToMouse, { passive: false });
    }
    
    touchToMouse(e) {
        const touch = e.touches[0] || e.changedTouches[0];
        const mouseEvent = new MouseEvent(
            e.type === 'touchstart' ? 'mousedown' : 
            e.type === 'touchmove' ? 'mousemove' : 'mouseup',
            {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true,
                cancelable: true
            }
        );
        touch.target.dispatchEvent(mouseEvent);
    }
}

// Mobile Detection Utility
class MobileDetector {
    static isMobile() {
        // Multi-layered mobile detection
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.innerWidth;
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check user agent for mobile devices
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
        const isUserAgentMobile = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Check screen width (backup method)
        const isSmallScreen = screenWidth < 1024;
        
        // Check for touch-first devices
        const isTouchDevice = hasTouchScreen && screenWidth < 1024;
        
        // Combined detection
        return isUserAgentMobile || isTouchDevice || (isSmallScreen && hasTouchScreen);
    }
    
    static logDetectionDetails() {
        console.log('Mobile Detection Details:', {
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            hasTouchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            maxTouchPoints: navigator.maxTouchPoints,
            isMobile: MobileDetector.isMobile()
        });
    }
}

class LoadingManager {
    constructor() {
        this.loadingPage = document.getElementById('LoadingPage');
        this.percentageElement = document.querySelector('.loading-counter');
        this.normalLoading = document.getElementById('normalLoading');
        this.mobileWarning = document.getElementById('mobileWarning');
        this.acceptButton = document.getElementById('acceptMobileWarning');
        
        this.currentPercentage = 0;
        this.targetPercentage = 0;
        this.isComplete = false;
        this.isMobile = MobileDetector.isMobile();
        this.mobileWarningAccepted = false;
        
        this.maxWaitTime = 30000; // 30 seconds maximum wait time
        this.startTime = Date.now();
        
        this.resourcesLoaded = 0;
        this.totalResources = 0;
        this.resourcesMap = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000; // Base delay: 1 second
        this.fontLoadTimeout = 5000; // 5 seconds timeout for fonts
        
        this.init();
    }

    init() {
        if(DEBUG) {
            console.log('✓ Mobile Detection Result:', this.isMobile);
            MobileDetector.logDetectionDetails();
        }
        
        if (this.isMobile) {
            this.showMobileWarning();
        } else {
            this.startNormalLoading();
        }
    }
    
    showMobileWarning() {
        // Hide normal loading, show mobile warning
        this.normalLoading.style.display = 'none';
        this.mobileWarning.style.display = 'flex';
        
        // Setup accept button
        this.acceptButton.addEventListener('click', () => {
            this.mobileWarningAccepted = true;
            this.hideMobileWarning();
            this.startNormalLoading();
        });
        
        // Add hover effect to button
        this.acceptButton.addEventListener('mouseenter', () => {
            this.acceptButton.style.backgroundColor = 'var(--palette1_Color2)';
            this.acceptButton.style.transform = 'translateY(-2px)';
        });
        
        this.acceptButton.addEventListener('mouseleave', () => {
            this.acceptButton.style.backgroundColor = 'var(--palette1_Color1)';
            this.acceptButton.style.transform = 'translateY(0)';
        });
        
        if(DEBUG) console.log('✓ Mobile warning displayed');
    }
    
    hideMobileWarning() {
        this.mobileWarning.style.display = 'none';
        this.normalLoading.style.display = 'flex';
    }
    
    startNormalLoading() {
        // if(DEBUG) console.log('> LoadingManager: Starting resource collection and loading process...');
        this.collectResources();
        this.startLoading();
        this.startPercentageAnimation();
        
        // Set maximum wait timeout
        setTimeout(() => {
            if (!this.isComplete) {
                console.warn('Loading timeout reached, proceeding anyway');
                this.completeLoading();
            }
        }, this.maxWaitTime);
    }

    collectResources() {
        // if(DEBUG) console.log('> LoadingManager: Collecting resources to load...');
        const resourceSelectors = [
            'img[src]',
            'link[rel="stylesheet"]',
            '[style*="background-image: url"]',
            '[style*="background: url"]',
            'script[src]'
        ];

        const cssImages = [
            './assets/common/Logo1-White.png',
            './assets/page1/landing_image_nocar_nowaves.jpg',
            './assets/page1/waves.png',
            './assets/page1/car.png',
            './assets/common/clouds.png',
            './assets/page2/Drill_worker.png',
            './assets/page2/Worker2.png',
            './assets/page2/Part2/card1.png',
            './assets/page2/Part2/card2.png',
            './assets/page2/Part2/card3.png',
            './assets/page2/Part2/card4.png',
            './assets/Page3/Card1.png',
            './assets/Page3/Card2.png',
            './assets/Page3/Card3.png',
            './assets/Page3/Card4.png',
            './assets/Page3/Card5.png',
            './assets/Page3/Card6.png',
            './assets/Page3/Card7.png',
            './assets/Page3/Card8.png',
            './assets/Page3/Card9.png',
            './assets/Page6/1.png',
            './assets/Page6/2.jpg',
            './assets/Page6/3.jpg',
            './assets/Page6/4.jpg',
        ];

        const animationViewMappings = [
            { selector: '#Home', view_timeline_name: '--section1' },
            { selector: '.snap_checkpoint[data-checkpoint="1"]', view_timeline_name: '--section2' },
            { selector: '.snap_checkpoint[data-checkpoint="5"]', view_timeline_name: '--section3' },
            { selector: '#OurTeam', view_timeline_name: '--section4' }
        ];
        // Adding View Timelines
        animationViewMappings.forEach(timeline => this.addResource('view_timeline', timeline));

        // Adding CSS background images
        cssImages.forEach(src => { this.addResource('image', src) });

        // Collecting DOM resources
        resourceSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            // if(DEBUG) console.log(`> LoadingManager: Found ${elements.length} elements for selector "${selector}"`);
            elements.forEach(element => {
                if (element.tagName === 'IMG') this.addResource('image', element.src);
                else if (element.tagName === 'LINK') this.addResource('stylesheet', element.href);
                else if (element.tagName === 'SCRIPT') this.addResource('script', element.src);
                else if (element.style && (element.style.background || element.style.backgroundImage)) {
                    // Extracting URL from inline background styles - improved pattern
                    const style = element.getAttribute('style') || '';
                    const bgMatch = style.match(/background(?:-image)?\s*:\s*url\(['"]?([^'")]+)['"]?\)/);
                    if (bgMatch) this.addResource('image', bgMatch[1]);
                }
            });
        });

        // Additional check for background elements that might be missed
        const backgroundElements = document.querySelectorAll('[style*="background"]');
        backgroundElements.forEach(element => {
            const style = element.getAttribute('style') || '';
            const bgMatch = style.match(/background(?:-image)?\s*:\s*url\(['"]?([^'")]+)['"]?\)/);
            if (bgMatch && !this.resourcesMap.has(bgMatch[1])) {
                this.addResource('image', bgMatch[1]);
            }
        });

        // Adding Google Fonts
        const googleFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
        ];
        googleFonts.forEach(href => { this.addResource('font', href) });

        console.log(`> LoadingManager: Total resources to load: ${this.totalResources}`, this.resourcesMap);
        console.log(`> LoadingManager: Unique resources in Map: ${this.resourcesMap.size}, Expected to load: ${this.resourcesMap.size}`);
    }

    addResource(type, src) {
        // if(DEBUG) console.log(`> LoadingManager: Adding resource - Type: ${type}, Src: ${JSON.stringify(src)}`, this.resourcesMap.has(src), src, !this.resourcesMap.has(src), (type !== 'view_timeline')? this.isValidUrl(src) : true, (src && !(this.resourcesMap.has(src)) && (type !== 'view_timeline')? this.isValidUrl(src) : true));
        if(src && !this.resourcesMap.has(src) && ((type !== 'view_timeline')? this.isValidUrl(src) : true)) {
            this.resourcesMap.set(src, { type, loaded: false, retryCount: 0, failed: false });
            // Only count non-view_timeline resources toward total progress
            if (type !== 'view_timeline') {
                this.totalResources++;
            }
            // if(DEBUG) console.log(`> LoadingManager: Resource added`, this.totalResources);
            this.loadResource(type, src);
        }
    }

    isValidUrl(src) { return src && (src.startsWith('./') || src.startsWith('../') || src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')) }

    loadResource(type, src, retryCount = 0) {
            let element;
            switch (type) {
                case 'image':
                    element = new Image();
                    element.crossOrigin = 'anonymous'; // Handle CORS if needed
                    element.src = src;
                    break;
                case 'stylesheet':
                case 'font':
                    element = document.createElement('link');
                    element.rel = 'stylesheet';
                    element.href = src;
                    element.crossOrigin = 'anonymous';
                    document.head.appendChild(element);
                    break;
                case 'script':
                    element = document.createElement('script');
                    element.src = src;
                    element.crossOrigin = 'anonymous';
                    document.head.appendChild(element);
                    break;
                case 'view_timeline':
                    element = document.querySelector(`${src.selector}`);
                    element.style.setProperty('view-timeline-name', src.view_timeline_name);
                    break;
                    
            }

            if (element) {
                if(type === 'view_timeline') {
                    if(getComputedStyle(element).getPropertyValue('view-timeline-name') === src.view_timeline_name) this.onResourceLoaded(src);
                    else this.onResourceError(src, retryCount);
                } else if (type === 'font') this.handleFontLoading(src);
                else {
                    element.onload = () => this.onResourceLoaded(src);
                    element.onerror = () => this.onResourceError(src, retryCount);
                }              
            }
    }

    handleFontLoading(src) {
        const fontTimeout = setTimeout(() => {
            if (!this.resourcesMap.get(src)?.loaded) {
                console.warn(`Font loading timeout for: ${src}`);
                this.onResourceError(src, this.resourcesMap.get(src)?.retryCount || 0);
            }
        }, this.fontLoadTimeout);

        document.fonts.ready.then(() => {
            clearTimeout(fontTimeout);
            if (!this.resourcesMap.get(src)?.loaded) {
                this.onResourceLoaded(src);
            }
        }).catch(() => {
            clearTimeout(fontTimeout);
            console.warn(`Font loading failed for: ${src}`);
            this.onResourceError(src, this.resourcesMap.get(src)?.retryCount || 0);
        });
    }

    onResourceLoaded(src) {
        const resource = this.resourcesMap.get(src);
        if (resource && !resource.loaded) {
            resource.loaded = true;
            // Only count non-view_timeline resources toward progress
            if (resource.type !== 'view_timeline') {
                this.resourcesLoaded++;
            }
            this.updateProgress();            
            if (this.resourcesLoaded >= this.totalResources) this.checkCompletion();
            // if(DEBUG) console.log(`> LoadingManager: Resource loaded: ${src} (${this.resourcesLoaded}/${this.totalResources})`);
        }
    }

    onResourceError(src, retryCount = 0) {
        const resource = this.resourcesMap.get(src);
        if (resource && !resource.loaded) {
            if (resource.type === 'font') {
                // For fonts, do not retry, just mark as failed and count as loaded
                console.error(`Font failed to load: ${src}`);
                resource.failed = true;
                this.onResourceLoaded(src);
            } else if (retryCount < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
                console.warn(`Failed to load: ${src}, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
                setTimeout(() => this.loadResource(resource.type, src, retryCount + 1), delay);
            } else {
                console.error(`Failed to load after ${this.maxRetries} retries: ${src}`);
                resource.failed = true;
                this.onResourceLoaded(src); // Count as loaded to prevent hanging
            }
        }
    }

    updateProgress() {
        if (this.totalResources === 0) this.targetPercentage = 100;
        else this.targetPercentage = (this.resourcesLoaded / this.totalResources) * 100;     
    }

    startLoading() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateProgress();
                this.checkCompletion();
            });
        } else {
            this.updateProgress();
        }

        // Check window load with comprehensive ready state checking
        const checkBothReady = () => {
            if (document.readyState === 'complete') {
                this.updateProgress();
                this.checkCompletion();
            }
        };

        if (document.readyState !== 'complete') {
            window.addEventListener('load', checkBothReady);
        } else {
            setTimeout(checkBothReady, 100);
        }
    }

    startPercentageAnimation() {
        const animate = () => {
            if (this.currentPercentage < this.targetPercentage) {
                const diff = this.targetPercentage - this.currentPercentage;
                const increment = Math.max(0.5, diff * 0.1); // Minimum 0.5%, maximum 10% of difference
                this.currentPercentage = Math.min(this.targetPercentage, this.currentPercentage + increment);
                this.percentageElement.textContent = `${Math.round(this.currentPercentage)}%`;
            }
            if (!this.isComplete) requestAnimationFrame(animate);
        };
        animate();
    }

    checkCompletion() {
        const elapsed = Date.now() - this.startTime;
        const allResourcesLoaded = this.resourcesLoaded >= this.totalResources;
        const documentComplete = document.readyState === 'complete';
        const criticalImagesLoaded = this.checkCriticalImages();
        
        if (allResourcesLoaded && documentComplete && criticalImagesLoaded && !this.isComplete) {
            this.targetPercentage = 100;
            setTimeout(() => this.completeLoading(), 500); // Small delay to show 100%
        }
    }

    checkCriticalImages() {
        const criticalImages = [
            './assets/page1/landing_image_nocar_nowaves.jpg',
            './assets/common/Logo1-White.png'
        ];
        
        return criticalImages.every(src => {
            const resource = this.resourcesMap.get(src);
            return resource && resource.loaded;
        });
    }

    completeLoading() {
        if(!this.isComplete) {
            this.isComplete = true;
            this.currentPercentage = 100;
            this.percentageElement.textContent = '100%';
            
            const loadTime = Date.now() - this.startTime;
            const failedResources = Array.from(this.resourcesMap.values()).filter(r => r.failed);
            // if(DEBUG) console.log(`> LoadingManager: Loading completed in ${loadTime}ms`);
            if (failedResources.length > 0) console.warn(`${failedResources.length} resources failed to load:`, failedResources.map((r, src) => Array.from(this.resourcesMap.keys())[Array.from(this.resourcesMap.values()).indexOf(r)]));
            
            // Add slide-up animation
            setTimeout(() => {
                this.loadingPage.classList.add('slide-up');
                setTimeout(() => this.loadingPage.style.display = 'none', 800);
            }, 300);
        }
    }
}

class ViewportDetector {
    constructor() {
        this.navLinks = new Map();
        this.observer = null;
        this.init();
    }

    init() {
        // Map navigation links to their corresponding page sections
        this.setupNavLinkMapping();
        
        // Create intersection observer
        this.createObserver();
        
        // Start observing page sections
        this.startObserving();
    }

    setupNavLinkMapping() {
        // Define the mapping between nav links and page sections
        const linkMappings = [
            { href: 'home', sectionId: 'Home' },
            { href: '2', sectionId: 'AboutUs' },
            { href: '4', sectionId: 'OurValues' },
            { href: '6', sectionId: 'OurServices' },
            { href: '7', sectionId: 'OurTeam' },
            { href: 'end', sectionId: 'Announcement' },
            { href: '8', sectionId: 'ContactUs' }
        ];

        // Find nav-link elements and map them to sections
        linkMappings.forEach(mapping => {
            const navLink = document.querySelector(`.nav-link a[href="${mapping.href}"]`)?.closest('.nav-link');
            const section = document.getElementById(mapping.sectionId);
            
            if (navLink && section) {
                this.navLinks.set(section, navLink);
            }
        });

        console.log(`ViewportDetector: Mapped ${this.navLinks.size} navigation links to sections`);
    }

    createObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5 // 50% of the section must be visible
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const navLink = this.navLinks.get(entry.target);
                
                if (navLink) {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        // Section is mostly visible (50%+)
                        navLink.setAttribute('data-viewport', 'true');
                        console.log(`ViewportDetector: ${entry.target.id} section is in viewport`);
                    } else {
                        // Section is not mostly visible
                        navLink.removeAttribute('data-viewport');
                        console.log(`ViewportDetector: ${entry.target.id} section left viewport`);
                    }
                }
            });
        }, options);
    }

    startObserving() {
        // Observe all mapped sections
        this.navLinks.forEach((navLink, section) => {
            this.observer.observe(section);
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.navLinks.clear();
    }
}

class AspectRatioUpdater {
    constructor() {
        this.init();
    }

    init() {
        // Update aspect ratio immediately
        this.updateAspectRatio();
        // Update on window resize
        window.addEventListener('resize', () => this.updateAspectRatio() );
        // Update on orientation change (mobile devices)
        window.addEventListener('orientationchange', () => setTimeout(() => this.updateAspectRatio(), 100) );
    }

    updateAspectRatio() {
        document.documentElement.style.setProperty('--viewport_height', window.innerHeight + 'px');
        document.documentElement.style.setProperty('--viewport_width', window.innerWidth + 'px');
    }
}

// class ScrollSnap {
//     constructor() {
//         this.init();
//     }

//     async init() {
//         if(DEBUG) console.log('> ScrollSnap: Initializing...');
//         await this.buildCheckpoints();
//         await this.createObserver();
//     }

//     async buildCheckpoints() {
//         this.checkpoints = Array.from(document.querySelectorAll('.snap_checkpoint'))
//         .map(elem => (
//             { 
//                 element: elem, 
//                 checkpoint: 
//                 elem.dataset.checkpoint, 
//                 speed: parseInt(elem.dataset.speed) || this.defaultSpeed, 
//                 position: parseInt(elem.getBoundingClientRect().top + window.pageYOffset)
//             }
//         )).sort((a, b) => (a.checkpoint === 'home')? -1 : (b.checkpoint === 'home')? 1 : (a.checkpoint === 'end')? 1 : (b.checkpoint === 'end')? -1 : parseInt(a.checkpoint) - parseInt(b.checkpoint) );
//         if(DEBUG) console.log('> ScrollSnap: Built', this.checkpoints);
//         await this.findCurrentCheckpoint();
//     }

//     async findCurrentCheckpoint() {
//         if(DEBUG) console.log('> ScrollSnap: Finding current checkpoint...');
//         let closestElement = null;
//         let minDist = Infinity;

//         for (let i = 0; i < this.checkpoints.length; i++) {
//             const currPos = this.checkpoints[i].element.getBoundingClientRect().top;
//             if (Math.abs(currPos) <= Math.abs(window.innerHeight/2)) { closestElement = this.checkpoints[i]; break } 
//             else if(Math.abs(currPos) < Math.abs(minDist) || (currPos < minDist)) { minDist = currPos; closestElement = this.checkpoints[i] }
//         }

//         this.currentIndex = this.checkpoints.indexOf(closestElement);
//         // window.scrollTo(closestElement.position, 0);
//         await this.snapToCheckpoint(this.currentIndex);
//         if(DEBUG) console.log('> ScrollSnap: Found current checkpoint:', this.checkpoints[this.currentIndex].checkpoint, 'at index', this.currentIndex);
        
//     }

//     async snapToCheckpoint(index) {
//         window.scrollTo({ top: this.checkpoints[index].position, behavior: 'smooth' });
//         this.snapComplete = true;
//     }

//     async createObserver() {
//         window.addEventListener('scrollend', async () => {
//             if(!this.isSnapping) {
//                 this.snapComplete = false;
//                 await this.findCurrentCheckpoint();
//                 if(this.snapComplete) this.isSnapping = false;
//             }
//         });
//     }
// }

// class ScrollSnap {
//     constructor() {
//         this.init();
//     }

//     init() {
//         if(DEBUG) console.log('> ScrollSnap: Initializing...');
//         this.buildCheckpoints();
//         this.createObserver();
//     }

//     buildCheckpoints() {
//         this.checkpoints = Array.from(document.querySelectorAll('.snap_checkpoint'))
//         .map(elem => (
//             { 
//                 element: elem, 
//                 checkpoint: 
//                 elem.dataset.checkpoint, 
//                 speed: parseInt(elem.dataset.speed) || this.defaultSpeed, 
//                 position: parseInt(elem.getBoundingClientRect().top + window.pageYOffset)
//             }
//         )).sort((a, b) => (a.checkpoint === 'home')? -1 : (b.checkpoint === 'home')? 1 : (a.checkpoint === 'end')? 1 : (b.checkpoint === 'end')? -1 : parseInt(a.checkpoint) - parseInt(b.checkpoint) );
//         if(DEBUG) console.log('> ScrollSnap: Built', this.checkpoints);
//         this.findCurrentCheckpoint();
//     }

//     findCurrentCheckpoint() {
//         if(DEBUG) console.log('> ScrollSnap: Finding current checkpoint...');
//         let closestElement = null;
//         let minDist = Infinity;

//         for (let i = 0; i < this.checkpoints.length; i++) {
//             const currPos = this.checkpoints[i].element.getBoundingClientRect().top;
//             if (Math.abs(currPos) <= Math.abs(window.innerHeight/2)) { closestElement = this.checkpoints[i]; break } 
//             else if(Math.abs(currPos) < Math.abs(minDist) || (currPos < minDist)) { minDist = currPos; closestElement = this.checkpoints[i] }
//         }

//         this.currentIndex = this.checkpoints.indexOf(closestElement);
//         // window.scrollTo(closestElement.position, 0);
//         this.snapToCheckpoint(this.currentIndex);
//         if(DEBUG) console.log('> ScrollSnap: Found current checkpoint:', this.checkpoints[this.currentIndex].checkpoint, 'at index', this.currentIndex);
        
//     }

//     // snapToCheckpoint(index) {
//     //     window.scrollTo({ top: this.checkpoints[index].position, behavior: 'smooth' }).then(() => {
//     //         this.snapComplete = true;
//     //     });
//     // }

//     snapToCheckpoint(index) {
//         // Set flag that we're starting a snap
//         this.snapComplete = false;
        
//         // Add one-time listener for scroll completion
//         const handleScrollEnd = () => {
//             this.snapComplete = true;
//             window.removeEventListener('scrollend', handleScrollEnd);
//         };
        
//         window.addEventListener('scrollend', handleScrollEnd, { once: true });
        
//         // Start the scroll
//         window.scrollTo({ top: this.checkpoints[index].position, behavior: 'smooth' });
//     }

//     createObserver() {
//         window.addEventListener('scrollend', () => {
//             if(!this.isSnapping) {
//                 this.snapComplete = false;
//                 this.findCurrentCheckpoint();
//                 if(this.snapComplete) this.isSnapping = false;
//             }
//         });
//     }
// }

// class ScrollSnap {
//     constructor() {
//         this.checkpoints = [];
//         this.currentIndex = 0;
//         this.isSnapping = false;
//         this.defaultSpeed = 800;
//         this.touchY = null;
//         this.lastWheelTime = Date.now();
//         this.wheelCooldown = 1000;          //time in ms, 1000 = 1s
//         this.init();
//     }

//     init() {
//         if(DEBUG) console.log('> ScrollSnap: Initializing...');
//         document.documentElement.style.scrollSnapType = 'none'; //Disabeling CSS scroll-snap
//         document.documentElement.style.scrollBehavior = 'auto'; //Disabeling CSS scroll-snap
//         this.buildCheckpoints();
//         this.createObserver();
//         if(DEBUG) console.log('> ScrollSnap: Initialized with', this.checkpoints.length, 'checkpoints, current:', this.currentIndex);
//     }

//     buildCheckpoints() {
//         this.checkpoints = Array.from(document.querySelectorAll('.snap_checkpoint'))
//         .map(elem => (
//             { 
//                 element: elem, 
//                 checkpoint: 
//                 elem.dataset.checkpoint, 
//                 speed: parseInt(elem.dataset.speed) || this.defaultSpeed, 
//                 position: parseInt(elem.getBoundingClientRect().top + window.pageYOffset)
//             }
//         )).sort((a, b) => (a.checkpoint === 'home')? -1 : (b.checkpoint === 'home')? 1 : (a.checkpoint === 'end')? 1 : (b.checkpoint === 'end')? -1 : parseInt(a.checkpoint) - parseInt(b.checkpoint) );
//         if(DEBUG) console.log('> ScrollSnap: Built', this.checkpoints);
//         this.findCurrentCheckpoint();
//     }

//     findCurrentCheckpoint() {
//         if(DEBUG) console.log('> ScrollSnap: Finding current checkpoint...');
//         let closestElement = null;
//         let minDist = Infinity;

//         for (let i = 0; i < this.checkpoints.length; i++) {
//             const currPos = this.checkpoints[i].element.getBoundingClientRect().top;
//             if (Math.abs(currPos) <= Math.abs(window.innerHeight/2)) { closestElement = this.checkpoints[i]; break } 
//             else if(Math.abs(currPos) < Math.abs(minDist) || (currPos < minDist)) { minDist = currPos; closestElement = this.checkpoints[i] }
//         }

//         this.currentIndex = this.checkpoints.indexOf(closestElement);
//         // window.scrollTo(closestElement.position, 0);
//         this.snapToCheckpoint(this.currentIndex);
//         if(DEBUG) console.log('> ScrollSnap: Found current checkpoint:', this.checkpoints[this.currentIndex].checkpoint, 'at index', this.currentIndex);
        
//     }

//     createObserver() {
//         document.addEventListener('wheel', (e) => {
//             if(DEBUG) console.log('> ScrollSnap: Wheel event detected', this.isSnapping, (Date.now() - this.lastWheelTime > this.wheelCooldown));
//                 // e.preventDefault();
//                 // e.stopPropagation();
//             if(e.deltaX === 0) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 if(!this.isSnapping && (Date.now() - this.lastWheelTime > this.wheelCooldown)) {
//                     this.isSnapping = true
//                     this.handleScrollEvent((e.deltaY > 0) ? 1 : -1);
//                 }
//             } else {
//                 this.lastWheelTime = Date.now();
//             }
//         }, { passive: false })

//         document.addEventListener('keydown', (e) => {
//             if(DEBUG) console.log('> ScrollSnap: Keydown event detected');
//             if(!this.isSnapping) {
//                 this.isSnapping = true;
//                 switch(e.key) {
//                     case 'PageUp':
//                     case 'ArrowUp':
//                         e.preventDefault();
//                         e.stopPropagation();
//                         this.handleScrollEvent(-1);
//                         break;
//                     case 'PageDown':
//                     case 'ArrowDown':
//                         e.preventDefault();
//                         e.stopPropagation();
//                         this.handleScrollEvent(1);
//                         break;
//                 }
//             }
            
//         }, { passive: false })

//         document.addEventListener('touchstart', (e) => {
//             if(DEBUG) console.log('> ScrollSnap: Touchstart event detected');
//             e.preventDefault();
//             e.stopPropagation();
//             if(!this.isSnapping) this.touchY = e.touches[0].clientY;
//         }, { passive: false })

//         document.addEventListener('touchmove', async (e) => {
//             if(DEBUG) console.log('> ScrollSnap: Touchmove event detected', this.isSnapping, this.touchY);
//             e.preventDefault();
//             e.stopPropagation();
//             if(!this.isSnapping && this.touchY !== null) {
//                 const deltaY = e.touches[0].clientY - this.touchY;
//                 this.touchY = null;
//                 if(DEBUG) console.log('> ScrollSnap: Touchmove deltaY', deltaY);
//                 if (Math.abs(deltaY) > 10) {
//                     this.isSnapping = true;
//                     await this.handleScrollEvent((deltaY < 0)? 1 : -1);
//                 }
//             }
//         }, { passive: false })
//     }

//     async handleScrollEvent(direction) {
//         if(DEBUG) console.log('> ScrollSnap: Scroll event detected moving ', direction, 'from index ', this.currentIndex);
//         const nextIndex = this.currentIndex + direction;
//         if (nextIndex >= 0 && nextIndex < this.checkpoints.length) {
//             await this.snapToCheckpoint(nextIndex);
//             this.findCurrentCheckpoint();
//         } else this.isSnapping = false;
//         if(DEBUG) console.log('> ScrollSnap: Scroll event completed ', direction, 'from index ', this.currentIndex);
//     }

//     // snapToCheckpoint(index) {
//     //     if(DEBUG) console.log(`ScrollSnap: Snapping to checkpoint ${this.checkpoints[index].checkpoint} at position ${this.checkpoints[index].position}`);
//     //     // this.animateScrollTo_linear(this.checkpoints[index].position, this.checkpoints[index].speed);
//     //     // this.animateScrollTo_sine(this.checkpoints[index].position, this.checkpoints[index].speed);
//     //     // this.animateScrollTo_acceleration(this.checkpoints[index].position, this.checkpoints[index].speed);
//     //     // this.animateScrollTo_bezier(this.checkpoints[index].position, this.checkpoints[index].speed);
//     //     // this.animateScrollTo(this.checkpoints[index].position, this.checkpoints[index].speed);
//     //     window.scrollTo({ top: this.checkpoints[index].position, behavior: 'smooth' });
//     //     this.currentIndex = index;
//     //     this.lastWheelTime = Date.now();
//     //     setTimeout(() => this.isSnapping = false, 200);
//     // }

//     scrollToCheckpoint(checkpointValue) {
//         if(DEBUG) console.log(`ScrollSnap: Searching for checkpoint with value "${checkpointValue}"`);
        
//         // Find the checkpoint with matching data-checkpoint value
//         const targetCheckpointIndex = this.checkpoints.findIndex(checkpoint => 
//             checkpoint.checkpoint === checkpointValue
//         );
        
//         if (targetCheckpointIndex !== -1) {
//             if(DEBUG) console.log(`ScrollSnap: Found checkpoint "${checkpointValue}" at index ${targetCheckpointIndex}`);
//             this.snapToCheckpoint(targetCheckpointIndex);
//         } else {
//             console.warn(`ScrollSnap: Checkpoint with value "${checkpointValue}" not found`);
//         }
//     }

//     snapToCheckpoint(index) {
//         return new Promise((resolve) => {
//             this.snapComplete = false;
//             const targetPosition = this.checkpoints[index].position;
//             const startPosition = window.pageYOffset;
//             const distance = targetPosition - startPosition;
//             const duration = 800; // ms
//             const startTime = performance.now();
            
//             const animate = (currentTime) => {
//                 const elapsed = currentTime - startTime;
//                 const progress = Math.min(elapsed / duration, 1);
                
//                 // Easing function (ease-in-out)
//                 const easeProgress = progress < 0.5 
//                     ? 2 * progress * progress 
//                     : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
//                 const currentPosition = startPosition + (distance * easeProgress);
//                 window.scrollTo(0, currentPosition);
                
//                 if (progress < 1) {
//                     requestAnimationFrame(animate);
//                 } else {
//                     this.snapComplete = true;
//                     this.currentIndex = index;
//                     this.lastWheelTime = Date.now();
//                     setTimeout(() => this.isSnapping = false, 200);
//                     resolve();
//                 }
//             };
            
//             requestAnimationFrame(animate);
//         });
//     }

//     animateScrollTo(targetPosition, duration) {
//         const startPosition = window.pageYOffset;
//         const distance = targetPosition - startPosition;
//         const frames = Math.round(duration / (1000 / 60)); // Calculate total frames based on duration and target FPS
//         const animationPos = [0];

//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {startPosition, targetPosition, distance, duration, frames});
//         for (let i = 1; i < frames + 1; i++) {
//             const progress = i / frames;
//             const easeInOutSine = -(Math.cos(Math.PI * progress) - 1) / 2;
//             animationPos[i] = startPosition + (distance * easeInOutSine);
//             // if(DEBUG) console.log('> ScrollSnap: Animation frame', {i, currentPosition: animationPos[i]});
//         }
//         animationPos[frames] = targetPosition;
//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {animationPos});

//         let frame = 0;
//         const animate = () => {
//             frame++;
//             window.scrollTo(0, animationPos[frame]);
//             if (frame < frames) {
//                 setTimeout(() => {
//                     requestAnimationFrame(animate);
//                 }, 1000 / 60);
//             }
//         };

//         requestAnimationFrame(animate);
//     }

//     animateScrollTo_bezier(targetPosition, duration) {
//         const startPosition = window.pageYOffset;
//         const distance = targetPosition - startPosition;
//         const frames = Math.round(duration / (1000 / 60)); // Calculate total frames based on duration and target FPS
//         const animationPos = [0];

//         if(DEBUG) console.log('> ScrollSnap: Animation start', {startPosition, targetPosition, distance, duration, frames});
//         for (let i = 1; i < frames + 1; i++) {
//             animationPos[i] = this.bezier(i/frames, startPosition, targetPosition, 0 , targetPosition);
//             // animationPos[i] = startPosition + (distance * this.bezier(i, 1, 0, 0 ,1));
//             if(DEBUG) console.log('> ScrollSnap: Animation frame', {i, currentPosition: animationPos[i]});
//         }
//         animationPos[frames] = targetPosition;
//         if(DEBUG) console.log('> ScrollSnap: Animation start', {animationPos});

//         let frame = 0;
//         const animate = () => {
//             frame++;
//             window.scrollTo(0, animationPos[frame]);
//             if (frame < frames) {
//                 setTimeout(() => {
//                     requestAnimationFrame(animate);
//                 }, 1000 / 60);
//             }
//         };

//         requestAnimationFrame(animate);
//     }

//     bezier(t, initial, p1, p2, final) {
//         return (
//             (1 - t) * (1 - t) * (1 - t) * initial +
//             3 * (1 - t) * (1 - t) * t * p1 +
//             3 * (1 - t) * t * t * p2 +
//             t * t * t * final
//         );
//     }

//     animateScrollTo_acceleration(targetPosition, duration) {
//         const startPosition = window.pageYOffset;
//         const distance = targetPosition - startPosition;
//         const frames = Math.round(duration / (1000 / 60)); // Calculate total frames based on duration and target FPS
//         const acceleration = 10
//         const timeOfMotion = Math.sqrt(Math.abs(distance) * 2 / acceleration);
//         const interval = timeOfMotion / (frames);
//         let time = interval;
//         const animationPos = [0];
        
//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {startPosition, targetPosition, distance, duration, frames, timeOfMotion, interval});
//         for (let i = 1; i < frames + 1; i++) {
//             animationPos[i] = startPosition + 0.5 * acceleration * time * time * (distance < 0 ? -1 : 1);
//             // if(DEBUG) console.log('> ScrollSnap: Animation frame', {i, time , currentPosition: animationPos[i]});
//             time += interval;
//         }
//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {animationPos});

//         let frame = 0;
//         const animate = (currentTime) => {
//             frame++;
//             window.scrollTo(0, animationPos[frame]);
//             if (frame < frames) {
//                 setTimeout(() => {
//                     requestAnimationFrame(animate);
//                 }, 1000 / 60);
//             }
//         };

//         requestAnimationFrame(animate);
//     }

//     animateScrollTo_sine(targetPosition, duration) {
//         const startPosition = window.pageYOffset;
//         const distance = targetPosition - startPosition;
//         const frames = Math.round(duration / (1000 / 60)); // Calculate total frames based on duration and target FPS
//         const startTime = performance.now();
//         const animationPos = [0];

//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {startPosition, targetPosition, distance, duration, frames});
//         for (let i = 1; i < frames + 1; i++) {
//             const easeInOutSine = 1 - (Math.cos(i * 0.5 * Math.PI / (frames)));
//             animationPos[i] = startPosition + (distance * easeInOutSine);
//             // if(DEBUG) console.log('> ScrollSnap: Animation frame', {i, currentPosition: animationPos[i]});
//         }
//         animationPos[frames] = targetPosition;
//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {animationPos});

//         let frame = 0;
//         const animate = () => {
//             frame++;
//             window.scrollTo(0, animationPos[frame]);
//             if (frame < frames) {
//                 setTimeout(() => {
//                     requestAnimationFrame(animate);
//                 }, 1000 / 60);
//             }
//         };

//         requestAnimationFrame(animate);
//     }

//     animateScrollTo_linear(targetPosition, duration) {
//         const startPosition = window.pageYOffset;
//         const distance = targetPosition - startPosition;
//         const frames = Math.round(duration / (1000 / 60)); // Calculate total frames based on duration and target FPS
//         const distancePerFrame = distance / frames;
//         const animationPos = [0];

//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {startPosition, targetPosition, distance, duration, frames, distancePerFrame});
//         for (let i = 1; i < frames + 1; i++) animationPos[i] = startPosition + (distancePerFrame * i);
//         // if(DEBUG) console.log('> ScrollSnap: Animation start', {animationPos});

//         let frame = 0;
//         const animate = () => {
//             frame++;
//             // if(DEBUG) console.log('> ScrollSnap: Animation frame', {frame, currentPosition: animationPos[frame]});
//             window.scrollTo(0, animationPos[frame]);
//             if (frame < frames) {
//                 setTimeout(() => {
//                     requestAnimationFrame(animate);
//                 }, 1000 / 60);
//             }
//         };

//         requestAnimationFrame(animate);
//     }
// }

class ScrollSnap {
    constructor() {
        this.checkpoints = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.isProcessing = false;
        
        // Platform detection
        this.isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        this.isTrackpad = false; // Will be detected dynamically
        
        // Trackpad-specific settings
        this.scrollAccumulator = 0;
        this.scrollThreshold = 50; // Minimum accumulated scroll to trigger snap
        this.scrollDecayRate = 0.85; // How fast accumulator decays
        this.maxAccumulator = 200; // Prevent excessive accumulation
        
        // Timing controls
        this.lastScrollTime = 0;
        this.scrollDebounceTime = 16; // ~60fps
        this.snapCooldown = 1000; // Minimum time between snaps
        this.lastSnapTime = 0;
        
        // Animation settings
        this.animationDuration = 600;
        this.easingFunction = this.easeInOutCubic;
        
        // Gesture detection
        this.touchStartY = null;
        this.touchStartTime = 0;
        this.velocityTracker = [];
        
        this.init();
    }

    init() {
        if (DEBUG) console.log('> ScrollSnap: Initializing superior trackpad-optimized version...');
        
        // Disable native scroll behaviors
        document.documentElement.style.scrollSnapType = 'none';
        document.documentElement.style.scrollBehavior = 'auto';
        
        this.buildCheckpoints();
        this.setupEventListeners();
        this.startDecayLoop();
        
        if (DEBUG) console.log('> ScrollSnap: Initialized with', this.checkpoints.length, 'checkpoints');
    }

    buildCheckpoints() {
        // Force layout recalculation
        document.body.offsetHeight;
        
        this.checkpoints = Array.from(document.querySelectorAll('.snap_checkpoint'))
            .map(elem => {
                const rect = elem.getBoundingClientRect();
                return {
                    element: elem,
                    checkpoint: elem.dataset.checkpoint,
                    speed: parseInt(elem.dataset.speed) || this.animationDuration,
                    position: Math.round(rect.top + window.pageYOffset)
                };
            })
            .sort((a, b) => {
                if (a.checkpoint === 'home') return -1;
                if (b.checkpoint === 'home') return 1;
                if (a.checkpoint === 'end') return 1;
                if (b.checkpoint === 'end') return -1;
                return parseInt(a.checkpoint) - parseInt(b.checkpoint);
            });

        this.findCurrentCheckpoint();
        
        if (DEBUG) console.log('> ScrollSnap: Built checkpoints:', this.checkpoints.map(cp => ({
            checkpoint: cp.checkpoint,
            position: cp.position
        })));
    }

    findCurrentCheckpoint() {
        const currentScroll = window.pageYOffset;
        let closestIndex = 0;
        let minDistance = Infinity;

        this.checkpoints.forEach((checkpoint, index) => {
            const distance = Math.abs(checkpoint.position - currentScroll);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        this.currentIndex = closestIndex;
        
        if (DEBUG) console.log('> ScrollSnap: Current checkpoint:', this.checkpoints[this.currentIndex]?.checkpoint, 'at index', this.currentIndex);
    }

    setupEventListeners() {
        // Wheel events with trackpad detection
        document.addEventListener('wheel', (e) => this.handleWheelEvent(e), { passive: false });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardEvent(e), { passive: false });
        
        // Touch events for mobile
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Resize handling
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.buildCheckpoints();
            }, 150);
        });
        
        // Prevent browser's own smooth scrolling
        document.addEventListener('scroll', (e) => {
            if (this.isAnimating) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, { passive: false, capture: true });
    }

    handleWheelEvent(e) {
        if (DEBUG) console.log('> ScrollSnap: Wheel event', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode });
        // Detect trackpad vs mouse wheel
        this.detectTrackpadInput(e);
        if (DEBUG) console.log('> ScrollSnap: Input type', this.isTrackpad ? 'Trackpad' : 'Mouse Wheel');
        
        // Only handle vertical scrolling
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const now = performance.now();
        
        // Debounce rapid events
        if (now - this.lastScrollTime < this.scrollDebounceTime) return;
        this.lastScrollTime = now;
        
        if (this.isTrackpad) {
            this.handleTrackpadScroll(e.deltaY);
        } else {
            this.handleMouseWheelScroll(e.deltaY);
        }
    }

    detectTrackpadInput(e) {
        // Trackpad typically has:
        // - Smaller deltaY values
        // - More frequent events
        // - Non-zero deltaX even for vertical scrolls (sometimes)
        
        const isLikelyTrackpad = (
            Math.abs(e.deltaY) < 50 && // Small delta
            e.deltaMode === 0  // Pixel mode
            // e.deltaMode === 0 && // Pixel mode
            // this.isMac // On Mac platform
        );
        
        if (isLikelyTrackpad) {
            this.isTrackpad = true;
        }
    }

    handleTrackpadScroll(deltaY) {
        if (DEBUG) console.log('> ScrollSnap: Trackpad scroll detected', { deltaY, scrollAccumulator: this.scrollAccumulator, maxAccumulator: this.maxAccumulator, scrollThreshold: this.scrollThreshold });
        // Accumulate scroll delta
        this.scrollAccumulator += deltaY;
        
        // Clamp accumulator to prevent excessive values
        this.scrollAccumulator = Math.max(-this.maxAccumulator, 
            Math.min(this.maxAccumulator, this.scrollAccumulator));
        
        // Check if we've accumulated enough scroll to trigger a snap
        if (Math.abs(this.scrollAccumulator) >= this.scrollThreshold) {
            const direction = this.scrollAccumulator > 0 ? 1 : -1;
            
            if (this.canSnap()) {
                this.scrollAccumulator = 0; // Reset accumulator
                this.snapInDirection(direction);
            }
        }
    }

    handleMouseWheelScroll(deltaY) {
        // Direct snap for mouse wheel (no accumulation needed)
        if (this.canSnap()) {
            const direction = deltaY > 0 ? 1 : -1;
            this.snapInDirection(direction);
        }
    }

    canSnap() {
        const now = performance.now();
        return !this.isAnimating && 
               !this.isProcessing && 
               (now - this.lastSnapTime > this.snapCooldown);
    }

    snapInDirection(direction) {
        const targetIndex = this.currentIndex + direction;
        
        if (targetIndex >= 0 && targetIndex < this.checkpoints.length) {
            this.snapToIndex(targetIndex);
        }
    }

    snapToIndex(index) {
        if (index < 0 || index >= this.checkpoints.length || this.isAnimating) return;
        
        this.isProcessing = true;
        this.lastSnapTime = performance.now();
        
        const targetCheckpoint = this.checkpoints[index];
        const startPosition = window.pageYOffset;
        const targetPosition = targetCheckpoint.position;
        
        if (DEBUG) console.log(`> ScrollSnap: Snapping to checkpoint "${targetCheckpoint.checkpoint}" (${startPosition} → ${targetPosition})`);
        
        this.animateToPosition(startPosition, targetPosition, targetCheckpoint.speed)
            .then(() => {
                this.currentIndex = index;
                this.isProcessing = false;
                
                if (DEBUG) console.log(`> ScrollSnap: Snap completed to checkpoint "${targetCheckpoint.checkpoint}"`);
            })
            .catch((error) => {
                console.error('Snap animation failed:', error);
                this.isProcessing = false;
            });
    }

    animateToPosition(startPosition, targetPosition, duration = this.animationDuration) {
        return new Promise((resolve) => {
            if (Math.abs(targetPosition - startPosition) < 1) {
                resolve();
                return;
            }
            
            this.isAnimating = true;
            const startTime = performance.now();
            const distance = targetPosition - startPosition;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Apply easing
                const easedProgress = this.easingFunction(progress);
                const currentPosition = startPosition + (distance * easedProgress);
                
                // Use direct scroll to bypass any scroll event handling
                this.directScrollTo(currentPosition);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.isAnimating = false;
                    this.directScrollTo(targetPosition); // Ensure exact final position
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    directScrollTo(position) {
        // Bypass event listeners during animation
        const scrollHandler = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
        };
        
        document.addEventListener('scroll', scrollHandler, { passive: false, capture: true });
        window.scrollTo(0, position);
        document.removeEventListener('scroll', scrollHandler, { capture: true });
    }

    startDecayLoop() {
        // Gradually decay the scroll accumulator to prevent drift
        const decay = () => {
            if (Math.abs(this.scrollAccumulator) > 0.1) {
                this.scrollAccumulator *= this.scrollDecayRate;
            } else {
                this.scrollAccumulator = 0;
            }
            requestAnimationFrame(decay);
        };
        requestAnimationFrame(decay);
    }

    // Touch handling for mobile devices
    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = performance.now();
        this.velocityTracker = [];
    }

    handleTouchMove(e) {
        if (!this.touchStartY || e.touches.length !== 1) return;
        
        const currentY = e.touches[0].clientY;
        const currentTime = performance.now();
        
        // Track velocity
        this.velocityTracker.push({
            position: currentY,
            time: currentTime
        });
        
        // Keep only recent velocity data
        if (this.velocityTracker.length > 3) {
            this.velocityTracker.shift();
        }
    }

    handleTouchEnd(e) {
        if (!this.touchStartY) return;
        
        const endTime = performance.now();
        const duration = endTime - this.touchStartTime;
        
        // Calculate swipe velocity
        if (this.velocityTracker.length >= 2) {
            const latest = this.velocityTracker[this.velocityTracker.length - 1];
            const earliest = this.velocityTracker[0];
            const distance = latest.position - earliest.position;
            const time = latest.time - earliest.time;
            const velocity = Math.abs(distance / time);
            
            // Trigger snap based on velocity and duration
            if (velocity > 0.3 && duration < 300) {
                e.preventDefault();
                const direction = distance < 0 ? 1 : -1;
                if (this.canSnap()) {
                    this.snapInDirection(direction);
                }
            }
        }
        
        // Reset touch tracking
        this.touchStartY = null;
        this.velocityTracker = [];
    }

    handleKeyboardEvent(e) {
        if (this.isAnimating) return;
        
        let direction = 0;
        
        switch (e.key) {
            case 'ArrowDown':
            case 'PageDown':
            case ' ': // Spacebar
                direction = 1;
                break;
            case 'ArrowUp':
            case 'PageUp':
                direction = -1;
                break;
            case 'Home':
                e.preventDefault();
                this.snapToIndex(0);
                return;
            case 'End':
                e.preventDefault();
                this.snapToIndex(this.checkpoints.length - 1);
                return;
            default:
                return;
        }
        
        if (direction !== 0) {
            e.preventDefault();
            this.snapInDirection(direction);
        }
    }

    // Public method for programmatic navigation
    scrollToCheckpoint(checkpointValue) {
        const targetIndex = this.checkpoints.findIndex(cp => cp.checkpoint === checkpointValue);
        
        if (targetIndex !== -1) {
            if (DEBUG) console.log(`> ScrollSnap: Programmatic navigation to checkpoint "${checkpointValue}"`);
            this.snapToIndex(targetIndex);
        } else {
            console.warn(`ScrollSnap: Checkpoint "${checkpointValue}" not found`);
        }
    }

    // Easing functions
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    // Method to refresh checkpoints (useful for dynamic content)
    refresh() {
        if (DEBUG) console.log('> ScrollSnap: Refreshing checkpoints...');
        this.buildCheckpoints();
    }

    // Cleanup method
    destroy() {
        // Remove all event listeners and reset state
        this.isAnimating = false;
        this.isProcessing = false;
        document.documentElement.style.scrollSnapType = '';
        document.documentElement.style.scrollBehavior = '';
        
        if (DEBUG) console.log('> ScrollSnap: Destroyed');
    }
}

class CounterAnimation {
    constructor() {
        this.counters = new Map();
        this.observer = null;
        this.init();
    }

    init() {
        // if (DEBUG) console.log('CounterAnimation: Initializing...');
        
        // Find all counter elements
        this.findCounters();
        
        // Create intersection observer
        this.createObserver();
        
        // Start observing counters
        this.startObserving();
        
        // if (DEBUG) console.log(`CounterAnimation: Initialized with ${this.counters.size} counters`);
    }

    findCounters() {
        const counterElements = document.querySelectorAll('.counter');
        
        counterElements.forEach(element => {
            const targetValue = parseInt(element.textContent.trim());
            const speed = parseInt(element.dataset.speed) || 2000; // Default 2 seconds
            
            if (!isNaN(targetValue)) {
                this.counters.set(element, {
                    target: targetValue,
                    current: 0,
                    speed: speed,
                    isAnimating: false,
                    animationId: null
                });
                
                // Set initial value to 0
                element.textContent = '0';
                
                // if (DEBUG) console.log(`CounterAnimation: Found counter with target ${targetValue}, speed ${speed}ms`);
            }
        });
    }

    createObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 1.0 // Element must be fully visible
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const counterData = this.counters.get(entry.target);
                if (!counterData) return;

                if (entry.isIntersecting) {
                    // Element is fully visible - start counting
                    this.startCounter(entry.target, counterData);
                } else {
                    // Element is not fully visible - reset to 0
                    this.resetCounter(entry.target, counterData);
                }
            });
        }, options);
    }

    startObserving() {
        this.counters.forEach((counterData, element) => {
            this.observer.observe(element);
        });
    }

    startCounter(element, counterData) {
        if (counterData.isAnimating) return;
        
        // if (DEBUG) console.log(`CounterAnimation: Starting counter for target ${counterData.target}`);
        
        counterData.isAnimating = true;
        counterData.current = 0;
        
        const startTime = performance.now();
        const duration = counterData.speed;
        const targetValue = counterData.target;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeOutQuart easing for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            counterData.current = Math.round(easeProgress * targetValue);
            
            // Update the element's text
            element.textContent = counterData.current.toString();
            
            if (progress < 1) {
                counterData.animationId = requestAnimationFrame(animate);
            } else {
                // Animation complete
                counterData.isAnimating = false;
                counterData.animationId = null;
                element.textContent = targetValue.toString();
                // if (DEBUG) console.log(`CounterAnimation: Counter animation completed for target ${targetValue}`);
            }
        };

        counterData.animationId = requestAnimationFrame(animate);
    }

    resetCounter(element, counterData) {
        // if (DEBUG) console.log(`CounterAnimation: Resetting counter for target ${counterData.target}`);
        
        // Cancel any ongoing animation
        if (counterData.animationId) {
            cancelAnimationFrame(counterData.animationId);
            counterData.animationId = null;
        }
        
        // Reset state
        counterData.isAnimating = false;
        counterData.current = 0;
        
        // Reset element text to 0
        element.textContent = '0';
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Cancel all ongoing animations
        this.counters.forEach((counterData, element) => {
            if (counterData.animationId) {
                cancelAnimationFrame(counterData.animationId);
            }
        });
        
        this.counters.clear();
    }
}

class ServicesCardManager {
    constructor() {
        this.containerSelector = '#Services > .wrapper > .container:first-child > .wrapper > .container';
        this.imageWrapperSelector = null; // Will be determined dynamically
        this.contentWrapperSelector = null; // Will be determined dynamically
        this.containers = [];
        this.init();
    }

    init() {
        // if (DEBUG) console.log('ServicesCardManager: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find all matching containers
        this.containers = Array.from(document.querySelectorAll(this.containerSelector));
        
        if (this.containers.length === 0) {
            console.warn('ServicesCardManager: No containers found with selector:', this.containerSelector);
            return;
        }

        // Find the image and content wrappers dynamically
        this.findTargetElements();
        
        // Add click listeners
        this.addClickListeners();
        
        // if (DEBUG) console.log(`ServicesCardManager: Initialized with ${this.containers.length} containers`);
    }

    findTargetElements() {
        // Find the wrapper with background image (around line 636)
        this.imageWrapperSelector = document.querySelector('#ImageSlider');
        // for (let wrapper of imageWrappers) {
        //     if (wrapper.style.background && wrapper.style.background.includes('Card')) {
        //         this.imageWrapperSelector = wrapper;
        //         break;
        //     }
        // }

        // Find the content wrapper that needs data-card update (the "blue" wrapper on line 642)
        this.contentWrapperSelector = document.querySelector('#TextSlider');

        // if (DEBUG) {
        //     console.log('ServicesCardManager: Found image wrapper:', this.imageWrapperSelector);
        //     console.log('ServicesCardManager: Found content wrapper:', this.contentWrapperSelector);
        // }
    }

    addClickListeners() {
        this.containers.forEach((container, index) => {
            container.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const cardNumber = container.dataset.card;
                if (!cardNumber) {
                    console.warn('ServicesCardManager: Container missing data-card attribute');
                    return;
                }
                
                this.handleCardClick(container, cardNumber);
            });
            
            // Log container info for debugging
            // if (DEBUG) {
            //     console.log(`ServicesCardManager: Added listener to container ${index + 1}, card: ${container.dataset.card}`);
            // }
        });
    }

    handleCardClick(clickedContainer, cardNumber) {
        // if (DEBUG) console.log(`ServicesCardManager: Card ${cardNumber} clicked`);
        
        // Remove data-active from all containers in the selector path
        this.containers.forEach(container => {
            container.removeAttribute('data-active');
        });
        
        // Set data-active="true" on clicked container
        clickedContainer.setAttribute('data-active', 'true');
        
        // Update background image URL
        this.updateBackgroundImage(cardNumber);
        
        // Update content wrapper position
        this.updateContentPosition(cardNumber);
    }

    updateBackgroundImage(cardNumber) {
        if (!this.imageWrapperSelector) {
            console.warn('ServicesCardManager: Image wrapper not found');
            return;
        }
        
        // // Get current background style
        // const currentStyle = this.imageWrapperSelector.style.background;
        
        // // Replace the card number in the URL
        // const newStyle = currentStyle.replace(/Card\d+\.png/, `Card${cardNumber}.png`);
        
        // // Apply new background
        // this.imageWrapperSelector.style.background = newStyle;

        // Calculate translateX based on card number
        const cardIndex = parseInt(cardNumber) - 1;
        const translateX = cardIndex * -100; // Move left by 100% for each card
        
        // Apply transform
        this.imageWrapperSelector.style.transform = `translateX(${translateX}%)`;
        // if (DEBUG) console.log(`ServicesCardManager: Updated background from "${currentStyle}" to "${newStyle}"`);
    }

    updateContentPosition(cardNumber) {
        if (!this.contentWrapperSelector) {
            console.warn('ServicesCardManager: Content wrapper not found');
            return;
        }
        
        // Calculate translateX based on card number
        const cardIndex = parseInt(cardNumber) - 1;
        const translateX = cardIndex * -100; // Move left by 100% for each card
        
        // Apply transform
        this.contentWrapperSelector.style.transform = `translateX(${translateX}%)`;
        // if (DEBUG) console.log(`ServicesCardManager: Applied translateX(${translateX}%) to content wrapper for card ${cardNumber}`);
    }

    destroy() {
        // Remove all event listeners
        this.containers.forEach(container => {
            container.replaceWith(container.cloneNode(true));
        });
        
        this.containers = [];
        this.imageWrapperSelector = null;
        this.contentWrapperSelector = null;
    }
}

class ContactUsHandler {
    constructor() {
        this.buttonSelector = '.contactUs';
        this.targetCheckpoint = '8';
        this.buttons = [];
        this.init();
    }

    init() {
        // if (DEBUG) console.log('ContactUsHandler: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find all .contactUs buttons
        this.buttons = Array.from(document.querySelectorAll(this.buttonSelector));
        
        if (this.buttons.length === 0) {
            console.warn('ContactUsHandler: No .contactUs buttons found');
            return;
        }

        // Add click listeners
        this.addClickListeners();
        
        // if (DEBUG) console.log(`ContactUsHandler: Initialized with ${this.buttons.length} .contactUs buttons`, this.buttons);
    }

    addClickListeners() {
        this.buttons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                this.handleContactUsClick();
            });
            
            // if (DEBUG) console.log(`ContactUsHandler: Added listener to button ${index + 1}`);
        });
    }

    handleContactUsClick() {
        // if (DEBUG) console.log(`ContactUsHandler: Contact Us button clicked, scrolling to checkpoint "${this.targetCheckpoint}"`);
        
        // Check if ScrollSnap instance exists
        if (!window.scrollSnapInstance) {
            console.error('ContactUsHandler: ScrollSnap instance not found. Cannot scroll to checkpoint.');
            return;
        }

        // Use the scrollToCheckpoint method to navigate to checkpoint "8"
        window.scrollSnapInstance.scrollToCheckpoint(this.targetCheckpoint);
    }

    destroy() {
        // Remove all event listeners
        this.buttons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        this.buttons = [];
    }
}

class AnchorNavigationHandler {
    constructor() {
        this.anchors = [];
        this.init();
    }

    init() {
        // if (DEBUG) console.log('AnchorNavigationHandler: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find all anchor elements with href attributes
        this.anchors = Array.from(document.querySelectorAll('a[href]'));
        
        if (this.anchors.length === 0) {
            console.warn('AnchorNavigationHandler: No anchor elements with href found');
            return;
        }

        // Add click listeners
        this.addClickListeners();
        
        // if (DEBUG) console.log(`AnchorNavigationHandler: Initialized with ${this.anchors.length} anchor elements`);
    }

    addClickListeners() {
        this.anchors.forEach((anchor, index) => {
            anchor.addEventListener('click', (e) => {
                this.handleAnchorClick(e, anchor);
            });
            
            // if (DEBUG) console.log(`AnchorNavigationHandler: Added listener to anchor ${index + 1}, href: ${anchor.href}`);
        });
    }

    handleAnchorClick(event, anchor) {
        // Check if anchor has data-active="true" - if so, allow default behavior
        if (anchor.getAttribute('data-active') === 'true') {
            // if (DEBUG) console.log('AnchorNavigationHandler: Anchor has data-active="true", allowing default behavior');
            return; // Don't prevent default, let it work normally
        }

        const href = anchor.getAttribute('href');
        
        // Skip if no href
        if (!href) {
            // if (DEBUG) console.log('AnchorNavigationHandler: No href attribute, allowing default behavior');
            return;
        }

        // Allow external links (starting with http/https) to work normally
        if (href.startsWith('http://') || href.startsWith('https://')) {
            // if (DEBUG) console.log('AnchorNavigationHandler: External link, allowing default behavior');
            return;
        }

        // Prevent default anchor behavior for internal navigation
        event.preventDefault();
        event.stopPropagation();

        // Use href value directly as checkpoint value
        const checkpointValue = href;
        
        // if (DEBUG) console.log(`AnchorNavigationHandler: Handling click for href "${href}", checkpoint: "${checkpointValue}"`);
        
        // Check if ScrollSnap instance exists
        if (!window.scrollSnapInstance) {
            console.error('AnchorNavigationHandler: ScrollSnap instance not found. Cannot navigate to section.');
            return;
        }

        // Navigate using ScrollSnap with the href value as checkpoint
        this.navigateToCheckpoint(checkpointValue);
    }

    navigateToCheckpoint(checkpointValue) {
        const scrollSnap = window.scrollSnapInstance;
        
        // if (DEBUG) console.log(`AnchorNavigationHandler: Navigating to checkpoint "${checkpointValue}"`);
        
        // Use ScrollSnap's scrollToCheckpoint method directly with the href value
        scrollSnap.scrollToCheckpoint(checkpointValue);
    }

    destroy() {
        // Remove all event listeners by replacing elements with clones
        this.anchors.forEach(anchor => {
            const newAnchor = anchor.cloneNode(true);
            anchor.parentNode.replaceChild(newAnchor, anchor);
        });
        
        this.anchors = [];
    }
}

// Email.js Configuration Constants
const EMAIL_CONFIG = {
    SERVICE_ID: 'service_6hh5ajg', // Replace with your EmailJS service ID
    TEMPLATE_ID: 'template_vv1irpd',     // Replace with your EmailJS template ID
    USER_ID: 'FtRIitNZVFWJKmm6_'          // Replace with your EmailJS public key
};

class ContactFormHandler {
    constructor() {
        this.form = null;
        this.submitButton = null;
        this.isSubmitting = false;
        this.email = 'saarthak.batra@gmail.com'
        this.init();
    }

    init() {
        if (DEBUG) console.log('> ContactFormHandler: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find the contact form
        this.form = document.getElementById('contactForm');
        
        if (!this.form) {
            console.error('ContactFormHandler: Contact form not found');
            return;
        }

        // Find the submit button
        this.submitButton = this.form.querySelector('button[type="submit"], button:not([type])');
        
        if (!this.submitButton) {
            console.error('ContactFormHandler: Submit button not found');
            return;
        }

        // Initialize Email.js
        this.initializeEmailJS();
        
        // Add form submit listener
        this.addFormListener();
        
        if (DEBUG) console.log('✓ ContactFormHandler: Initialized successfully');
    }

    initializeEmailJS() {
        // Wait for Email.js library to be available
        const initEmailJS = () => {
            if (typeof emailjs !== 'undefined') {
                try {
                    // Use the newer initialization method
                    emailjs.init({
                        publicKey: EMAIL_CONFIG.USER_ID
                    });
                    if (DEBUG) console.log('✓ Email.js initialized with public key:', EMAIL_CONFIG.USER_ID);
                    return true;
                } catch (error) {
                    console.error('Email.js initialization failed:', error);
                    // Try the older initialization method as fallback
                    try {
                        emailjs.init(EMAIL_CONFIG.USER_ID);
                        if (DEBUG) console.log('✓ Email.js initialized with legacy method');
                        return true;
                    } catch (legacyError) {
                        console.error('Legacy Email.js initialization also failed:', legacyError);
                        return false;
                    }
                }
            } else {
                if (DEBUG) console.log('Email.js library not yet available, retrying...');
                return false;
            }
        };
        
        // Try to initialize immediately
        if (!initEmailJS()) {
            // If it fails, retry with delays
            let retryCount = 0;
            const maxRetries = 10;
            const retryInterval = setInterval(() => {
                retryCount++;
                if (initEmailJS() || retryCount >= maxRetries) {
                    clearInterval(retryInterval);
                    if (retryCount >= maxRetries) {
                        console.error('Email.js initialization failed after maximum retries');
                    }
                }
            }, 200);
        }
    }

    addFormListener() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleFormSubmit();
        });
    }

    handleFormSubmit() {
        if (this.isSubmitting) {
            if (DEBUG) console.log('Form submission already in progress');
            return;
        }

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        // Set submitting state
        this.isSubmitting = true;
        this.updateSubmitButton(true);

        // Collect form data
        const formData = this.collectFormData();
        
        // Send email
        this.sendEmail(formData);
    }

    validateForm() {
        const requiredFields = ['Name', 'Email', 'ContactNumber'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field || !field.value.trim()) {
                this.highlightField(field, true);
                isValid = false;
            } else {
                this.highlightField(field, false);
            }
        });

        // Validate email format
        const emailField = this.form.querySelector('[name="Email"]');
        if (emailField && emailField.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value.trim())) {
                this.highlightField(emailField, true);
                isValid = false;
            }
        }

        if (!isValid) {
            this.showPopup('Please fill in all required fields correctly.', 'error');
        }

        return isValid;
    }

    highlightField(field, hasError) {
        if (!field) return;
        
        if (hasError) {
            field.style.borderColor = '#ff4444';
            field.style.backgroundColor = '#fff5f5';
        } else {
            field.style.borderColor = '';
            field.style.backgroundColor = '';
        }
    }

    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        if (DEBUG) console.log('Form data collected:', data);
        return data;
    }

    sendEmail(formData) {
        // Template parameters for Email.js
        const templateParams = {
            from_name: formData.Name,
            from_email: formData.Email,
            contact_number: formData.ContactNumber,
            message: formData.Message || 'No message provided',
            to_email: this.email, // Replace with your email
            request_time: new Date().toLocaleString(),
            subject: 'New Contact Request from ' + formData.Name
        };

        emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID,
            templateParams
        ).then(
            (response) => {
                if (DEBUG) console.log('Email sent successfully:', response);
                this.onEmailSuccess();
            },
            (error) => {
                console.error('Email send failed:', error);
                this.onEmailError(error);
            }
        ).finally(() => {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        });
    }

    onEmailSuccess() {
        this.showPopup('Successfully submitted! We will contact you soon.', 'success');
        this.form.reset();
        
        // Clear any field highlighting
        const fields = this.form.querySelectorAll('input, textarea');
        fields.forEach(field => this.highlightField(field, false));
    }

    onEmailError(error) {
        this.showPopup('Submission failed. Please refresh the page and try again.', 'error');
    }

    updateSubmitButton(isSubmitting) {
        if (!this.submitButton) return;
        
        if (isSubmitting) {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Submitting...';
            this.submitButton.style.opacity = '0.7';
            this.submitButton.style.cursor = 'not-allowed';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Submit';
            this.submitButton.style.opacity = '1';
            this.submitButton.style.cursor = 'pointer';
        }
    }

    showPopup(message, type = 'info') {
        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'contact-form-popup';
        popup.textContent = message;
        
        // Style the popup
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 500;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 90%;
            animation: popupFadeIn 0.3s ease-out;
        `;

        // Add CSS animation
        if (!document.querySelector('#popup-styles')) {
            const style = document.createElement('style');
            style.id = 'popup-styles';
            style.textContent = `
                @keyframes popupFadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes popupFadeOut {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to DOM
        document.body.appendChild(popup);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            popup.style.animation = 'popupFadeOut 0.3s ease-out';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 300);
        }, 4000);

        // Click to dismiss
        popup.addEventListener('click', () => {
            popup.style.animation = 'popupFadeOut 0.3s ease-out';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 300);
        });
    }

    destroy() {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleFormSubmit);
        }
        this.form = null;
        this.submitButton = null;
        this.isSubmitting = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Order matters for dependencies
        
        // 0. MobileDetector (utility class)
        if (typeof window.MobileDetector === 'undefined') {
            window.MobileDetector = MobileDetector;
            if (DEBUG) console.log('✓ MobileDetector initialized');
        }
        
        // 1. LoadingManager (builds checkpoints needed by ScrollSnap)
        if (typeof window.LoadingManager === 'undefined') {
            window.LoadingManager = LoadingManager;
            window.loadingManagerInstance = new LoadingManager();
            if (DEBUG) console.log('✓ LoadingManager initialized');
        }
        
        // 2. ScrollSnap
        if (typeof window.ScrollSnap === 'undefined') {
            window.ScrollSnap = ScrollSnap;
            window.scrollSnapInstance = new ScrollSnap();
            if (DEBUG) console.log('✓ ScrollSnap initialized');
        }
        
        // 3. Independent utility classes
        if (typeof window.AspectRatioUpdater === 'undefined') {
            window.AspectRatioUpdater = AspectRatioUpdater;
            window.aspectRatioUpdaterInstance = new AspectRatioUpdater();
            if (DEBUG) console.log('✓ AspectRatioUpdater initialized');
        }
        
        if (typeof window.ViewportDetector === 'undefined') {
            window.ViewportDetector = ViewportDetector;
            window.viewportDetectorInstance = new ViewportDetector();
            if (DEBUG) console.log('✓ ViewportDetector initialized');
        }
        
        if (typeof window.CounterAnimation === 'undefined') {
            window.CounterAnimation = CounterAnimation;
            window.counterAnimationInstance = new CounterAnimation();
            if (DEBUG) console.log('✓ CounterAnimation initialized');
        }
        
        if (typeof window.ServicesCardManager === 'undefined') {
            window.ServicesCardManager = ServicesCardManager;
            window.servicesCardManagerInstance = new ServicesCardManager();
            if (DEBUG) console.log('✓ ServicesCardManager initialized');
        }
        
        // 4. Classes that depend on ScrollSnap instance
        if (typeof window.ContactUsHandler === 'undefined') {
            window.ContactUsHandler = ContactUsHandler;
            window.contactUsHandlerInstance = new ContactUsHandler();
            if (DEBUG) console.log('✓ ContactUsHandler initialized');
        }
        
        if (typeof window.AnchorNavigationHandler === 'undefined') {
            window.AnchorNavigationHandler = AnchorNavigationHandler;
            window.anchorNavigationHandlerInstance = new AnchorNavigationHandler();
            if (DEBUG) console.log('✓ AnchorNavigationHandler initialized');
        }
        
        // 5. ContactFormHandler (handles form submission and email sending)
        // Delay initialization to ensure Email.js library is loaded
        setTimeout(() => {
            if (typeof window.ContactFormHandler === 'undefined') {
                window.ContactFormHandler = ContactFormHandler;
                window.contactFormHandlerInstance = new ContactFormHandler();
                if (DEBUG) console.log('✓ ContactFormHandler initialized');
            }
        }, 500); // Wait 500ms for Email.js to load
        
        // 8. ForceDesktopMode - Initialize first to override mobile behaviors
        if (typeof window.ForceDesktopMode === 'undefined') {
            window.ForceDesktopMode = ForceDesktopMode;
            window.forceDesktopModeInstance = new ForceDesktopMode();
            if (DEBUG) console.log('✓ ForceDesktopMode initialized');
        }
        
        if (DEBUG) console.log('🎉 All classes initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error during class initialization:', error);
    }
});

