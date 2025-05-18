/**
 * Gandi-Hub Blockchain Wallet System
 * Manages GHUB token transactions, balances, and blockchain interactions
 * Supports both the profile page wallet tab and the dedicated wallet page
 * @author Musa Mgandi
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // Make sure Firebase is initialized before proceeding
    if (!firebase || !firebase.apps || !firebase.apps.length) {
        console.error('Firebase is not initialized!');
        showToast('error', 'Firebase is not initialized properly. Please refresh the page.');
        return;
    }
    
    // Initialize Firebase Auth and Firestore
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Determine if we're on the wallet page or profile page
    const isWalletPage = window.location.pathname.includes('wallet.html');
    
    // DOM Elements - Common
    const tokenBalance = document.getElementById('token-balance');
    const academicTokens = document.getElementById('academic-tokens');
    const sportsTokens = document.getElementById('sports-tokens');
    const communityTokens = document.getElementById('community-tokens');
    const transactionList = document.getElementById('transaction-list');
    const refreshWalletBtn = document.getElementById('refresh-wallet');
    const shareWalletBtn = document.getElementById('share-wallet');
    
    // DOM Elements - Profile Page
    const walletBtn = document.getElementById('wallet-btn');
    const walletModal = document.getElementById('wallet-modal');
    
    // Tab Elements
    const rewardsTokenBalance = document.getElementById('rewards-token-balance');
    const tabAcademicTokens = document.getElementById('tab-academic-tokens');
    const tabSportsTokens = document.getElementById('tab-sports-tokens');
    const tabCommunityTokens = document.getElementById('tab-community-tokens');
    
    // Token Data
    let userData = {
        totalTokens: 0,
        academicTokens: 0,
        sportsTokens: 0,
        communityTokens: 0,
        transactions: []
    };
    
    // Chart instances
    let tokenHistoryChart;
    let rewardsChart;
    
    // Event Listeners
    if (walletBtn) {
        walletBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to wallet page instead of opening modal
            window.location.href = 'wallet.html';
        });
    }
    
    if (refreshWalletBtn) {
        refreshWalletBtn.addEventListener('click', function() {
            refreshWalletData();
        });
    }
    
    if (shareWalletBtn) {
        shareWalletBtn.addEventListener('click', function() {
            shareWallet();
        });
    }
    
    // Initialize wallet data when user is authenticated
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User is signed in:', user.uid);
            initializeWalletData(user.uid);
            
            // If on wallet page, initialize additional features
            if (isWalletPage) {
                initializeWalletPageFeatures(user.uid);
            }
        } else {
            // Redirect to login if not authenticated
            window.location.href = isWalletPage ? '../index.html' : 'login.html';
        }
    });
    
    /**
     * Initialize additional features specific to the wallet page
     * @param {string} userId - User ID
     */
    function initializeWalletPageFeatures(userId) {
        // Initialize transaction filters
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to clicked button
                    this.classList.add('active');
                    
                    // Get filter value
                    const filter = this.getAttribute('data-filter');
                    
                    // Filter transactions
                    filterTransactions(filter);
                });
            });
        }
        
        // Initialize blockchain animation
        animateBlockchain();
    }
    
    /**
     * Animate blockchain visualization
     */
    function animateBlockchain() {
        const blocks = document.querySelectorAll('.block');
        if (blocks.length === 0) return;
        
        // Add random pulse animations to blocks
        blocks.forEach((block, index) => {
            const delay = index * 0.5;
            block.style.animationDelay = `${delay}s`;
        });
    }
    
    /**
     * Filter transactions by type
     * @param {string} filter - Filter type (all, earned, spent)
     */
    function filterTransactions(filter) {
        const transactions = document.querySelectorAll('.transaction-item');
        if (transactions.length === 0) return;
        
        transactions.forEach(transaction => {
            if (filter === 'all') {
                transaction.style.display = 'flex';
            } else {
                if (transaction.classList.contains(filter)) {
                    transaction.style.display = 'flex';
                } else {
                    transaction.style.display = 'none';
                }
            }
        });
    }
    
    /**
     * Initialize wallet data from Firestore or create if not exists
     * @param {string} userId - User ID
     */
    async function initializeWalletData(userId) {
        try {
            // Check if wallet data exists
            const walletDoc = await db.collection('wallets').doc(userId).get();
            
            if (walletDoc.exists) {
                // Wallet exists, load data
                userData = walletDoc.data();
                updateWalletUI();
            } else {
                // Create new wallet for user with just the welcome bonus
                const currentDate = new Date();
                const welcomeTransaction = {
                    id: generateUniqueId(),
                    type: 'earned',
                    amount: 50,
                    category: 'welcome',
                    description: 'Welcome Bonus',
                    timestamp: currentDate.getTime(),
                    creationDate: currentDate.toISOString() // Store the exact creation date
                };
                
                // For new users, only include the welcome transaction
                const transactions = [welcomeTransaction];
                
                // Set initial token values - only the welcome bonus of 50
                const academic = 0;
                const sports = 0;
                const community = 0;
                const welcomeBonus = 50; // Welcome bonus goes into total but not categories
                
                userData = {
                    totalTokens: welcomeBonus, // Total is just the welcome bonus of 50
                    academicTokens: academic,
                    sportsTokens: sports,
                    communityTokens: community,
                    transactions: transactions, // Use the transactions array with just the welcome transaction
                    createdAt: currentDate.toISOString(), // Store account creation date
                    lastUpdated: currentDate.getTime()
                };
                
                // Save to Firestore
                await db.collection('wallets').doc(userId).set(userData);
                updateWalletUI();
                showToast('Welcome to GHUB Wallet! You received 50 tokens as a welcome bonus.', 'success');
            }
            
            // Initialize charts based on page
            initializeCharts(isWalletPage);
            
        } catch (error) {
            console.error('Error initializing wallet:', error);
            showToast('Error loading wallet data. Please try again.', 'error');
        }
    }
    
    /**
     * Update wallet UI with current data
     */
    function updateWalletUI() {
        // Update modal values
        if (tokenBalance) tokenBalance.textContent = userData.totalTokens;
        if (academicTokens) academicTokens.textContent = userData.academicTokens;
        if (sportsTokens) sportsTokens.textContent = userData.sportsTokens;
        if (communityTokens) communityTokens.textContent = userData.communityTokens;
        
        // Update tab values
        if (rewardsTokenBalance) rewardsTokenBalance.textContent = userData.totalTokens;
        if (tabAcademicTokens) tabAcademicTokens.textContent = userData.academicTokens;
        if (tabSportsTokens) tabSportsTokens.textContent = userData.sportsTokens;
        if (tabCommunityTokens) tabCommunityTokens.textContent = userData.communityTokens;
        
        // Update transaction list
        updateTransactionList();
    }
    
    /**
     * Initialize charts for token visualization
     * @param {boolean} isWalletPage - Whether we're on the wallet page or profile page
     */
    function initializeCharts(isWalletPage) {
        // Token distribution chart (wallet page)
        const distributionCtx = document.getElementById('token-distribution-chart');
        if (distributionCtx && isWalletPage) {
            const distributionChart = new Chart(distributionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Academic', 'Sports', 'Community'],
                    datasets: [{
                        data: [
                            userData.academicTokens,
                            userData.sportsTokens,
                            userData.communityTokens
                        ],
                        backgroundColor: [
                            '#3498db',
                            '#e74c3c',
                            '#9b59b6'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 14
                                },
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} GHUB (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '70%',
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        }
        
        // Token history chart (last 6 months)
        const historyCtx = document.getElementById('token-history-chart');
        if (historyCtx) {
            // Generate mock data for demonstration
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const mockData = [15, 25, 40, 30, 45, userData.totalTokens];
            
            if (tokenHistoryChart) {
                tokenHistoryChart.destroy();
            }
            
            // Set up chart labels and data
            let chartLabels, chartData;
            
            // Check if this is a new user with only the welcome tokens (50 tokens)
            const isNewUser = userData.totalTokens <= 50;
            
            // For new users, create a chart showing only the welcome reward
            if (isNewUser) {
                // Get the creation date or use today's date if not available
                const creationDate = userData.createdAt ? new Date(userData.createdAt) : new Date();
                
                // Format date as 'DD MMM' (e.g., '18 May')
                const day = creationDate.getDate();
                const month = creationDate.toLocaleString('default', { month: 'short' });
                
                // Show only a single data point for the welcome reward
                chartLabels = [`${day} ${month}`];
                chartData = [50]; // Just the welcome reward of 50 tokens
            } else if (isWalletPage) {
                // For regular users on wallet page
                chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                chartData = [5, 10, 15, 25, 30, 35, 40, 45, 50, 60, 70, userData.totalTokens];
            } else {
                // For regular users on profile page
                chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                chartData = [15, 25, 40, 30, 45, userData.totalTokens];
            }
            
            tokenHistoryChart = new Chart(historyCtx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'GHUB Tokens',
                        data: chartData,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw} GHUB`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    elements: {
                        point: {
                            radius: 4,
                            hoverRadius: 6
                        }
                    }
                }
            });
        }
        
        // Rewards breakdown chart (profile page)
        const rewardsCtx = document.getElementById('rewards-chart');
        if (rewardsCtx && !isWalletPage) {
            if (rewardsChart) {
                rewardsChart.destroy();
            }
            
            rewardsChart = new Chart(rewardsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Academic', 'Sports', 'Community'],
                    datasets: [{
                        data: [
                            userData.academicTokens,
                            userData.sportsTokens,
                            userData.communityTokens
                        ],
                        backgroundColor: [
                            '#3498db',
                            '#e74c3c',
                            '#9b59b6'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    }
    
    /**
     * Update transaction list in the wallet modal or page
     */
    function updateTransactionList() {
        if (!transactionList) return;
        
        // Clear existing transactions
        transactionList.innerHTML = '';
        
        // Sort transactions by timestamp (newest first)
        const sortedTransactions = [...userData.transactions].sort((a, b) => b.timestamp - a.timestamp);
        
        // Display up to 10 most recent transactions on wallet page, 5 on profile page
        const limit = isWalletPage ? 10 : 5;
        const recentTransactions = sortedTransactions.slice(0, limit);
        
        if (recentTransactions.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-transactions';
            emptyMessage.textContent = 'No transactions yet';
            transactionList.appendChild(emptyMessage);
            return;
        }
        
        // Create transaction elements
        recentTransactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = `transaction-item ${transaction.type}`;
            
            const iconClass = transaction.type === 'earned' ? 'earned' : 'spent';
            const iconName = transaction.type === 'earned' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle';
            const amountPrefix = transaction.type === 'earned' ? '+' : '-';
            
            // Add category icon based on transaction category
            let categoryIcon = 'bi-coin';
            if (transaction.category === 'academic') categoryIcon = 'bi-book';
            if (transaction.category === 'sports') categoryIcon = 'bi-trophy';
            if (transaction.category === 'community') categoryIcon = 'bi-people';
            if (transaction.category === 'welcome') categoryIcon = 'bi-gift';
            
            transactionItem.innerHTML = `
                <div class="transaction-icon ${iconClass}">
                    <i class="bi ${categoryIcon}"></i>
                </div>
                <div class="transaction-details">
                    <h5 class="transaction-title">${transaction.description}</h5>
                    <p class="transaction-date">${formatDate(transaction.timestamp)}</p>
                </div>
                <span class="transaction-amount ${iconClass}">${amountPrefix}${transaction.amount} GHUB</span>
            `;
            
            transactionList.appendChild(transactionItem);
        });
    }
    

    
    /**
     * Open wallet modal and refresh data
     */
    function openWalletModal() {
        if (!walletModal) return;
        
        walletModal.classList.add('active');
        refreshWalletData();
    }
    
    /**
     * Generate mock transaction data for demonstration
     * @param {number} count - Number of transactions to generate
     * @returns {Array} Array of transaction objects
     */
    function generateMockTransactions(count) {
        const transactions = [];
        const categories = ['academic', 'sports', 'community'];
        const types = ['earned', 'spent'];
        const descriptions = {
            academic: {
                earned: ['Completed Assignment', 'Study Session', 'Academic Achievement', 'Course Completion', 'High Grade'],
                spent: ['Study Materials', 'Tutoring Session', 'Academic Resources']
            },
            sports: {
                earned: ['Training Completion', 'Performance Milestone', 'Team Contribution', 'Competition Award'],
                spent: ['Equipment Purchase', 'Training Session', 'Event Registration']
            },
            community: {
                earned: ['Forum Participation', 'Helping Others', 'Event Organization', 'Community Challenge'],
                spent: ['Community Event', 'Resource Sharing', 'Support Donation']
            }
        };
        
        // Current time
        const now = Date.now();
        
        // Generate transactions
        for (let i = 0; i < count; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const descArray = descriptions[category][type];
            const description = descArray[Math.floor(Math.random() * descArray.length)];
            const amount = type === 'earned' ? 
                Math.floor(Math.random() * 16) + 5 : // 5-20 for earned
                Math.floor(Math.random() * 11) + 5;  // 5-15 for spent
            
            // Random timestamp within the last 90 days
            const timestamp = now - (Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
            
            transactions.push({
                id: generateUniqueId(),
                type,
                amount,
                category,
                description,
                timestamp
            });
        }
        
        // Sort by timestamp (newest first)
        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * Refresh wallet data from Firestore
     */
    async function refreshWalletData() {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            // Show loading state
            if (refreshWalletBtn) {
                refreshWalletBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refreshing...';
                refreshWalletBtn.disabled = true;
            }
            
            // Get latest data from Firestore
            const walletDoc = await db.collection('wallets').doc(user.uid).get();
            
            if (walletDoc.exists) {
                userData = walletDoc.data();
                updateWalletUI();
                initializeCharts(isWalletPage);
            }
            
            // Show loading overlay on wallet page for better UX
            if (isWalletPage) {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) loadingOverlay.classList.add('active');
                
                // Simulate blockchain verification with a more realistic delay
                setTimeout(() => {
                    if (loadingOverlay) loadingOverlay.classList.remove('active');
                    if (refreshWalletBtn) {
                        refreshWalletBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
                        refreshWalletBtn.disabled = false;
                    }
                    showToast('Wallet data verified on Avalanche blockchain', 'success');
                }, 2000);
            } else {
                // Shorter delay for profile page modal
                setTimeout(() => {
                    if (refreshWalletBtn) {
                        refreshWalletBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
                        refreshWalletBtn.disabled = false;
                    }
                    showToast('Wallet data verified on blockchain', 'success');
                }, 1500);
            }
            
        } catch (error) {
            console.error('Error refreshing wallet:', error);
            showToast('Error refreshing wallet data', 'error');
            
            if (refreshWalletBtn) {
                refreshWalletBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
                refreshWalletBtn.disabled = false;
            }
            
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }
    
    /**
     * Share wallet information
     */
    function shareWallet() {
        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: 'My GHUB Token Wallet',
                text: `Check out my GHUB Token balance: ${userData.totalTokens} GHUB tokens on Gandi-Hub!`,
                url: window.location.href
            })
            .then(() => console.log('Shared successfully'))
            .catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            const shareText = `Check out my GHUB Token balance: ${userData.totalTokens} GHUB tokens on Gandi-Hub!`;
            
            // Create a temporary input element
            const tempInput = document.createElement('input');
            tempInput.value = shareText;
            document.body.appendChild(tempInput);
            
            // Select and copy the text
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showToast('Wallet info copied to clipboard!', 'success');
        }
    }
    
    /**
     * Generate a unique ID for transactions
     * @returns {string} Unique ID
     */
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Format date for transaction display
     * @param {number} timestamp - Timestamp in milliseconds
     * @returns {string} Formatted date string
     */
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, info)
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => container.removeChild(toast), 500);
            }, 3000);
        }
    }
});
