'use client';

import { useState, useEffect } from 'react';
import ImageModal from './ImageModal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ImageGallery({ mainImage, variantImage, images = [], title, onImageClick }) {
  const [currentImage, setCurrentImage] = useState(mainImage);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  
  // Combine all images, filter out duplicates and null values
  const allImages = [mainImage, ...images].filter((img, index, self) => 
    img && self.indexOf(img) === index
  );

  useEffect(() => {
    // If there's a variant image selected, show it
    if (variantImage) {
      setCurrentImage(variantImage);
      // Find the index of the variant image in allImages
      const variantIndex = allImages.indexOf(variantImage);
      if (variantIndex !== -1) {
        setCurrentImageIndex(variantIndex);
        // Ensure the variant thumbnail is visible
        if (variantIndex < thumbnailStartIndex || variantIndex >= thumbnailStartIndex + 3) {
          setThumbnailStartIndex(Math.max(0, Math.min(variantIndex, allImages.length - 3)));
        }
      }
    } else {
      // Otherwise show the image at current index
      setCurrentImage(allImages[currentImageIndex]);
    }
  }, [variantImage, currentImageIndex, allImages, thumbnailStartIndex]);

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
    onImageClick(allImages[index]);
  };

  const handleMainImageClick = () => {
    setIsModalOpen(true);
  };

  const nextThumbnails = () => {
    setThumbnailStartIndex(prev => 
      Math.min(prev + 1, allImages.length - 3)
    );
  };

  const prevThumbnails = () => {
    setThumbnailStartIndex(prev => 
      Math.max(0, prev - 1)
    );
  };

  const visibleThumbnails = allImages.slice(thumbnailStartIndex, thumbnailStartIndex + 3);

  return (
    <div>
      {/* Main Image */}
      <div 
        className="aspect-square w-full bg-white rounded-lg overflow-hidden cursor-zoom-in mb-4"
        onClick={handleMainImageClick}
      >
        <img 
          src={currentImage}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="relative">
          <div className="grid grid-cols-3 gap-4">
            {visibleThumbnails.map((img, i) => {
              const actualIndex = thumbnailStartIndex + i;
              return (
                <button
                  key={actualIndex}
                  onClick={() => handleImageChange(actualIndex)}
                  className={`aspect-square w-full rounded-lg overflow-hidden bg-white ${
                    currentImage === img ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${title} thumbnail ${actualIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>

          {/* Carousel Navigation */}
          {allImages.length > 3 && (
            <>
              <button
                onClick={prevThumbnails}
                disabled={thumbnailStartIndex === 0}
                className={`absolute -left-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 shadow-lg ${
                  thumbnailStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
                }`}
                aria-label="Previous thumbnails"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
              </button>
              <button
                onClick={nextThumbnails}
                disabled={thumbnailStartIndex >= allImages.length - 3}
                className={`absolute -right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 shadow-lg ${
                  thumbnailStartIndex >= allImages.length - 3 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
                }`}
                aria-label="Next thumbnails"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-900" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Image Modal */}
      {isModalOpen && (
        <ImageModal
          src={currentImage}
          alt={title}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
