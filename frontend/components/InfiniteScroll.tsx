import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  loader?: React.ReactNode;
  endMessage?: string;
  className?: string;
  gridClassName?: string;
  itemClassName?: string;
  threshold?: number;
  pageSize?: number;
}

function InfiniteScroll<T>({
  items,
  renderItem,
  onLoadMore,
  hasMore,
  loading = false,
  loader,
  endMessage = "Fin des résultats",
  className = "",
  gridClassName = "",
  itemClassName = "",
  threshold = 100,
  pageSize = 20
}: InfiniteScrollProps<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const computedHasMore = hasMore ?? visibleItems.length < items.length;

  // Initialiser les éléments visibles
  useEffect(() => {
    setVisibleItems(items.slice(0, page * pageSize));
  }, [items, page, pageSize]);

  // Configurer l'Intersection Observer pour le lazy loading
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && computedHasMore && !loading && !loadingRef.current) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [computedHasMore, loading, threshold]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !computedHasMore) return;
    
    loadingRef.current = true;
    try {
      if (onLoadMore) {
        await onLoadMore();
      }
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      loadingRef.current = false;
    }
  }, [onLoadMore, computedHasMore]);

  return (
    <div className={`infinite-scroll ${className}`}>
      <div className={`grid gap-4 ${gridClassName}`.trim()}>
        {visibleItems.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loader ou message de fin */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {loading && (
          loader || <LoadingSpinner size="lg" />
        )}
        
        {!loading && !computedHasMore && items.length > 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-medium">{endMessage}</p>
            <p className="text-sm mt-2">
              {items.length} résultat{items.length > 1 ? 's' : ''} affiché{items.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
        
        {!loading && computedHasMore && (
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loadingRef.current}
          >
            Charger plus
          </button>
        )}
      </div>
    </div>
  );
}

export default InfiniteScroll;

// Composant de pagination classique
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className = ""
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 5 });

  // Calculer les pages à afficher
  const getVisiblePages = () => {
    const pages: number[] = [];
    const { start, end } = visibleRange;
    
    for (let i = start; i <= Math.min(end, totalPages); i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // Mettre à jour la plage visible quand la page change
  useEffect(() => {
    if (currentPage < visibleRange.start) {
      setVisibleRange({ start: Math.max(1, currentPage - 2), end: currentPage + 2 });
    } else if (currentPage > visibleRange.end) {
      setVisibleRange({ start: currentPage - 2, end: Math.min(totalPages, currentPage + 2) });
    }
  }, [currentPage, totalPages, visibleRange.end]);

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visibleRange.start > 1;
  const showEndEllipsis = visibleRange.end < totalPages;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`flex items-center justify-between flex-wrap gap-4 ${className}`}>
      {/* Informations */}
      <div className="text-sm text-gray-600">
        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} résultats
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center gap-2">
        {/* Bouton précédent */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>

        {/* Première page et ellipsis */}
        {showStartEllipsis && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              1
            </button>
            <span className="px-2 text-gray-500">...</span>
          </>
        )}

        {/* Pages visibles */}
        {visiblePages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm border rounded-md transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Ellipsis et dernière page */}
        {showEndEllipsis && (
          <>
            <span className="px-2 text-gray-500">...</span>
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Bouton suivant */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};
