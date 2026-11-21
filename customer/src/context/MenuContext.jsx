import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  getRestaurantInfo,
  getCategories,
  getMenuItems,
  getSpecials,
  getPopularDishes,
  DEFAULT_PRODUCTION_BACKEND,
} from '../services/api';
import fallbackMenu from '../data/fallbackMenu.json';

const MenuContext = createContext(null);

const MENU_CACHE_KEY = 'qissa_menu_cache_v2';

const getInitialMenuData = () => {
  try {
    const raw = localStorage.getItem(MENU_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.menuItems) && parsed.menuItems.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[MenuContext] Could not load localStorage cache:', e);
  }
  return fallbackMenu;
};

const saveCache = (data) => {
  try {
    localStorage.setItem(
      MENU_CACHE_KEY,
      JSON.stringify({
        restaurant: data.restaurant,
        categories: data.categories,
        menuItems: data.menuItems,
        specials: data.specials,
        popularDishes: data.popularDishes,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn('[MenuContext] Could not persist menu cache:', e);
  }
};

export const MenuProvider = ({ children }) => {
  const initialData = useMemo(() => getInitialMenuData(), []);
  const [restaurant, setRestaurant] = useState(() => initialData?.restaurant || fallbackMenu?.restaurant || null);
  const [categories, setCategories] = useState(() => initialData?.categories || fallbackMenu?.categories || []);
  const [menuItems, setMenuItems] = useState(() => initialData?.menuItems || fallbackMenu?.menuItems || []);
  const [specials, setSpecials] = useState(() => initialData?.specials || fallbackMenu?.specials || []);
  const [popularDishes, setPopularDishes] = useState(() => initialData?.popularDishes || fallbackMenu?.popularDishes || []);
  const [currentTable, setCurrentTable] = useState(() => {
    try {
      const saved = sessionStorage.getItem('qissa_active_table');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [tableSessionToken, setTableSessionToken] = useState(() => {
    return sessionStorage.getItem('qissa_table_session_token') || null;
  });
  const [loading, setLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [error, setError] = useState(null);

  // Active Category (for Category Navigation bar & Scroll Spy tracking) - Default to 'all'
  const [activeCategory, setActiveCategory] = useState('all');

  // Ref flag indicating customer clicked a category tab and smooth scroll is underway
  const isNavigatingRef = useRef(false);
  // Ref tracking initial mount so background socket refetches never flash loading spinners
  const isInitialMountRef = useRef(true);

  // Filters & Search - Default dietary filter is 'all'
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [availableOnly, setAvailableOnly] = useState(false); // boolean
  const [searchQuery, setSearchQuery] = useState('');

  // Selected dish for Food Detail Modal
  const [selectedDish, setSelectedDish] = useState(null);

  // Food Assistant Global State
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState(null);

  const openAssistant = useCallback((initialQuery = null) => {
    if (initialQuery) {
      setAssistantInitialQuery(initialQuery);
    }
    setAssistantOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setAssistantOpen(false);
    setAssistantInitialQuery(null);
  }, []);

  const fetchAllData = useCallback(async (isInitial = false) => {
    let wakeTimer = null;
    try {
      if (isInitial || isInitialMountRef.current) {
        setMenuItems((current) => {
          if (!current || current.length === 0) setLoading(true);
          return current;
        });

        wakeTimer = setTimeout(() => {
          setIsWakingUp(true);
        }, 3000);
      }

      // Use Promise.allSettled so partial endpoint failures never crash the whole menu
      const results = await Promise.allSettled([
        getRestaurantInfo(),
        getCategories(),
        getMenuItems(),
        getSpecials(),
        getPopularDishes(),
      ]);

      const [restRes, catRes, menuRes, specRes, popRes] = results;

      let hasCoreData = false;

      if (restRes.status === 'fulfilled' && restRes.value) {
        setRestaurant(restRes.value);
      }
      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value) && catRes.value.length > 0) {
        setCategories(catRes.value);
        hasCoreData = true;
      }
      if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value) && menuRes.value.length > 0) {
        setMenuItems(menuRes.value);
        hasCoreData = true;
      }
      if (specRes.status === 'fulfilled' && Array.isArray(specRes.value)) {
        setSpecials(specRes.value);
      }
      if (popRes.status === 'fulfilled' && Array.isArray(popRes.value)) {
        setPopularDishes(popRes.value);
      }

      if (hasCoreData) {
        setError(null);
        saveCache({
          restaurant: restRes.status === 'fulfilled' ? restRes.value : initialData?.restaurant,
          categories: catRes.status === 'fulfilled' ? catRes.value : initialData?.categories,
          menuItems: menuRes.status === 'fulfilled' ? menuRes.value : initialData?.menuItems,
          specials: specRes.status === 'fulfilled' ? specRes.value : initialData?.specials,
          popularDishes: popRes.status === 'fulfilled' ? popRes.value : initialData?.popularDishes,
        });
      } else {
        const rejected = results.find((r) => r.status === 'rejected');
        if (rejected) {
          throw rejected.reason;
        }
      }
    } catch (err) {
      console.error('[MenuContext] Error fetching live data:', err);
      setMenuItems((current) => {
        if (!current || current.length === 0) {
          setError('Unable to reach the live menu server. The cloud server may still be waking up. Tap Retry to reload.');
        }
        return current;
      });
    } finally {
      if (wakeTimer) clearTimeout(wakeTimer);
      setIsWakingUp(false);
      setLoading(false);
      isInitialMountRef.current = false;
    }
  }, [initialData]);

  useEffect(() => {
    fetchAllData(true);

    // Initialize Socket.IO for real-time menu, category & price updates
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? DEFAULT_PRODUCTION_BACKEND
        : 'http://localhost:5000');
    const socket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to real-time menu stream.');
    });

    socket.on('menu:updated', (payload) => {
      console.log('[Socket.IO] Real-time menu update received:', payload);
      getMenuItems().then(setMenuItems).catch(console.error);
      getPopularDishes().then(setPopularDishes).catch(console.error);
      getCategories().then(setCategories).catch(console.error);
    });

    socket.on('availability:updated', ({ itemId, isAvailable }) => {
      console.log(`[Socket.IO] Item ${itemId} availability changed to ${isAvailable}`);
      setMenuItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, isAvailable } : item))
      );
    });

    socket.on('category:updated', () => {
      console.log('[Socket.IO] Real-time category update received');
      getCategories().then(setCategories).catch(console.error);
      getMenuItems().then(setMenuItems).catch(console.error);
    });

    socket.on('specials:updated', () => {
      getSpecials().then(setSpecials).catch(console.error);
    });

    socket.on('settings:updated', (newRest) => {
      setRestaurant(newRest);
    });

    socket.on('dish:rating_updated', ({ menuItemId, averageRating, totalRatings, ratingDistribution }) => {
      console.log(`[Socket.IO] Dish rating updated: ${menuItemId} -> ${averageRating}★ (${totalRatings})`);
      setMenuItems((prev) =>
        prev.map((item) =>
          item._id === menuItemId
            ? { ...item, averageRating, totalRatings, ratingDistribution }
            : item
        )
      );
      setPopularDishes((prev) =>
        prev.map((item) =>
          item._id === menuItemId
            ? { ...item, averageRating, totalRatings, ratingDistribution }
            : item
        )
      );
      setSelectedDish((prev) =>
        prev && prev._id === menuItemId
          ? { ...prev, averageRating, totalRatings, ratingDistribution }
          : prev
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchAllData]);

  const updateDishRatingLocally = (menuItemId, stats) => {
    setMenuItems((prev) =>
      prev.map((item) => (item._id === menuItemId ? { ...item, ...stats } : item))
    );
    setPopularDishes((prev) =>
      prev.map((item) => (item._id === menuItemId ? { ...item, ...stats } : item))
    );
    setSelectedDish((prev) =>
      prev && prev._id === menuItemId ? { ...prev, ...stats } : prev
    );
  };

  // Filtered menu items (Dietary, Availability, and Search - keeps all categories!)
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // 1. Dietary filter
      if (dietaryFilter === 'veg' && !item.isVeg) return false;
      if (dietaryFilter === 'non-veg' && item.isVeg) return false;

      // 2. Availability filter
      if (availableOnly && item.isAvailable === false) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.name.toLowerCase().includes(q);
        const arabicMatch = (item.arabicName || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!nameMatch && !arabicMatch && !descMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [menuItems, dietaryFilter, availableOnly, searchQuery]);

  // Compute live dish count per category under current dietary & availability filters
  const dishCountsByCategory = useMemo(() => {
    const counts = {};
    let totalAll = 0;
    categories.forEach((cat) => {
      const count = menuItems.filter((item) => {
        const itemCatId = item.categoryId?._id || item.categoryId;
        if (itemCatId?.toString() !== cat._id?.toString()) return false;
        if (dietaryFilter === 'veg' && !item.isVeg) return false;
        if (dietaryFilter === 'non-veg' && item.isVeg) return false;
        if (availableOnly && item.isAvailable === false) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = item.name.toLowerCase().includes(q);
          const arabicMatch = (item.arabicName || '').toLowerCase().includes(q);
          const descMatch = (item.description || '').toLowerCase().includes(q);
          const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!nameMatch && !arabicMatch && !descMatch && !tagMatch) return false;
        }
        return true;
      }).length;
      counts[cat._id] = count;
      totalAll += count;
    });
    counts['all'] = totalAll;
    return counts;
  }, [categories, menuItems, dietaryFilter, availableOnly, searchQuery]);

  // Dedicated click navigation handler: sets activeCategory, locks observer during animation, and scrolls smoothly exactly once
  const scrollToCategory = useCallback((categoryId) => {
    isNavigatingRef.current = true;
    setActiveCategory(categoryId);

    requestAnimationFrame(() => {
      const target =
        categoryId === 'all'
          ? document.getElementById('menu-header') ||
            document.getElementById('menu-section') ||
            document.getElementById('explore-categories')
          : document.getElementById(`category-${categoryId}`);

      if (target) {
        const stickyBar = document.getElementById('sticky-category-bar');
        const stickyHeight = stickyBar ? stickyBar.offsetHeight : 86;
        const navHeight = window.innerWidth >= 640 ? 64 : 56;
        const navOffset = navHeight + stickyHeight + 16;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      }

      // Unlock observer after smooth scroll animation completes
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 900);
    });
  }, []);

  return (
    <MenuContext.Provider
      value={{
        restaurant,
        categories,
        menuItems,
        filteredItems,
        specials,
        popularDishes,
        currentTable,
        setCurrentTable,
        tableSessionToken,
        setTableSessionToken,
        updateDishRatingLocally,
        loading,
        isWakingUp,
        error,
        activeCategory,
        setActiveCategory,
        selectedCategory: activeCategory, // backwards-compatible alias
        setSelectedCategory: scrollToCategory,
        selectCategory: scrollToCategory,
        scrollToCategory,
        isNavigatingRef,
        dietaryFilter,
        setDietaryFilter,
        availableOnly,
        setAvailableOnly,
        searchQuery,
        setSearchQuery,
        selectedDish,
        setSelectedDish,
        assistantOpen,
        setAssistantOpen,
        assistantInitialQuery,
        setAssistantInitialQuery,
        openAssistant,
        closeAssistant,
        dishCountsByCategory,
        refreshMenu: fetchAllData,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used within a MenuProvider');
  return context;
};
