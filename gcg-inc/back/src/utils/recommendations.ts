// AI-powered recommendation and personalization engine

import { ProductItem } from '../components/ProductGrid';

interface UserBehavior {
  viewedProducts: string[];
  purchaseHistory: string[];
  cartItems: string[];
  searchHistory: string[];
  categoryPreferences: Record<string, number>;
  priceRange: { min: number; max: number };
  brandPreferences: Record<string, number>;
  sessionData: {
    timeSpent: Record<string, number>;
    interactions: Array<{
      type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'search';
      productId?: string;
      timestamp: number;
      data?: any;
    }>;
  };
}

interface RecommendationConfig {
  maxResults: number;
  includeOutOfStock: boolean;
  diversityWeight: number;
  recencyWeight: number;
  popularityWeight: number;
}

interface RecommendationResult {
  productId: string;
  score: number;
  reason: 'similar_views' | 'popular' | 'trending' | 'category_match' | 'brand_match' | 'price_match' | 'collaborative';
  confidence: number;
}

class RecommendationEngine {
  private userBehavior: UserBehavior = {
    viewedProducts: [],
    purchaseHistory: [],
    cartItems: [],
    searchHistory: [],
    categoryPreferences: {},
    priceRange: { min: 0, max: Infinity },
    brandPreferences: {},
    sessionData: {
      timeSpent: {},
      interactions: []
    }
  };

  private products: ProductItem[] = [];
  private isInitialized = false;

  constructor() {
    this.loadUserBehavior();
  }

  async initialize(products: ProductItem[]) {
    this.products = products;
    this.isInitialized = true;
    await this.buildUserProfile();
  }

