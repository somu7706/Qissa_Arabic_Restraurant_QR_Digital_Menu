import React from 'react';
import { useMenu } from '../../context/MenuContext';
import { FoodCard } from './FoodCard';
import { FoodFilters } from './FoodFilters';
import {
  Soup,
  Salad,
  UtensilsCrossed,
  Flame,
  CookingPot,
  Cake,
  GlassWater,
  Coffee,
  Sparkles,
  Utensils,
  SearchX,
  RotateCcw,
  Search,
} from 'lucide-react';

// Category Icon Mapping
const getCategoryIcon = (slug = '', name = '') => {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s.includes('soup') || n.includes('soup') || n.includes('shurba')) {
    return <Soup className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('salad') || n.includes('salad') || n.includes('sulta')) {
    return <Salad className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('hummus') || n.includes('hummus')) {
    return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('grill') || n.includes('grill') || n.includes('kebab')) {
    return <Flame className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('clay-oven') || n.includes('oven') || n.includes('manakeesh')) {
    return <Flame className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('rice') || n.includes('rice') || n.includes('mandi') || n.includes('kabsa')) {
    return <CookingPot className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('gravy') || s.includes('stew') || n.includes('gravy') || n.includes('stew')) {
    return <CookingPot className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('dessert') || n.includes('dessert') || n.includes('kunafeh') || n.includes('baklava')) {
    return <Cake className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('drink') || n.includes('drink') || n.includes('beverage') || n.includes('mojito')) {
    return <GlassWater className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('hot-beverage') || n.includes('tea') || n.includes('coffee')) {
    return <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  if (s.includes('cold-mezze') || s.includes('hot-mezze') || n.includes('mezze')) {
    return <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />;
  }
  return <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />;
};

export const FoodGrid = () => {
  const {
    filteredItems,
    categories,
    loading,
    error,
    isWakingUp,
    refreshMenu,
    searchQuery,
    setSearchQuery,
    dietaryFilter,
    setDietaryFilter,
    availableOnly,
    setAvailableOnly,
    activeCategory,
    selectCategory,
  } = useMenu();

  if (loading && categories.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <div className="inline-block w-12 h-12 border-4 border-[#E8602C] border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">Preparing Our Menu</h3>
        {isWakingUp ? (
          <p className="text-xs text-[#6B655D] leading-relaxed">
            Connecting to cloud server. If the server is waking up from sleep, this may take a few moments...
          </p>
        ) : (
          <p className="text-xs text-[#6B655D]">Loading authentic Middle Eastern dishes...</p>
        )}
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto bg-white rounded-3xl border border-[#F2EBE0] p-8 shadow-sm my-8">
        <div className="w-16 h-16 rounded-full bg-orange-100 text-[#E8602C] flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">Menu Loading Delayed</h3>
        <p className="text-xs text-[#6B655D] leading-relaxed mb-6">
          {error || 'Unable to load menu. The cloud server may still be waking up.'}
        </p>
        <button
          onClick={() => refreshMenu(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E8602C] hover:bg-[#D14E1E] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Loading Menu</span>
        </button>
      </div>
    );
  }

  // 1. Search Query View: When user actively typed in search bar
  if (searchQuery && searchQuery.trim()) {
    const isSearching = true;

    return (
      <div id="menu-section" className="space-y-8 scroll-mt-36">
        {/* Search Results Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D6]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#E8602C] shadow-xs flex-shrink-0">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-2.5">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                  Search Results
                </h3>
                <span className="text-xs text-[#8C8275] font-semibold">
                  ({filteredItems.length} {filteredItems.length === 1 ? 'match' : 'matches'})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6B655D] mt-0.5">
                Showing dishes matching "{searchQuery.trim()}"
              </p>
            </div>
          </div>

          {/* Filters on right side */}
          <div className="flex flex-wrap items-center gap-3">
            <FoodFilters />
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-[#E8602C] hover:underline px-2 py-1"
            >
              Clear Search
            </button>
          </div>
        </div>

        {/* Results Grid (2 Columns on mobile) */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredItems.map((item) => (
              <FoodCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="py-16 px-4 text-center max-w-md mx-auto bg-white rounded-3xl border border-[#F2EBE0] p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#E8602C]/10 text-[#E8602C] flex items-center justify-center mx-auto mb-4">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">No Matching Dishes</h3>
            <p className="text-xs text-[#6B655D] leading-relaxed mb-6">
              We couldn't find any dishes matching "{searchQuery}". Try different keywords or reset your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setDietaryFilter('all');
                setAvailableOnly(false);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E8602C] text-white text-xs font-bold hover:bg-[#D14E1E] transition-all shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Complete Menu: Render each category section sequentially
  const categoryGroups = categories.map((cat) => {
    const items = filteredItems.filter((item) => {
      const itemCatId = item.categoryId?._id || item.categoryId;
      return itemCatId?.toString() === cat._id.toString();
    });
    return { category: cat, items };
  });

  return (
    <div id="menu-section" className="space-y-12 sm:space-y-16">
      {/* Global menu header with dietary filter bar */}
      <div
        id="menu-header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D6]"
      >
        <div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Complete Menu
          </h3>
          <p className="text-xs sm:text-sm text-[#6B655D] mt-0.5">
            Explore our full collection of authentic Arabic culinary masterpieces
          </p>
        </div>
        <FoodFilters />
      </div>

      {categoryGroups.map(({ category, items }) => {
        const hasItems = items.length > 0;

        return (
          <section
            key={category._id}
            id={`category-${category._id}`}
            data-category-id={category._id}
            className="scroll-mt-36"
          >
            {/* Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#E8602C] shadow-xs flex-shrink-0">
                  {getCategoryIcon(category.slug, category.name)}
                </div>
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                      {category.name}
                    </h3>
                    {category.arabicName && (
                      <span className="font-arabic text-base sm:text-lg text-[#C9953C]">
                        {category.arabicName}
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-xs sm:text-sm text-[#6B655D] mt-0.5 leading-snug">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="self-start sm:self-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#EAE3D6] text-xs font-semibold text-[#8C8275]">
                  {items.length} {items.length === 1 ? 'dish' : 'dishes'}
                </span>
              </div>
            </div>

            {/* Category Food Grid (2 Columns on mobile matching Screen 2) */}
            {hasItems ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {items.map((item) => (
                  <FoodCard key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center bg-white/60 rounded-2xl border border-dashed border-[#EAE3D6] max-w-md mx-auto">
                <p className="text-xs text-[#8C8275]">
                  No {dietaryFilter !== 'all' ? dietaryFilter : ''} dishes match in{' '}
                  <span className="font-semibold text-[#1A1A1A]">{category.name}</span>.
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
