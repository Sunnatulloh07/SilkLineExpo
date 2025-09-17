/**
 * Product Comments System
 * Professional B2B product comments and reviews functionality
 */

class ProductCommentsManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.currentPage = 1;
        this.commentsPerPage = 10;
        this.isLoading = false;
        this.totalComments = 0;
        
        this.init();
    }
    
    init() {
        if (!this.productId) {
            console.warn('Product ID not found in URL');
            this.hideCommentsSection();
            return;
        }
        
        this.setupEventListeners();
        this.loadComments();
        this.setupFormValidation();
        this.checkAuthenticationStatus();
    }
    
    getProductIdFromUrl() {
        // Extract product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id') || urlParams.get('productId');
        
        // Also try to get from window global variable if set by EJS
        if (!productId && window.productId) {
            return window.productId;
        }
        
        return productId;
    }
    
    hideCommentsSection() {
        const commentsWrapper = document.querySelector('.comments-wrapper');
        if (commentsWrapper) {
            commentsWrapper.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        // Comment form submission
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }
        
        // Character counter
        const commentContent = document.getElementById('comment-content');
        if (commentContent) {
            commentContent.addEventListener('input', () => this.updateCharacterCount());
        }
        
        // Rating stars
        const ratingInputs = document.querySelectorAll('#rating-input input[type="radio"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => this.updateStarDisplay());
        });
        
        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }
    }
    
    setupFormValidation() {
        const form = document.getElementById('comment-form');
        const content = document.getElementById('comment-content');
        const submitBtn = document.getElementById('submit-comment');
        
        if (!form || !content || !submitBtn) return;
        
        const validateForm = () => {
            const isValid = content.value.trim().length >= 3;
            submitBtn.disabled = !isValid;
            submitBtn.classList.toggle('btn-secondary', !isValid);
            submitBtn.classList.toggle('btn-primary', isValid);
        };
        
        content.addEventListener('input', validateForm);
        validateForm(); // Initial validation
    }
    
    updateCharacterCount() {
        const content = document.getElementById('comment-content');
        const charCount = document.getElementById('char-count');
        
        if (content && charCount) {
            const currentLength = content.value.length;
            charCount.textContent = currentLength;
            
            // Update color based on character count
            charCount.className = '';
            if (currentLength > 900) {
                charCount.classList.add('text-danger');
            } else if (currentLength > 700) {
                charCount.classList.add('text-warning');
            } else {
                charCount.classList.add('text-muted');
            }
        }
    }
    
    updateStarDisplay() {
        const checkedInput = document.querySelector('#rating-input input[type="radio"]:checked');
        const stars = document.querySelectorAll('#rating-input label i');
        
        if (!checkedInput || !stars.length) return;
        
        const rating = parseInt(checkedInput.value);
        
        stars.forEach((star, index) => {
            star.className = index < rating ? 'fas fa-star' : 'far fa-star';
        });
    }
    
    async loadComments() {
        if (this.isLoading) return;
        
        // Validate productId exists and is not an orderId
        if (!this.productId || this.productId.length !== 24) {
            // console.error('Invalid or missing productId for product comments');
            this.showError("Mahsulot ID'si noto'g'ri");
            return;
        }
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const response = await fetch(`/api/products/${this.productId}/comments?page=${this.currentPage}&limit=${this.commentsPerPage}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.success) {
                this.displayComments(result.data.comments);
                this.updateCommentsHeader(result.data.statistics, result.data.pagination);
                this.updateLoadMoreButton(result.data.pagination);
            } else {
                this.showError('Izohlarni yuklashda xatolik yuz berdi');
            }
        } catch (error) {
            // console.error('Error loading comments:', error);
            this.showError('Izohlarni yuklashda xatolik yuz berdi');
            
            // Show empty state instead of loading
            const commentsList = document.getElementById('comments-list');
            const noComments = document.getElementById('no-comments');
            if (commentsList && noComments) {
                commentsList.innerHTML = '';
                noComments.classList.remove('d-none');
                const noCommentsText = noComments.querySelector('h5');
                if (noCommentsText) {
                    noCommentsText.textContent = 'Izohlarni yuklashda xatolik';
                }
            }
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async loadMoreComments() {
        if (this.isLoading) return;
        
        this.currentPage++;
        await this.loadComments();
    }
    
    displayComments(comments) {
        const commentsList = document.getElementById('comments-list');
        const noComments = document.getElementById('no-comments');
        
        if (!commentsList) return;
        
        if (comments.length === 0 && this.currentPage === 1) {
            commentsList.innerHTML = '';
            noComments.classList.remove('d-none');
            return;
        }
        
        noComments.classList.add('d-none');
        
        if (this.currentPage === 1) {
            commentsList.innerHTML = '';
        }
        
        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    }
    
    createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item border rounded p-3 mb-3';
        commentDiv.dataset.commentId = comment._id;
        
        const ratingStars = comment.rating ? this.generateStars(comment.rating) : '';
        const typeIcon = this.getTypeIcon(comment.type);
        const authorName = comment.author?.companyName || comment.author?.name || 'Anonim';
        const formattedDate = new Date(comment.createdAt).toLocaleDateString('uz-UZ');
        
        commentDiv.innerHTML = `
            <div class="comment-header d-flex justify-content-between align-items-start mb-2">
                <div class="comment-author-info">
                    <div class="d-flex align-items-center mb-1">
                        <strong class="author-name">${authorName}</strong>
                        <span class="comment-type badge bg-light text-dark ms-2">
                            ${typeIcon} ${this.getTypeLabel(comment.type)}
                        </span>
                        ${comment.status === 'pending' ? '<span class="badge bg-warning ms-2">Moderatsiyada</span>' : ''}
                    </div>
                    <div class="comment-meta">
                        ${ratingStars}
                        <small class="text-muted ms-2">${formattedDate}</small>
                    </div>
                </div>
                <div class="comment-actions">
                    ${this.createCommentActions(comment)}
                </div>
            </div>
            
            <div class="comment-content">
                <p class="mb-2">${this.escapeHtml(comment.content)}</p>
            </div>
            
            <div class="comment-footer d-flex justify-content-between align-items-center">
                <div class="comment-votes">
                    <button class="btn btn-sm btn-outline-success vote-btn" data-action="helpful" data-comment-id="${comment._id}">
                        <i class="fas fa-thumbs-up"></i>
                        Foydali (${comment.helpfulVotes?.helpful?.length || 0})
                    </button>
                    <button class="btn btn-sm btn-outline-danger vote-btn ms-2" data-action="not-helpful" data-comment-id="${comment._id}">
                        <i class="fas fa-thumbs-down"></i>
                        Foydali emas (${comment.helpfulVotes?.notHelpful?.length || 0})
                    </button>
                </div>
                <div class="comment-reply">
                    <button class="btn btn-sm btn-outline-primary reply-btn" data-comment-id="${comment._id}">
                        <i class="fas fa-reply"></i>
                        Javob berish
                    </button>
                </div>
            </div>
            
            ${comment.replies && comment.replies.length > 0 ? this.createRepliesSection(comment.replies) : ''}
            
            <div class="reply-form-container mt-3 d-none" id="reply-form-${comment._id}">
                <!-- Reply form will be inserted here -->
            </div>
        `;
        
        this.attachCommentEventListeners(commentDiv);
        return commentDiv;
    }
    
    createCommentActions(comment) {
        // Add edit/delete buttons for own comments
        const currentUserId = this.getCurrentUserId();
        if (currentUserId && comment.author._id === currentUserId) {
            return `
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item edit-comment" href="#" data-comment-id="${comment._id}">
                            <i class="fas fa-edit me-2"></i>Tahrirlash
                        </a></li>
                        <li><a class="dropdown-item delete-comment text-danger" href="#" data-comment-id="${comment._id}">
                            <i class="fas fa-trash me-2"></i>O'chirish
                        </a></li>
                    </ul>
                </div>
            `;
        }
        
        return `
            <button class="btn btn-sm btn-outline-secondary flag-btn" data-comment-id="${comment._id}" title="Shikoyat qilish">
                <i class="fas fa-flag"></i>
            </button>
        `;
    }
    
    createRepliesSection(replies) {
        const repliesHtml = replies.map(reply => {
            const authorName = reply.author?.companyName || reply.author?.name || 'Anonim';
            const formattedDate = new Date(reply.createdAt).toLocaleDateString('uz-UZ');
            
            return `
                <div class="reply-item border-start border-primary ps-3 ms-4 mt-2">
                    <div class="reply-header mb-1">
                        <strong class="reply-author">${authorName}</strong>
                        <small class="text-muted ms-2">${formattedDate}</small>
                    </div>
                    <div class="reply-content">
                        <p class="mb-0">${this.escapeHtml(reply.content)}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="replies-section mt-3">
                <h6 class="text-muted mb-2">
                    <i class="fas fa-reply me-1"></i>
                    Javoblar (${replies.length})
                </h6>
                ${repliesHtml}
            </div>
        `;
    }
    
    attachCommentEventListeners(commentElement) {
        // Vote buttons
        const voteButtons = commentElement.querySelectorAll('.vote-btn');
        voteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleVote(e));
        });
        
        // Reply button
        const replyBtn = commentElement.querySelector('.reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', (e) => this.showReplyForm(e));
        }
        
        // Edit/Delete buttons
        const editBtn = commentElement.querySelector('.edit-comment');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => this.handleEdit(e));
        }
        
        const deleteBtn = commentElement.querySelector('.delete-comment');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => this.handleDelete(e));
        }
        
        // Flag button
        const flagBtn = commentElement.querySelector('.flag-btn');
        if (flagBtn) {
            flagBtn.addEventListener('click', (e) => this.handleFlag(e));
        }
    }
    
    generateStars(rating) {
        let starsHtml = '<div class="rating-stars">';
        for (let i = 1; i <= 5; i++) {
            const starClass = i <= rating ? 'fas fa-star text-warning' : 'far fa-star text-muted';
            starsHtml += `<i class="${starClass}"></i>`;
        }
        starsHtml += '</div>';
        return starsHtml;
    }
    
    getTypeIcon(type) {
        const icons = {
            'review': '<i class="fas fa-star"></i>',
            'question': '<i class="fas fa-question-circle"></i>',
            'feedback': '<i class="fas fa-comment"></i>'
        };
        return icons[type] || icons['review'];
    }
    
    getTypeLabel(type) {
        const labels = {
            'review': 'Sharh',
            'question': 'Savol',
            'feedback': 'Fikr'
        };
        return labels[type] || labels['review'];
    }
    
    updateCommentsHeader(statistics, pagination) {
        const commentsCount = document.getElementById('comments-count');
        const ratingAverage = document.querySelector('.rating-average');
        const ratingStars = document.querySelector('#rating-summary .stars');
        
        if (commentsCount) {
            commentsCount.textContent = pagination.totalComments || 0;
        }
        
        if (statistics && ratingAverage) {
            ratingAverage.textContent = (statistics.averageRating || 0).toFixed(1);
        }
        
        if (statistics && ratingStars) {
            this.updateSummaryStars(ratingStars, statistics.averageRating || 0);
        }
    }
    
    updateSummaryStars(container, rating) {
        const stars = container.querySelectorAll('i');
        stars.forEach((star, index) => {
            star.className = index < Math.round(rating) ? 'fas fa-star text-warning' : 'far fa-star text-muted';
        });
    }
    
    updateLoadMoreButton(pagination) {
        const loadMoreWrapper = document.getElementById('load-more-wrapper');
        if (!loadMoreWrapper) return;
        
        const hasMorePages = pagination.currentPage < pagination.totalPages;
        
        if (hasMorePages) {
            loadMoreWrapper.classList.remove('d-none');
        } else {
            loadMoreWrapper.classList.add('d-none');
        }
    }
    
    async handleCommentSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const form = e.target;
        const formData = new FormData(form);
        const submitBtn = document.getElementById('submit-comment');
        
        // Check if user is logged in
        if (!this.isUserLoggedIn()) {
            this.showError('Izoh qoldirish uchun tizimga kirishingiz kerak');
            this.checkAuthenticationStatus(); // Update UI
            return;
        }
        
        this.isLoading = true;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Yuklanmoqda...';
        
        try {
            const commentData = {
                content: formData.get('content'),
                type: formData.get('type'),
                rating: formData.get('rating') ? parseInt(formData.get('rating')) : null
            };
            
            const response = await fetch(`/api/products/${this.productId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include', // Include cookies for JWT authentication
                body: JSON.stringify(commentData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Izoh muvaffaqiyatli yuborildi! Moderatsiyadan o\'tgach ko\'rsatiladi.');
                form.reset();
                this.updateCharacterCount();
                this.currentPage = 1;
                await this.loadComments();
            } else {
                this.showError(result.message || 'Izoh yuborishda xatolik yuz berdi');
            }
        } catch (error) {
            // console.error('Error submitting comment:', error);
            this.showError('Izoh yuborishda xatolik yuz berdi');
        } finally {
            this.isLoading = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Izoh yuborish';
        }
    }
    
    async handleVote(e) {
        e.preventDefault();
        
        if (!this.isUserLoggedIn()) {
            this.showError('Ovoz berish uchun tizimga kirishingiz kerak');
            return;
        }
        
        const btn = e.currentTarget;
        const commentId = btn.dataset.commentId;
        const action = btn.dataset.action;
        const helpful = action === 'helpful';
        
        try {
            const response = await fetch(`/api/comments/${commentId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include', // Include cookies for JWT authentication
                body: JSON.stringify({ helpful })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update vote counts in UI
                this.updateVoteButtons(commentId, result.data);
                this.showSuccess('Ovozingiz hisobga olindi');
            } else {
                this.showError(result.message || 'Ovoz berishda xatolik yuz berdi');
            }
        } catch (error) {
            // console.error('Error voting:', error);
            this.showError('Ovoz berishda xatolik yuz berdi');
        }
    }
    
    updateVoteButtons(commentId, voteData) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;
        
        const helpfulBtn = commentElement.querySelector('[data-action="helpful"]');
        const notHelpfulBtn = commentElement.querySelector('[data-action="not-helpful"]');
        
        if (helpfulBtn) {
            helpfulBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Foydali (${voteData.helpfulVotes})`;
        }
        
        if (notHelpfulBtn) {
            notHelpfulBtn.innerHTML = `<i class="fas fa-thumbs-down"></i> Foydali emas (${voteData.notHelpfulVotes})`;
        }
    }
    
    showReplyForm(e) {
        e.preventDefault();
        
        if (!this.isUserLoggedIn()) {
            this.showError('Javob berish uchun tizimga kirishingiz kerak');
            return;
        }
        
        const btn = e.currentTarget;
        const commentId = btn.dataset.commentId;
        const replyContainer = document.getElementById(`reply-form-${commentId}`);
        
        if (!replyContainer) return;
        
        if (replyContainer.classList.contains('d-none')) {
            replyContainer.classList.remove('d-none');
            replyContainer.innerHTML = this.createReplyForm(commentId);
            this.attachReplyFormListeners(replyContainer);
            btn.innerHTML = '<i class="fas fa-times"></i> Bekor qilish';
        } else {
            replyContainer.classList.add('d-none');
            btn.innerHTML = '<i class="fas fa-reply"></i> Javob berish';
        }
    }
    
    createReplyForm(parentCommentId) {
        return `
            <div class="card">
                <div class="card-body">
                    <h6 class="mb-3">Javob yozish</h6>
                    <form class="reply-form" data-parent-comment="${parentCommentId}">
                        <div class="mb-3">
                            <textarea 
                                class="form-control" 
                                name="content" 
                                rows="3" 
                                placeholder="Javobingizni yozing..."
                                maxlength="1000"
                                required
                            ></textarea>
                        </div>
                        <div class="d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary btn-sm cancel-reply">
                                Bekor qilish
                            </button>
                            <button type="submit" class="btn btn-primary btn-sm">
                                <i class="fas fa-paper-plane me-2"></i>
                                Javob yuborish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    attachReplyFormListeners(container) {
        const form = container.querySelector('.reply-form');
        const cancelBtn = container.querySelector('.cancel-reply');
        
        if (form) {
            form.addEventListener('submit', (e) => this.handleReplySubmit(e));
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                container.classList.add('d-none');
                const replyBtn = container.parentElement.querySelector('.reply-btn');
                if (replyBtn) {
                    replyBtn.innerHTML = '<i class="fas fa-reply"></i> Javob berish';
                }
            });
        }
    }
    
    async handleReplySubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const parentCommentId = form.dataset.parentComment;
        const content = form.querySelector('textarea[name="content"]').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!content.trim()) return;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Yuklanmoqda...';
        
        try {
            const response = await fetch(`/api/products/${this.productId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include', // Include cookies for JWT authentication
                body: JSON.stringify({
                    content: content.trim(),
                    type: 'review',
                    parentComment: parentCommentId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Javob muvaffaqiyatli yuborildi!');
                this.currentPage = 1;
                await this.loadComments();
            } else {
                this.showError(result.message || 'Javob yuborishda xatolik yuz berdi');
            }
        } catch (error) {
            // console.error('Error submitting reply:', error);
            this.showError('Javob yuborishda xatolik yuz berdi');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Javob yuborish';
        }
    }
    
    // Utility methods
    isUserLoggedIn() {
        // Check if user has authentication tokens in cookies
        return document.cookie.includes('accessToken=') && 
               !document.cookie.includes('accessToken=;') &&
               !document.cookie.includes('accessToken=""');
    }
    
    getCurrentUserId() {
        // Extract user ID from JWT token or session
        try {
            const token = this.getCookie('accessToken');
            if (token && token !== '' && token !== '""') {
                // JWT tokens have 3 parts separated by dots
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    return payload.userId || payload._id;
                }
            }
        } catch (error) {
            console.warn('Could not extract user ID from token:', error.message);
        }
        return null;
    }
    
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showLoading() {
        const loading = document.getElementById('loading-comments');
        if (loading) loading.classList.remove('d-none');
    }
    
    hideLoading() {
        const loading = document.getElementById('loading-comments');
        if (loading) loading.classList.add('d-none');
    }
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
    
    showToast(message, type = 'info') {
        // Create or use existing toast system
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    checkAuthenticationStatus() {
        const isLoggedIn = this.isUserLoggedIn();
        const loginPrompt = document.getElementById('login-prompt');
        const commentFormCard = document.getElementById('comment-form-card');
        
        if (loginPrompt && commentFormCard) {
            if (!isLoggedIn) {
                loginPrompt.classList.remove('d-none');
                commentFormCard.style.display = 'none';
            } else {
                loginPrompt.classList.add('d-none');
                commentFormCard.style.display = 'block';
            }
        }
    }
    
    // Add method to refresh authentication status
    refreshAuthStatus() {
        this.checkAuthenticationStatus();
    }
}

// Initialize when DOM is ready - ONLY on public product detail pages
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a public product detail page
    const isProductDetailPage = document.querySelector('.comments-wrapper') && 
                               !window.location.pathname.includes('/manufacturer/') &&
                               !window.location.pathname.includes('/admin/');
    
    // Only initialize if on correct page and required elements exist
    if (isProductDetailPage) {
        window.productCommentsManager = new ProductCommentsManager();
    }
});
