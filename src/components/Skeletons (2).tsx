import { motion } from 'motion/react';

export function RestaurantSkeleton() {
  return (
    <div className="w-full">
      <div className="aspect-[16/10] bg-gray-200 rounded-[2rem] animate-pulse mb-4" />
      <div className="h-6 w-3/4 bg-gray-200 rounded-full animate-pulse mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded-full animate-pulse" />
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex space-x-4 mb-8 overflow-x-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-3 px-6 py-4 rounded-[2rem] border border-gray-100 bg-white min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}