  private loadUserBehavior() {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('userBehavior');
      if (saved) {
        this.userBehavior = { ...this.userBehavior, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load user behavior:', error);
    }
  }

  private saveUserBehavior() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('userBehavior', JSON.stringify(this.userBehavior));
    } catch (error) {
      console.warn('Failed to save user behavior:', error);
    }
  }

  // Track user interactions
  trackProductView(productId: string, timeSpent: number = 0) {
    if (!this.userBehavior.viewedProducts.includes(productId)) {
      this.userBehavior.viewedProducts.push(productId);
    }
    
    this.userBehavior.sessionData.timeSpent[productId] = 
      (this.userBehavior.sessionData.timeSpent[productId] || 0) + timeSpent;
    
    this.userBehavior.sessionData.interactions.push({
      type: 'view',
      productId,
      timestamp: Date.now()
    });

    this.updatePreferences(productId);
    this.saveUserBehavior();
  }

  trackAddToCart(productId: string) {
    if (!this.userBehavior.cartItems.includes(productId)) {
      this.userBehavior.cartItems.push(productId);
    }
    
    this.userBehavior.sessionData.interactions.push({
      type: 'add_to_cart',
      productId,
      timestamp: Date.now()
    });

    this.updatePreferences(productId, 2); // Higher weight for cart actions
    this.saveUserBehavior();
  }

  trackPurchase(productIds: string[]) {
    productIds.forEach(productId => {
      if (!this.userBehavior.purchaseHistory.includes(productId)) {
        this.userBehavior.purchaseHistory.push(productId);
      }
      
      this.userBehavior.sessionData.interactions.push({
        type: 'purchase',
        productId,
        timestamp: Date.now()
      });

      this.updatePreferences(productId, 3); // Highest weight for purchases
    });

    // Remove purchased items from cart
    this.userBehavior.cartItems = this.userBehavior.cartItems.filter(
      id => !productIds.includes(id)
    );

    this.saveUserBehavior();
  }

  trackSearch(query: string, results: number = 0) {
    this.userBehavior.searchHistory.unshift(query);
    if (this.userBehavior.searchHistory.length > 10) {
      this.userBehavior.searchHistory = this.userBehavior.searchHistory.slice(0, 10);
    }
    
    this.userBehavior.sessionData.interactions.push({
      type: 'search',
      timestamp: Date.now(),
      data: { query, results }
    });

    this.saveUserBehavior();
  }

  private updatePreferences(productId: string, weight: number = 1) {
    const product = this.products.find(p => p._id === productId);
    if (!product) return;

    // Update category preferences
    this.userBehavior.categoryPreferences[product.category] = 
      (this.userBehavior.categoryPreferences[product.category] || 0) + weight;

    // Update brand preferences
    if (product.brand) {
      this.userBehavior.brandPreferences[product.brand] = 
        (this.userBehavior.brandPreferences[product.brand] || 0) + weight;
    }

    // Update price range preferences
    const price = product.basePrice;
    if (this.userBehavior.priceRange.min === 0 || price < this.userBehavior.priceRange.min) {
      this.userBehavior.priceRange.min = price;
    }
    if (price > this.userBehavior.priceRange.max || this.userBehavior.priceRange.max === Infinity) {
      this.userBehavior.priceRange.max = price;
    }
  }

  private async buildUserProfile() {
    // Analyze user behavior patterns
    const recentInteractions = this.userBehavior.sessionData.interactions
      .filter(i => Date.now() - i.timestamp < 7 * 24 * 60 * 60 * 1000); // Last 7 days

    // Calculate engagement scores
    const engagementScores: Record<string, number> = {};
    recentInteractions.forEach(interaction => {
      if (!interaction.productId) return;
      
      const weight = {
        'view': 1,
        'click': 2,
        'add_to_cart': 5,
        'purchase': 10,
        'search': 0.5
      }[interaction.type] || 1;

      engagementScores[interaction.productId] = 
        (engagementScores[interaction.productId] || 0) + weight;
    });

    // Update preferences based on engagement
    Object.entries(engagementScores).forEach(([productId, score]) => {
      this.updatePreferences(productId, score / 10);
    });
  }

  // Generate personalized recommendations
  async getRecommendations(
    config: Partial<RecommendationConfig> = {}
  ): Promise<RecommendationResult[]> {
    if (!this.isInitialized) {
      throw new Error('Recommendation engine not initialized');
    }

    const fullConfig: RecommendationConfig = {
      maxResults: 8,
      includeOutOfStock: false,
      diversityWeight: 0.3,
      recencyWeight: 0.2,
      popularityWeight: 0.1,
      ...config
    };

    const recommendations: RecommendationResult[] = [];

    // Content-based filtering
    const contentBasedRecs = await this.getContentBasedRecommendations(fullConfig);
    recommendations.push(...contentBasedRecs);

    // Collaborative filtering (simplified)
    const collaborativeRecs = await this.getCollaborativeRecommendations(fullConfig);
    recommendations.push(...collaborativeRecs);

    // Trending products
    const trendingRecs = await this.getTrendingRecommendations(fullConfig);
    recommendations.push(...trendingRecs);

    // Popular products
    const popularRecs = await this.getPopularRecommendations(fullConfig);
    recommendations.push(...popularRecs);

    // Remove duplicates and sort by score
    const uniqueRecs = this.removeDuplicates(recommendations);
    const scoredRecs = this.calculateFinalScores(uniqueRecs, fullConfig);

    return scoredRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, fullConfig.maxResults);
  }

  private async getContentBasedRecommendations(
    config: RecommendationConfig
  ): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];
    
    // Recently viewed products similarity
    const recentlyViewed = this.userBehavior.viewedProducts.slice(-5);
    for (const viewedId of recentlyViewed) {
      const viewedProduct = this.products.find(p => p._id === viewedId);
      if (!viewedProduct) continue;

      const similarProducts = this.products.filter(product => {
        if (product._id === viewedId) return false;
        if (!config.includeOutOfStock && !this.isInStock(product)) return false;
        if (this.userBehavior.purchaseHistory.includes(product._id)) return false;

        return (
          product.category === viewedProduct.category ||
          product.brand === viewedProduct.brand ||
          Math.abs(product.basePrice - viewedProduct.basePrice) / viewedProduct.basePrice < 0.3
        );
      });

      similarProducts.forEach(product => {
        let score = 0.5;
        
        if (product.category === viewedProduct.category) score += 0.3;
        if (product.brand === viewedProduct.brand) score += 0.2;
        
        const priceSimiliarity = 1 - Math.abs(product.basePrice - viewedProduct.basePrice) / 
          Math.max(product.basePrice, viewedProduct.basePrice);
        score += priceSimiliarity * 0.2;

        recommendations.push({
          productId: product._id,
          score,
          reason: 'similar_views',
          confidence: 0.8
        });
      });
    }

    return recommendations;
  }

  private async getCollaborativeRecommendations(
    config: RecommendationConfig
  ): Promise<RecommendationResult[]> {
    // Simplified collaborative filtering
    // In a real implementation, this would use user-user or item-item collaborative filtering
    const recommendations: RecommendationResult[] = [];
    
    // Find products often viewed together
    const viewedProducts = this.userBehavior.viewedProducts;
    const cartItems = this.userBehavior.cartItems;
    const allUserProducts = [...new Set([...viewedProducts, ...cartItems])];

    // Simple co-occurrence based recommendations
    const coOccurrences: Record<string, number> = {};
    
    allUserProducts.forEach(productId => {
      const relatedProducts = this.products.filter(p => 
        p._id !== productId && 
        p.category === this.products.find(prod => prod._id === productId)?.category
      );
      
      relatedProducts.forEach(related => {
        coOccurrences[related._id] = (coOccurrences[related._id] || 0) + 1;
      });
    });

    Object.entries(coOccurrences).forEach(([productId, count]) => {
      if (this.userBehavior.purchaseHistory.includes(productId)) return;
      
      const product = this.products.find(p => p._id === productId);
      if (!product) return;
      if (!config.includeOutOfStock && !this.isInStock(product)) return;

      recommendations.push({
        productId,
        score: Math.min(count / allUserProducts.length, 1),
        reason: 'collaborative',
        confidence: 0.6
      });
    });

    return recommendations;
  }

  private async getTrendingRecommendations(
    config: RecommendationConfig
  ): Promise<RecommendationResult[]> {
    // Mock trending algorithm - in reality, this would analyze recent user activity across all users
    const recommendations: RecommendationResult[] = [];
    
    const trendingProducts = this.products
      .filter(product => {
        if (this.userBehavior.purchaseHistory.includes(product._id)) return false;
        if (!config.includeOutOfStock && !this.isInStock(product)) return false;
        return product.featured || product.onSale || product.limitedEdition;
      })
      .slice(0, 4);

    trendingProducts.forEach(product => {
      let score = 0.4;
      if (product.featured) score += 0.2;
      if (product.onSale) score += 0.2;
      if (product.limitedEdition) score += 0.3;

      recommendations.push({
        productId: product._id,
        score,
        reason: 'trending',
        confidence: 0.7
      });
    });

    return recommendations;
  }

  private async getPopularRecommendations(
    config: RecommendationConfig
  ): Promise<RecommendationResult[]> {
    // Mock popularity based on featured status and category preferences
    const recommendations: RecommendationResult[] = [];
    
    const userPreferredCategories = Object.entries(this.userBehavior.categoryPreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    const popularProducts = this.products
      .filter(product => {
        if (this.userBehavior.purchaseHistory.includes(product._id)) return false;
        if (!config.includeOutOfStock && !this.isInStock(product)) return false;
        return userPreferredCategories.includes(product.category) || product.featured;
      })
      .slice(0, 4);

    popularProducts.forEach(product => {
      let score = 0.3;
      if (userPreferredCategories.includes(product.category)) score += 0.3;
      if (product.featured) score += 0.2;

      recommendations.push({
        productId: product._id,
        score,
        reason: 'popular',
        confidence: 0.6
      });
    });

    return recommendations;
  }

  private removeDuplicates(recommendations: RecommendationResult[]): RecommendationResult[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.productId)) return false;
      seen.add(rec.productId);
      return true;
    });
  }

  private calculateFinalScores(
    recommendations: RecommendationResult[],
    config: RecommendationConfig
  ): RecommendationResult[] {
    return recommendations.map(rec => {
      const product = this.products.find(p => p._id === rec.productId);
      if (!product) return rec;

      let finalScore = rec.score;

      // Apply category preference boost
      const categoryScore = this.userBehavior.categoryPreferences[product.category] || 0;
      finalScore += (categoryScore / 10) * 0.2;

      // Apply brand preference boost
      const brandScore = product.brand ? this.userBehavior.brandPreferences[product.brand] || 0 : 0;
      finalScore += (brandScore / 10) * 0.1;

      // Apply price preference boost
      const userPriceRange = this.userBehavior.priceRange;
      if (product.basePrice >= userPriceRange.min && product.basePrice <= userPriceRange.max) {
        finalScore += 0.1;
      }

      // Apply diversity penalty to avoid too similar recommendations
      finalScore *= (1 - config.diversityWeight * 0.1);

      return {
        ...rec,
        score: Math.min(finalScore, 1)
      };
    });
  }

  private isInStock(product: ProductItem): boolean {
    return product.variants?.some(variant => variant.stock > 0) ?? true;
  }

  // Get recommended products for a specific product page
  async getSimilarProducts(productId: string, maxResults: number = 4): Promise<ProductItem[]> {
    const currentProduct = this.products.find(p => p._id === productId);
    if (!currentProduct) return [];

    const similarProducts = this.products
      .filter(product => {
        if (product._id === productId) return false;
        return (
          product.category === currentProduct.category ||
          product.brand === currentProduct.brand ||
          Math.abs(product.basePrice - currentProduct.basePrice) / currentProduct.basePrice < 0.5
        );
      })
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (a.category === currentProduct.category) scoreA += 3;
        if (b.category === currentProduct.category) scoreB += 3;

        if (a.brand === currentProduct.brand) scoreA += 2;
        if (b.brand === currentProduct.brand) scoreB += 2;

        const priceScoreA = 1 - Math.abs(a.basePrice - currentProduct.basePrice) / currentProduct.basePrice;
        const priceScoreB = 1 - Math.abs(b.basePrice - currentProduct.basePrice) / currentProduct.basePrice;

        scoreA += priceScoreA;
        scoreB += priceScoreB;

        return scoreB - scoreA;
      })
      .slice(0, maxResults);

    return similarProducts;
  }

  // Clear user behavior data
  clearUserData() {
    this.userBehavior = {
      viewedProducts: [],
      purchaseHistory: [],
      cartItems: [],
      searchHistory: [],
      categoryPreferences: {},
      priceRange: { min: 0, max: Infinity },
      brandPreferences: {},
      sessionData: {
        timeSpent: {},
        interactions: []
      }
    };
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userBehavior');
    }
  }

  // Get user insights for analytics
  getUserInsights() {
    const topCategories = Object.entries(this.userBehavior.categoryPreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    const topBrands = Object.entries(this.userBehavior.brandPreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      profileCompleteness: this.calculateProfileCompleteness(),
      topCategories: topCategories.map(([category, score]) => ({ category, score })),
      topBrands: topBrands.map(([brand, score]) => ({ brand, score })),
      priceRange: this.userBehavior.priceRange,
      engagementLevel: this.calculateEngagementLevel(),
      recentActivity: this.userBehavior.sessionData.interactions.slice(-10)
    };
  }

  private calculateProfileCompleteness(): number {
    let score = 0;
    if (this.userBehavior.viewedProducts.length > 0) score += 25;
    if (this.userBehavior.searchHistory.length > 0) score += 25;
    if (Object.keys(this.userBehavior.categoryPreferences).length > 0) score += 25;
    if (this.userBehavior.purchaseHistory.length > 0) score += 25;
    return score;
  }

  private calculateEngagementLevel(): 'low' | 'medium' | 'high' {
    const totalInteractions = this.userBehavior.sessionData.interactions.length;
    if (totalInteractions < 5) return 'low';
    if (totalInteractions < 20) return 'medium';
    return 'high';
  }
}

// Singleton instance
export const recommendationEngine = new RecommendationEngine();

// Export utility functions
export const initializeRecommendations = (products: ProductItem[]) => {
  return recommendationEngine.initialize(products);
};

export const trackProductView = (productId: string, timeSpent?: number) => {
  recommendationEngine.trackProductView(productId, timeSpent);
};

export const trackAddToCart = (productId: string) => {
  recommendationEngine.trackAddToCart(productId);
};

export const trackPurchase = (productIds: string[]) => {
  recommendationEngine.trackPurchase(productIds);
};

export const trackSearch = (query: string, results?: number) => {
  recommendationEngine.trackSearch(query, results);
};

export const getRecommendations = (config?: Partial<RecommendationConfig>) => {
  return recommendationEngine.getRecommendations(config);
};

export const getSimilarProducts = (productId: string, maxResults?: number) => {
  return recommendationEngine.getSimilarProducts(productId, maxResults);
};

export default recommendationEngine;