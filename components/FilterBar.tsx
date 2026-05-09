"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface FilterBarProps {
    brands: string[];
    selectedBrand: string | null;
    onBrandChange: (brand: string | null) => void;
}

export default function FilterBar({
    brands,
    selectedBrand,
    onBrandChange,
}: FilterBarProps) {
    return (
        <motion.div
            className="sticky top-16 z-40 backdrop-blur-md bg-background/80 border-b border-primary/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Title */}
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            Product Catalog
                        </h2>
                        <p className="text-sm text-foreground/60 mt-1">
                            {selectedBrand ? `Showing ${selectedBrand} products` : "All products"}
                        </p>
                    </div>

                    {/* Brand Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* All Brands Button */}
                        <motion.button
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedBrand === null
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            onClick={() => onBrandChange(null)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            All
                        </motion.button>

                        {/* Individual Brand Buttons */}
                        {brands.map((brand) => (
                            <motion.button
                                key={brand}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedBrand === brand
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                onClick={() => onBrandChange(brand)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {brand}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}