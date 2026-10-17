import { useState, useCallback, useMemo, useRef } from 'react';
import { apiClient } from '../../../core/infrastructure/api.client';
import type { UrlAnalysisResponse, ListingContextInput } from '../../../core/domain/models';

export function isMarketplaceUrl(rawUrl: string): { isListing: boolean; platform: string | null } {
  const lower = rawUrl.toLowerCase().trim();
  if (!lower) return { isListing: false, platform: null };

  if (lower.includes('leboncoin.fr')) {
    return { isListing: true, platform: 'Leboncoin' };
  }
  if (/vinted\.(fr|com|be|es|it|de)/.test(lower)) {
    return { isListing: true, platform: 'Vinted' };
  }
  if (/ebay\.(fr|com)/.test(lower)) {
    return { isListing: true, platform: 'eBay' };
  }
  if (lower.includes('rakuten.com')) {
    return { isListing: true, platform: 'Rakuten' };
  }
  if (lower.includes('paruvendu.fr')) {
    return { isListing: true, platform: 'ParuVendu' };
  }
  return { isListing: false, platform: null };
}

export function useUrlScanner() {
  const [urlInput, setUrlInputState] = useState('');
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingTitle, setListingTitle] = useState('');
  const [listingPrice, setListingPrice] = useState<string>('');
  const [listingDescription, setListingDescription] = useState('');
  const [sellerUsername, setSellerUsername] = useState('');
  const [sellerRatingsCount, setSellerRatingsCount] = useState<string>('');
  const [photosCount, setPhotosCount] = useState<string>('');
  const [paymentMethodRequested, setPaymentMethodRequested] =
    useState<ListingContextInput['paymentMethodRequested']>('platform_secure');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScannedUrlRef = useRef<string>('');

  const detectedMarketplace = useMemo(() => isMarketplaceUrl(urlInput), [urlInput]);

  const resetListingFields = useCallback(() => {
    setListingTitle('');
    setListingPrice('');
    setListingDescription('');
    setSellerUsername('');
    setSellerRatingsCount('');
    setPhotosCount('');
    setPaymentMethodRequested('platform_secure');
  }, []);

  const setUrlInput = useCallback(
    (nextUrl: string) => {
      setUrlInputState(nextUrl);
      if (lastScannedUrlRef.current && nextUrl.trim() !== lastScannedUrlRef.current) {
        resetListingFields();
        lastScannedUrlRef.current = '';
      }
    },
    [resetListingFields]
  );

  const buildCurrentContext = useCallback((): ListingContextInput | undefined => {
    const hasAnyField =
      listingTitle.trim() !== '' ||
      listingPrice.trim() !== '' ||
      listingDescription.trim() !== '' ||
      sellerUsername.trim() !== '' ||
      sellerRatingsCount.trim() !== '' ||
      photosCount.trim() !== '' ||
      showListingForm;

    if (!hasAnyField && !detectedMarketplace.isListing) {
      return undefined;
    }

    const parsedPrice = listingPrice.trim() !== '' ? Number(listingPrice) : null;
    const parsedRatings = sellerRatingsCount.trim() !== '' ? Number(sellerRatingsCount) : null;
    const parsedPhotos = photosCount.trim() !== '' ? Number(photosCount) : null;

    if (
      !listingTitle.trim() &&
      parsedPrice === null &&
      !listingDescription.trim() &&
      !sellerUsername.trim() &&
      parsedRatings === null &&
      parsedPhotos === null &&
      paymentMethodRequested === 'platform_secure'
    ) {
      return undefined;
    }

    return {
      title: listingTitle.trim() || undefined,
      price: parsedPrice !== null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
      description: listingDescription.trim() || undefined,
      sellerUsername: sellerUsername.trim() || undefined,
      sellerRatingsCount: parsedRatings !== null && !Number.isNaN(parsedRatings) ? parsedRatings : null,
      photosCount: parsedPhotos !== null && !Number.isNaN(parsedPhotos) ? parsedPhotos : null,
      paymentMethodRequested,
    };
  }, [
    listingTitle,
    listingPrice,
    listingDescription,
    sellerUsername,
    sellerRatingsCount,
    photosCount,
    paymentMethodRequested,
    showListingForm,
    detectedMarketplace.isListing,
  ]);

  const scanUrl = useCallback(
    async (overrideUrl?: string, overrideContext?: ListingContextInput) => {
      const target = (overrideUrl ?? urlInput).trim();
      if (!target) return;

      setLoading(true);
      setError(null);
      setResult(null);

      let contextToUse = overrideContext;
      if (overrideUrl !== undefined && overrideContext === undefined) {
        resetListingFields();
        setShowListingForm(false);
      } else if (overrideContext) {
        setListingTitle(overrideContext.title || '');
        setListingPrice(
          overrideContext.price !== undefined && overrideContext.price !== null
            ? String(overrideContext.price)
            : ''
        );
        setListingDescription(overrideContext.description || '');
        setSellerUsername(overrideContext.sellerUsername || '');
        setSellerRatingsCount(
          overrideContext.sellerRatingsCount !== undefined && overrideContext.sellerRatingsCount !== null
            ? String(overrideContext.sellerRatingsCount)
            : ''
        );
        setPhotosCount(
          overrideContext.photosCount !== undefined && overrideContext.photosCount !== null
            ? String(overrideContext.photosCount)
            : ''
        );
        setPaymentMethodRequested(overrideContext.paymentMethodRequested || 'platform_secure');
        setShowListingForm(true);
      } else {
        contextToUse = buildCurrentContext();
      }

      try {
        const data = await apiClient.analyzeUrl(target, contextToUse);
        setResult(data);
        lastScannedUrlRef.current = target;
        if (overrideUrl) setUrlInputState(overrideUrl);

        // Auto-populate form fields with extracted marketplace data
        if (data.listingAnalysis?.isMarketplaceListing && !overrideContext) {
          const la = data.listingAnalysis;
          if (la.dataCompleteness === 'PARTIAL_URL_ONLY') {
            setShowListingForm(true);
          }
          if (!listingTitle && la.detectedTitle) {
            setListingTitle(la.detectedTitle);
          }
          if (!listingPrice && la.detectedPrice !== null) {
            setListingPrice(String(la.detectedPrice));
          }
          if (!listingDescription && la.detectedDescription) {
            setListingDescription(la.detectedDescription);
          }
          if (!sellerUsername && la.sellerUsername) {
            setSellerUsername(la.sellerUsername);
          }
          if (!sellerRatingsCount && la.sellerRatingsCount !== null) {
            setSellerRatingsCount(String(la.sellerRatingsCount));
          }
          if (!photosCount && la.photosCount !== null) {
            setPhotosCount(String(la.photosCount));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de joindre le service d’analyse');
      } finally {
        setLoading(false);
      }
    },
    [
      urlInput,
      buildCurrentContext,
      resetListingFields,
      listingTitle,
      listingPrice,
      listingDescription,
      sellerUsername,
      sellerRatingsCount,
      photosCount,
    ]
  );

  return {
    urlInput,
    setUrlInput,
    detectedMarketplace,
    showListingForm,
    setShowListingForm,
    listingTitle,
    setListingTitle,
    listingPrice,
    setListingPrice,
    listingDescription,
    setListingDescription,
    sellerUsername,
    setSellerUsername,
    sellerRatingsCount,
    setSellerRatingsCount,
    photosCount,
    setPhotosCount,
    paymentMethodRequested,
    setPaymentMethodRequested,
    resetListingFields,
    loading,
    result,
    error,
    scanUrl,
  };
}
